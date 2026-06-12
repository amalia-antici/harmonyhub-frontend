import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { formatDate } from "../utils/dateFormater";
import Cookies from "js-cookie";
import { getCurrentUser, isAdmin as isAdminUser } from '../services/authService.jsx';
import { searchEvents } from '../services/eventServices.jsx';

export default function Events({ 
  events = [], 
  attendingIds = [], 
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
  const [filters, setFilters] = useState({ genre: 'ALL', city: '', date: '' });
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const loadMoreRef = useRef(null);

  const genreOptions = [
    'ALL', 'ROCK', 'JAZZ', 'POP', 'CLASSIC', 'METAL', 'HIP_HOP', 'COUNTRY', 'REGGAE', 'SACRED', 'OTHER'
  ];

  const isFilteringActive = filters.genre !== 'ALL' || filters.city.trim() !== '' || filters.date !== '';
  const displayEvents = isFilteringActive ? (searchResults ?? []) : events;
  const currentUser = getCurrentUser();
  const isAdmin = isAdminUser();

  const clearFilters = () => {
    setFilters({ genre: 'ALL', city: '', date: '' });
    setSearchResults(null);
    setSearchError(null);
  };

  useEffect(() => {
    if (!onLoadMore || !hasMore || isFilteringActive) return;
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
  }, [onLoadMore, hasMore, isFilteringActive, isLoadingMore, isLoadingPage]);

  useEffect(() => {
    if (!isFilteringActive) return;
    if (!isOnline) {
      setSearchResults([]);
      setSearchError('Offline search unavailable');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    const timeout = setTimeout(async () => {
      try {
        const results = await searchEvents(0, 50, filters);
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed', err);
        setSearchResults([]);
        setSearchError(err.message || 'Search failed');
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters, isFilteringActive, isOnline]);

  const handleViewDetails = (event) => {
    Cookies.set('last_viewed_event', JSON.stringify({ title: event.Title, id: event.Id }), { expires: 7 });
    navigate(`/event/${event.Id}`, { state: { eventData: event } });
  };

  const handleEdit = (e, event) => {
    e.stopPropagation();
    Cookies.set('last_viewed_event', JSON.stringify({ title: event.Title, id: event.Id }), { expires: 7 });
    navigate("/create", { state: { id: event.Id, eventData: event } });
  };

  return (
    <>
      <Navbar />
      <main className="events-container fade-in-up">
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
          <div className="list-side" style={{ flex: 1 }}>
            
            {!isMyEventsPage && (
              <div className="filter-panel">
                <div className="filter-group">
                  <label htmlFor="genre-filter">Genre</label>
                  <select
                    id="genre-filter"
                    value={filters.genre}
                    onChange={(e) => setFilters(prev => ({ ...prev, genre: e.target.value }))}
                  >
                    {genreOptions.map((genre) => (
                      <option key={genre} value={genre}>{genre === 'ALL' ? 'All Genres' : genre}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="city-filter">City</label>
                  <input
                    id="city-filter"
                    type="text"
                    placeholder="Search city"
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="date-filter">Date</label>
                  <input
                    id="date-filter"
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <button className="filter-reset-btn" type="button" onClick={clearFilters}>
                  Reset filters
                </button>
              </div>
            )}

            <div className="view-selector" style={{ marginBottom: '20px' }}>
              <select value={viewModel} onChange={(e) => setViewModel(e.target.value)}>
                <option>List View</option>
                <option>Cards View</option>
              </select>
            </div>

            {displayEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>
                {searchLoading ? 'Searching events…' : (
                  isFilteringActive ? 'No events match the selected filters.' : 'No events found.'
                )}
              </div>
            ) : (
              <div className={viewModel === "Cards View" ? "events-grid" : "events-list"}>
                {displayEvents.map((event) => {
                  const isPending = event.isPending || event.pending || false;
                  const ownerId = event.createdBy?.id || event.createdBy?.Id || event.createdBy?.userId || event.createdBy?.user_id;
                  const isOwner = currentUser && String(ownerId) === String(currentUser.id || currentUser.Id);
                  
                  // Capacity checks (falling back to 0 or Infinity if backend fields vary)
                  const spotsReserved = event.SpotsReserved ?? event.spotsReserved ?? 0;
                  const capacity = event.Capacity ?? event.capacity ?? Infinity;
                  const isFull = spotsReserved >= capacity;
                  const isAttending = attendingIds.includes(event.Id);

                  return viewModel === "Cards View" ? (
                    <div
                      key={event.Id}
                      style={{
                        background: '#fff',
                        border: isPending ? '1px dashed orange' : '1px solid #e8e8e8',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        opacity: isPending ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        cursor: isPending ? 'wait' : 'pointer',
                        width: '260px'
                      }}
                      onClick={() => !isPending && handleViewDetails(event)}
                    >
                      {/* Image Frame */}
                      <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                        <img
                          src={event.PhotoUrl || "/image_placeholder.avif"}
                          alt="event"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <span style={{
                          position: 'absolute', bottom: 10, left: 10,
                          background: 'rgba(255,255,255,0.92)',
                          border: '1px solid rgba(0,0,0,0.08)',
                          borderRadius: '20px', padding: '3px 10px',
                          fontSize: 11, fontWeight: 500, color: '#444',
                          backdropFilter: 'blur(4px)'
                        }}>
                          {event.Genre}
                        </span>

                        {/* Top-Right Bookmark Button: Disabled if Full AND not already attending */}
                        {!isOwner && (
                          <button
                            disabled={isFull && !isAttending}
                            style={{
                              position: 'absolute', top: 10, right: 10,
                              background: 'rgba(255,255,255,0.92)',
                              border: '1px solid rgba(0,0,0,0.08)',
                              borderRadius: '50%', width: 32, height: 32,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: (isFull && !isAttending) ? 'not-allowed' : 'pointer', 
                              backdropFilter: 'blur(4px)',
                              opacity: (isFull && !isAttending) ? 0.5 : 1
                            }}
                            className={`icon-action-btn ${isAttending ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); onAttend(event.Id); }}
                            aria-label={isAttending ? "Unattend event" : "Attend event"}
                          >
                            <i 
                              className={isAttending ? "ti ti-bookmark-filled" : "ti ti-bookmark"} 
                              style={{ 
                                fontSize: 16, 
                                color: isAttending ? '#ffc107' : (isFull ? '#bbb' : '#444') 
                              }}
                            ></i>
                          </button>
                        )}
                        
                        {isPending && (
                          <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 18 }}>⏳</span>
                        )}
                      </div>

                      {/* Content Section */}
                      <div style={{ padding: '14px 14px 12px' }}>
                        <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#111', lineHeight: 1.3 }}>
                          {event.Title}
                        </h3>
                        <p style={{ margin: '0 0 3px', fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                          📍 {event.Location || 'Venue'}, {event.City}
                        </p>
                        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                          📅 {formatDate(event.DateTime)}
                        </p>
                        
                        {/* Capacity display indicator */}
                        <p style={{ margin: '0 0 12px', fontSize: 11, color: isFull ? '#ff4d4d' : '#28a745', fontWeight: '500' }}>
                          👥 {isFull ? "Event Full" : `${capacity - spotsReserved} spots left`}
                        </p>

                        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleViewDetails(event)}
                            disabled={isPending}
                            style={{
                              flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 500,
                              borderRadius: '10px', border: '1px solid #e0e0e0',
                              background: '#fff', color: '#333', cursor: isPending ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {isPending ? 'Syncing...' : 'See details'}
                          </button>

                          {(isAdmin || isOwner) && (
                            <button
                              onClick={(e) => handleEdit(e, event)}
                              disabled={isPending}
                              style={{
                                padding: '7px 14px', fontSize: 12, fontWeight: 500,
                                borderRadius: '10px', border: 'none',
                                background: '#111', color: '#fff', cursor: isPending ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 5
                              }}
                            >
                              <i className="ti ti-edit" style={{ fontSize: 14 }}></i> Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* --- LIST VIEW --- */
                    <div 
                      key={event.Id} 
                      className={`event-row-container ${isPending ? 'pending-event' : ''}`}
                      onClick={() => !isPending && handleViewDetails(event)}
                    >
                      <div className="event-item">
                        <div className="event-icon">
                          <img src={event.PhotoUrl || "/image_placeholder.avif"} alt="event" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        </div>
                        <div className="event-title">
                          {event.Title}
                          {isPending && (
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
                            disabled={isFull && !isAttending}
                            className={isAttending ? "attend-btn active" : "attend-btn"}
                            style={{
                              cursor: (isFull && !isAttending) ? 'not-allowed' : 'pointer',
                              opacity: (isFull && !isAttending) ? 0.6 : 1
                            }}
                            onClick={(e) => { e.stopPropagation(); onAttend(event.Id); }}
                          >
                            {isAttending ? "Unattend" : (isFull ? "Full" : "Attend")}
                          </button>
                        )}

                        {(isAdmin || isOwner) && (
                          <button 
                            className="edit-action-btn" 
                            onClick={(e) => handleEdit(e, event)}
                            disabled={isPending}
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
        </div>

        <div ref={loadMoreRef} style={{ height: '20px', width: '100%' }} />
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          {isLoadingMore && <span className="page-nav">Loading more events…</span>}
          {!hasMore && events.length > 0 && <span className="page-nav">All events loaded</span>}
        </div>

        {!isMyEventsPage && (
          <button
            className="floating-create-event-btn"
            onClick={() => navigate('/create')}
            aria-label="Create new event"
          >
            <span>+</span>
            Create Event
          </button>
        )}
      </main>
    </>
  );
}