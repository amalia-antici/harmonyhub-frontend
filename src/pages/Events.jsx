import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { formatDate } from "../utils/dateFormater";
import Cookies from "js-cookie";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { isAdmin as isAdminUser } from '../services/authService.jsx';



export default function Events({ 
  events, 
  attendingIds, 
  onAttend, 
  isMyEventsPage, 
  onAutoPopulate, 
  isPopulating, 
  isOnline, 
  onLoadMore, 
  hasMore, 
  isLoadingPage, 
  isLoadingMore 
}) {
  const navigate = useNavigate();
  const [viewModel, setViewModel] = useState("List View");
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoadingMore && !isLoadingPage) {
            onLoadMore();
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore, isLoadingPage]);

  const getGenreData = () => {
    const counts = {};
    events.forEach(ev => {
      const genre = ev.Genre || "OTHER";
      counts[genre] = (counts[genre] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] }));
  };

  const handleViewDetails = (event) => {
    Cookies.set('last_viewed_event', event.Title, { expires: 7 });
    navigate(`/event/${event.Id}`, { state: { eventData: event } });
  };

  const handleEdit = (e, event) => {
    e.stopPropagation();
    Cookies.set('last_viewed_event', event.Title, { expires: 7 });
    navigate("/create", { state: { id: event.Id, eventData: event } });
  };

  return (
    <>
      <Navbar />
      <main className="events-container fade-in-up">
        {/* Offline Notification Banner */}
        {!isOnline && (
          <div style={{ 
            backgroundColor: '#ff4d4d', 
            color: 'white', 
            textAlign: 'center', 
            padding: '10px', 
            borderRadius: '8px',
            marginBottom: '20px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            ⚠️ Offline Mode: Changes will sync automatically when connection is restored.
          </div>
        )}

        <div className="dashboard-flex-container" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
          <div className="list-side" style={{ flex: 2 }}>
            <div className="view-selector" style={{ marginBottom: '20px' }}>
              <select value={viewModel} onChange={(e) => setViewModel(e.target.value)}>
                <option>List View</option>

    
                <option>Cards View</option>
              </select>
            </div>

            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>
                {isLoadingPage ? 'Loading events…' : `No events found.`}
              </div>
            ) : (
              <div className={viewModel === "Cards View" ? "events-grid" : "events-list"}>
                {events.map((event) => {
                  const userJson = localStorage.getItem("user");
                  const currentUser = userJson ? JSON.parse(userJson) : null;
                  
                  const creator = event.createdBy || event.owner;
                  const isAdmin = isAdminUser();
                  console.group(`Event Debug: ${event.Title}`);
                  console.log("Logged In User ID:", currentUser?.id);
                  console.log("Event Creator ID:", creator?.id);
                  console.log("Is Owner Match:", currentUser && creator && String(currentUser.id) === String(creator.id));
                  console.groupEnd();

                  const isOwner = currentUser && creator && String(currentUser.id) === String(creator.id);

                  return viewModel === "Cards View" ? (
                    /* --- CARDS VIEW --- */
                    <div 
                      key={event.Id} 
                      className="event-card-container"
                      style={{ 
                        opacity: String(event.Id).startsWith('pending-') ? 0.7 : 1, 
                        border: String(event.Id).startsWith('pending-') ? '1px dashed orange' : 'none',
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      <div className="card-image-wrapper">
                        <img 
                          src={event.PhotoUrl || "/image_placeholder.avif"} 
                          alt="event" 
                          className="card-main-img" 
                        />
                        <div className="card-overlay-actions">
                          <button 
                            className={`icon-action-btn ${attendingIds.includes(event.Id) ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); onAttend(event.Id); }}
                          >
                            <span className="bookmark-icon">🔖</span>
                          </button>
                        </div>
                      </div>
                      <div className="card-details">
                        <h3 className="card-title">
                          {event.Title}
                          {String(event.Id).startsWith('pending-') && (
                            <span title="Syncing..." style={{ color: '#ffa500', fontSize: '14px', marginLeft: '8px' }}>⏳</span>
                          )}
                        </h3>
                        <p className="card-venue">{event.Location || "Venue"}</p>
                        <p className="card-address">{event.City}, {event.Country}</p>
                        <div className="card-datetime"><span>{formatDate(event.DateTime)}</span></div>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button 
                            className="see-details-btn" 
                            onClick={() => handleViewDetails(event)}
                            disabled={String(event.Id).startsWith('pending-')}
                            style={{ flex: 1 }}
                          >
                            {String(event.Id).startsWith('pending-') ? "Syncing..." : "See details"}
                          </button>

                          {(isAdmin || isOwner) && (
                            <button 
                              className="edit-action-btn" 
                              onClick={(e) => handleEdit(e, event)}
                              style={{ padding: '0 15px', borderRadius: '8px', border: '1px solid #ccc' }}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* --- LIST VIEW --- */
                    <div 
                      key={event.Id} 
                      className="event-row-container"
                      style={{ 
                        opacity: String(event.Id).startsWith('pending-') ? 0.6 : 1,
                        backgroundColor: String(event.Id).startsWith('pending-') ? '#fffaf0' : 'transparent',
                        transition: 'all 0.3s ease',
                        cursor: String(event.Id).startsWith('pending-') ? 'wait' : 'pointer'
                      }}
                      onClick={() => !String(event.Id).startsWith('pending-') && handleViewDetails(event)}
                    >
                      <div className="event-item">
                        <div className="event-icon">
                          <img src={event.PhotoUrl || "/image_placeholder.avif"} alt="event" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        </div>
                        <div className="event-title">
                          {event.Title}
                          {String(event.Id).startsWith('pending-') && (
                            <span title="Syncing..." style={{ marginLeft: '8px' }}>⏳</span>
                          )}
                        </div>
                        <div className="event-date">{formatDate(event.DateTime)}</div>
                        <div className="event-loc">{event.City}</div>
                        <div className={event.Genre === "ALL" ? "genre-green" : "genre-black"}>{event.Genre}</div>
                      </div>
                      <div className="list-actions">
                        {!isOwner && (
                          <button 
                            className={attendingIds.includes(event.Id) ? "attend-btn active" : "attend-btn"}
                            onClick={(e) => { e.stopPropagation(); onAttend(event.Id); }}
                          >
                            {attendingIds.includes(event.Id) ? "Unattend" : "Attend"}
                          </button>
                        )}

                        {(isAdmin || isOwner) && (
                          <button 
                            className="edit-action-btn" 
                            onClick={(e) => handleEdit(e, event)}
                            disabled={String(event.Id).startsWith('pending-')}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side Stats */}
          <div className="statistics-side" style={{ flex: 1, background: '#f5f5f5', padding: '20px', borderRadius: '15px', maxWidth:'300px'}}>
            <div className="admin-controls" style={{ marginBottom: '30px', textAlign: 'center' }}>
              <button 
                className="crud-btn black" 
                onClick={onAutoPopulate}
                disabled={!isOnline}
              >
                {isPopulating ? "Stop Auto-Populate" : "Start Auto-Populate"}
              </button>
            </div>

            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Statistics</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getGenreData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#333" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* loading states for infinite scroll */}
        <div ref={loadMoreRef} style={{ height: '20px', width: '100%' }} />
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          {isLoadingMore && <span className="page-nav">Loading more events…</span>}
          {!hasMore && events.length > 0 && <span className="page-nav">All events loaded</span>}
        </div>
      </main>
    </>
  );
}