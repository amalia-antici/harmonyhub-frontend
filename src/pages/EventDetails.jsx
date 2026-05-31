import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getEventById } from '../services/eventServices.jsx';
import Navbar from "../components/Navbar";
import { formatDate, formatTime } from "../utils/dateFormater";
import { isAdmin as isAdminUser } from '../services/authService.jsx';

export default function EventDetails() {
  const { Id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const stateEvent = location.state?.eventData;
  const isPendingId = String(Id).startsWith('pending-');
  const [event, setEvent] = useState(stateEvent || null);
  const [loading, setLoading] = useState(!stateEvent && !isPendingId);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (isPendingId || stateEvent || event) return;

    const loadEvent = async () => {
      setLoading(true);
      try {
        const eventResponse = await getEventById(Id);
        setEvent(eventResponse);
      } catch (err) {
        console.error('Failed to load event', err);
        setFetchError(err.message || 'Unable to load event');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [Id, isPendingId, stateEvent, event]);

  // --- PERMISSION LOGIC START ---
  const userJson = localStorage.getItem("user");
  const currentUser = userJson ? JSON.parse(userJson) : null;

  const isAdmin = isAdminUser();

  // Check both createdBy AND owner just in case, and fix the 'Bt' typo
  const eventCreator = event?.createdBy || event?.owner;
  const isOwner = currentUser && eventCreator && String(currentUser.id) === String(eventCreator.id);

  const canEdit = isAdmin || isOwner;
  // --- PERMISSION LOGIC END ---

  if (loading && !event) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: "100px" }}>
          <h3>Loading event...</h3>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: "100px" }}>
          <h3>No event found.</h3>
          <p>{fetchError ? "Error connecting to server." : "This event might not exist yet."}</p>
          <button className="crud-btn black" onClick={() => navigate("/events")}>
            Back to Events
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="details-container">
        {isPendingId && (
          <div style={{ 
            backgroundColor: '#fff3cd', 
            color: '#856404', 
            padding: '10px', 
            textAlign: 'center', 
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ⏳ This event is currently saved locally and will sync when the server is online.
          </div>
        )}

        <div className="details-card-outer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Event Details</h2>
            
            {/* UPDATED: Only show button if user has permission */}
            {canEdit && (
              <button 
                className="crud-btn black" 
                onClick={() => navigate("/create", { state: { id: event.Id || event.id, event: event } })}
                disabled={isPendingId && !navigator.onLine}
              >
                Edit Event
              </button>
            )}
          </div>

          <div className="details-card-inner">
            <div className="details-info-grid" style={{ flex: 1 }}>
              <h3 className="details-title">
                {event.Title}
                {isPendingId && <span style={{ fontSize: '16px', marginLeft: '10px' }}>⏳</span>}
              </h3>
              <p style={{ marginBottom: "15px", fontWeight: "600" }}>
                {event.City}, {event.Country || "Romania"}
              </p>

              <div className="details-info-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p>📅 {formatDate(event.DateTime)}</p>
                <p>⏰ {formatTime(event.DateTime)}</p>
                <p>🎵 Open to {event.Genre}!</p>
                <p>🏠 {event.Location} </p>
                <p>🔗 {event.FormLink || "No link provided"}</p>
                <p>👥 {event.ReservedSpots || 0} people / {event.Capacity} total capacity</p>
                
                <div className="details-tags">
                  {(event.Tags || event.tags)?.map((Tag, index) => (
                    <span key={Tag.Id || Tag.id || index} className="tag-badge">
                      #{Tag.Name || Tag.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <button 
                className="crud-btn black" 
                style={{ marginTop: "30px", width: "fit-content" }}
                onClick={() => navigate("/events")}
              >
                ← Back to List
              </button>
            </div>
            
            <div className="details-description-box" style={{ flex: 1, textAlign: 'center' }}>
              <p>{event.Description || `Full description for ${event.Title}.`}</p>
              {event.createdBy && (
                <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
                  Hosted by: <strong>{event.createdBy.username}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}