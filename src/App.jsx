import { useState, useEffect, useCallback, useRef} from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getCurrentUser, getToken, refreshSessionIfActive, clearSession, setLastActivity, isAdmin as isAdminUser } from './services/authService.jsx';
import { getEvents, createEvent, updateEvent, deleteEventById, getGeneratorStatus, normalizeEvent } from './services/eventServices.jsx';
import Home from "./pages/Home";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import Chat from "./pages/Chat";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import "./style.css";


function App() {
  const API_URL = "/api/events";
  const PAGE_SIZE = 10;

  const loadSavedEvents = () => {
    const saved = localStorage.getItem("local-events-cache");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // Remove any pending items created by older clients (Ids starting with 'pending-')
      const cleaned = parsed.filter((event) => !String(event.Id).startsWith('pending-'));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem("local-events-cache", JSON.stringify(cleaned));
      }
      return cleaned;
    } catch (err) {
      localStorage.removeItem("local-events-cache");
      return [];
    }
  };

  const [events, setEvents] = useState(() => loadSavedEvents());

  const [outbox, setOutbox] = useState(() => {
    const saved = localStorage.getItem("pending-actions");
    return saved ? JSON.parse(saved) : [];
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState(() => getCurrentUser()); // Added state back to track application session

  useEffect(() => {
    localStorage.setItem("local-events-cache", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("pending-actions", JSON.stringify(outbox));
  }, [outbox]);

  const loadPage = useCallback(async (page) => {
    try {
      const pageEvents = await getEvents(page, PAGE_SIZE);

      setEvents(prev => {
        const pendingEvents = prev.filter(e => 
          String(e.Id).startsWith('pending-') || e.isPending === true
        );

        if (page === 0) {
          return [...pendingEvents, ...pageEvents];
        } else {
          return [...prev, ...pageEvents];
        }
      });

      setCurrentPage(page);
      setHasMore(pageEvents.length === PAGE_SIZE);
      setIsOnline(true);

    } catch (error) {
      console.error("Failed to load events:", error);
      setIsOnline(false);
    }
  }, [PAGE_SIZE]);

  const syncOutbox = useCallback(async () => {
  if (outbox.length === 0) return;

  const currentUserObj = getCurrentUser();
  if (!currentUserObj) { setOutbox([]); return; }

  const token = getToken();
  if (!token) { setOutbox([]); return; }

  // Check token expiry before attempting sync
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      // Token expired — clear session and outbox, force re-login
      clearSession();
      setOutbox([]);
      setUser(null);
      return;
    }
  } catch (e) {
    setOutbox([]);
    return;
  }

  const queue = [...outbox];
  const successfulActions = [];

  for (const action of queue) {
    try {
      const payload = {
        Title: action.data?.Title,
        Location: action.data?.Location,
        City: action.data?.City,
        Country: action.data?.Country || "Romania",
        EventType: action.data?.EventType,
        Genre: action.data?.Genre,
        Capacity: parseInt(action.data?.Capacity) || 0,
        Description: action.data?.Description,
        DateTime: action.data?.DateTime,
        PhotoUrl: action.data?.PhotoUrl,
        FormLink: action.data?.FormLink,
        Tags: (action.data?.Tags || action.data?.tags || []).map(t => ({
          Name: typeof t === 'string' ? t : (t.Name || t.name)
        }))
      };

      if (action.type === 'SAVE') {
        if (action.isNew) {
          await createEvent(payload);
        } else {
          await updateEvent(action.data.Id, payload);
        }
      } else if (action.type === 'DELETE') {
        await deleteEventById(action.id);
      }
      successfulActions.push(action);
    } catch (err) {
      console.error('Sync error (full):', err);
      // On 403/401, clear the whole outbox — retrying won't help
      if (err.message === 'Forbidden' || err.message === 'Unauthorized') {
        setOutbox([]);
        return;
      }
      break; // For other errors, stop and retry next cycle
    }
  }

  setOutbox(prev => prev.filter(a => !successfulActions.includes(a)));
  loadPage(0);
}, [outbox, loadPage]);

  // Auth synchronization hook
  useEffect(() => {
    const checkUser = () => {
      setUser(getCurrentUser());
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  // BRONZE REQUIREMENT: Inactivity tracking system (Logs out after 15 minutes)
  useEffect(() => {
    if (!user) return;

    const checkInactivity = () => {
      if (!refreshSessionIfActive()) {
        alert('You have been logged out due to inactivity.');
        clearSession();
        setUser(null);
        window.location.href = '/login';
      }
    };

    const updateActivity = () => {
      setLastActivity();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    const interval = setInterval(checkInactivity, 30000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      clearInterval(interval);
    };
  }, [user]);

  const saveEvent = async (eventData) => {
    const activeUser = getCurrentUser();
    const currentUserId = activeUser?.id || activeUser?.Id;

    const isNew = !eventData.Id || String(eventData.Id).startsWith('pending-');
    const currentId = eventData.Id;
    const tempId = isNew ? (currentId || `pending-${Date.now()}`) : currentId;

    const normalizedEvent = {
      ...eventData,
      Id: tempId,
      isPending: true,
      createdBy: eventData.createdBy || { id: activeUser?.id, username: activeUser?.username }
    };

    setEvents(prev => {
      const exists = prev.some(e => String(e.Id) === String(tempId));
      if (exists) return prev.map(e => String(e.Id) === String(tempId) ? normalizedEvent : e);
      return [normalizedEvent, ...prev];
    });

    if (!isOnline) {
      setOutbox(prev => [...prev, { type: "SAVE", data: normalizedEvent, isNew }]);
      return;
    }

    try {
      const payload = {
        Title: normalizedEvent.Title,
        Location: normalizedEvent.Location,
        City: normalizedEvent.City,
        Country: normalizedEvent.Country || "Romania",
        EventType: normalizedEvent.EventType,
        Genre: normalizedEvent.Genre,
        Capacity: parseInt(normalizedEvent.Capacity) || 0,
        Description: normalizedEvent.Description,
        DateTime: normalizedEvent.DateTime,
        PhotoUrl: normalizedEvent.PhotoUrl,
        FormLink: normalizedEvent.FormLink,
        Tags: (normalizedEvent.tags || normalizedEvent.Tags || []).map(t => ({
          Name: t.Name || t.name
        }))
      };

      if (isNew) {
        const createdEvent = await createEvent(payload);
        if (createdEvent) {
          setEvents(prev => prev.map(ev => 
            String(ev.Id) === String(tempId) 
              ? { ...ev, Id: createdEvent.Id || createdEvent.id, isPending: false, createdBy: createdEvent.createdBy || ev.createdBy }
              : ev
          ));
        }
      } else {
        const updatedEvent = await updateEvent(currentId, payload);
        if (updatedEvent) {
          setEvents(prev => prev.map(ev => 
            String(ev.Id) === String(currentId) 
              ? { ...ev, ...updatedEvent, isPending: false }
              : ev
          ));
        }
      }
    } catch (err) {
      console.error("Save event failed, moving to outbox", err);
      if (err.message?.toLowerCase().includes('forbidden') || 
          err.message?.toLowerCase().includes('unauthorized')) {
        // Don't queue — this won't succeed on retry either
        // Remove the optimistic pending entry
        setEvents(prev => prev.filter(e => String(e.Id) !== String(tempId)));
        alert("You must be logged in to create events.");
        return;
      }
      setOutbox(prev => [...prev, { type: "SAVE", data: normalizedEvent, isNew }]);
    }
  };

  const checkServerStatus = async () => {
    try {
      await getGeneratorStatus(); // just check it doesn't throw
      return true;                // any response = server is up
    } catch (err) {
      console.error('Health check failed', err);
      return false;
    }
};

  useEffect(() => {
    const checkHealthAndSync = async () => {
      const wasOffline = !isOnline;
      const isUp = await checkServerStatus();
      if (isUp) {
        setIsOnline(true);
        if (wasOffline || outbox.length > 0) syncOutbox();
      } else {
        setIsOnline(false);
      }
    };
    const interval = setInterval(checkHealthAndSync, 5000);
    return () => clearInterval(interval);
  }, [isOnline, outbox.length, syncOutbox]);

  const outboxRef = useRef(outbox);
    useEffect(() => {
      outboxRef.current = outbox;
    }, [outbox]);

  
useEffect(() => {
    const token = getToken();
    const wsBase = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('https://', 'wss://').replace('http://', 'ws://')
  : '';
const socket = new SockJS(`${wsBase}/ws-events${token ? `?token=${encodeURIComponent(token)}` : ''}`);
    const stompClient = Stomp.over(socket);
    stompClient.debug = null;
    const connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    
    stompClient.connect(connectHeaders, () => {
      stompClient.subscribe("/topic/events", (message) => {
        if (message.body) {
          const raw = JSON.parse(message.body);
          const serverEvents = (Array.isArray(raw) ? raw : [raw]).map(normalizeEvent);
          setEvents(prev => {
            const remainingPending = prev.filter(pe => {
              if (!String(pe.Id).startsWith('pending-')) return false;
              return !serverEvents.some(se => 
                (se.Title || '').trim().toLowerCase() === (pe.Title || '').trim().toLowerCase()
              );
            });
            const filteredServerEvents = serverEvents.filter(se => 
              !outboxRef.current.some(action => action.type === 'DELETE' && action.id === se.Id)
            );
            return [...remainingPending, ...filteredServerEvents];
          });
        }
      });
    });
    return () => { if (stompClient.connected) stompClient.disconnect(); };
}, []);

  const deleteEvent = async (id, passedUserId) => {
    setEvents(prev => prev.filter(ev => String(ev.Id) !== String(id)));
    
    if (!isOnline) {
      setOutbox(prev => [...prev, { type: "DELETE", id }]);
      return;
    }

    try { 
      await deleteEventById(id);
    }
    catch (err) { 
      console.error("Delete failed", err);
      setOutbox(prev => [...prev, { type: "DELETE", id }]); 
    }
  };

  const [attendingIds, setAttendingIds] = useState(() => {
    const saved = localStorage.getItem("attending-events");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("attending-events", JSON.stringify(attendingIds));
  }, [attendingIds]);

  useEffect(() => { loadPage(0); }, [loadPage]);

  const isAdmin = () => isAdminUser();
  
  function ProtectedRoute({ element }) {
    const currentUser = getCurrentUser();
    if (!currentUser || !refreshSessionIfActive()) {
      return <Navigate to="/login" replace />;
    }
    return element;
  }
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={
            <Events 
              events={events} attendingIds={attendingIds} 
              onAttend={(id) => setAttendingIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
              onDelete={deleteEvent} isOnline={isOnline} 
              onLoadMore={() => loadPage(currentPage + 1)} hasMore={hasMore}
            />
          } 
        />
        <Route path="/create" element={
          <ProtectedRoute element={<CreateEvent saveEvent={saveEvent} deleteEvent={deleteEvent} />} />
        } />
        <Route path="/event/:Id" element={<EventDetails />} />
        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Register />} />
        <Route 
          path="/admin/logs" 
          element={isAdmin() ? <AdminDashboard /> : <Navigate to="/events" />} 
        />
        <Route path="/chat" element={<ProtectedRoute element={<Chat />} />} />
        <Route path="/my-events" element={
          <ProtectedRoute element={<Events 
            events={events.filter(e => attendingIds.includes(e.Id))} 
            attendingIds={attendingIds} 
            onAttend={(id) => setAttendingIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            isMyEventsPage={true} isOnline={isOnline}
          />} />
        } />  
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;