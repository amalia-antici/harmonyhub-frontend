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

  const eventImage = event?.PhotoUrl || "/image_placeholder.avif";
  const eventTags = (event?.Tags || event?.tags || []).map((Tag, index) => ({
    id: Tag.Id || Tag.id || index,
    name: Tag.Name || Tag.name || Tag,
  }));

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
          <div className="pending-alert">
            ⏳ This event is currently saved locally and will sync when the server is online.
          </div>
        )}

        <div className="details-card-outer">
          <div className="details-hero" style={{ backgroundImage: `url(${eventImage})` }}>
            <div className="details-hero-overlay">
              <div className="details-hero-badge">{event.Genre || 'Event'}</div>
              <h1>{event.Title}</h1>
              <p>{event.Location} · {event.City}, {event.Country || 'Romania'}</p>
              <div className="hero-meta-row">
                <span>📅 {formatDate(event.DateTime)}</span>
                <span>⏰ {formatTime(event.DateTime)}</span>
              </div>
            </div>
          </div>

          <div className="details-card-inner">
            <div className="details-info-grid">
              <div className="details-summary-card">
                <div className="summary-header">
                  <h2>Event Info</h2>
                  {canEdit && (
                    <button
                      className="crud-btn black small"
                      onClick={() => navigate("/create", { state: { id: event.Id || event.id, eventData: event } })}
                      disabled={isPendingId && !navigator.onLine}
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="details-meta-list">
                  <div className="meta-row"><span>Genre</span><strong>{event.Genre || '—'}</strong></div>
                  <div className="meta-row"><span>Venue</span><strong>{event.Location || '—'}</strong></div>
                  <div className="meta-row"><span>City</span><strong>{event.City || '—'}</strong></div>
                  <div className="meta-row"><span>Spots</span><strong>{event.ReservedSpots || 0} / {event.Capacity || '—'}</strong></div>
                  <div className="meta-row"><span>Form</span><strong>{event.FormLink ? <a href={event.FormLink} target="_blank" rel="noreferrer">Open form</a> : 'No link provided'}</strong></div>
                </div>

                <div className="details-tags">
                  {eventTags.length ? eventTags.map(tag => (
                    <span key={tag.id} className="tag-badge">#{tag.name}</span>
                  )) : <span className="tag-pill">No tags yet</span>}
                </div>

                <button className="crud-btn blue" onClick={() => navigate('/events')}>
                  ← Back to Events
                </button>
              </div>

              <div className="details-description-box">
                <div>
                  <h2>About this event</h2>
                  <p>{event.Description || `No description has been provided for this event yet.`}</p>
                </div>

                <div className="host-card">
                  <div>
                    <span>Hosted by</span>
                    <strong>{eventCreator?.username || 'Unknown host'}</strong>
                  </div>
                  <div className="host-meta">
                    <span>{eventCreator?.email || 'No contact info'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}