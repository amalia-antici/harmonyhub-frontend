import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getEventById } from '../services/eventServices.jsx';
import Navbar from "../components/Navbar";

export default function CreateEvent({ saveEvent, deleteEvent }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const editingId = location.state?.id;
  const [editingEvent, setEditingEvent] = useState(location.state?.eventData || null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (editingId && !editingEvent) {
      const loadEvent = async () => {
        setLoading(true);
        try {
          const eventResponse = await getEventById(editingId);
          setEditingEvent(eventResponse);
        } catch (err) {
          console.error('Failed to load event', err);
          setFetchError(err.message || 'Unable to load event');
        } finally {
          setLoading(false);
        }
      };
      loadEvent();
    }
  }, [editingId, editingEvent]);

  const [form, setForm] = useState({
    PhotoUrl: "/image_placeholder.avif",
    Id: null, 
    Title: "",
    Location: "",
    City: "",
    EventType: "OTHER", 
    Capacity: 0,
    Description: "",
    DateTime: "",
    Country: "",
    Genre: "ALL", 
    FormLink: "",
    tags: []
  });

  useEffect(() => {
    if (editingEvent) {
      setForm({
        PhotoUrl: editingEvent.PhotoUrl || "/image_placeholder.avif",
        Id: editingEvent.Id || null, 
        Title: editingEvent.Title || "",
        Location: editingEvent.Location || "",
        City: editingEvent.City || "",
        EventType: editingEvent.EventType || "OTHER", 
        Capacity: editingEvent.Capacity || 0,
        Description: editingEvent.Description || "",
        DateTime: editingEvent.DateTime || "",
        Country: editingEvent.Country || "",
        Genre: editingEvent.Genre || "ALL", 
        FormLink: editingEvent.FormLink || "",
        tags: editingEvent.Tags || []
      });
    }
  }, [editingEvent]);

  const [errors, setErrors] = useState({});

  /////---------Event tags handling 
  const [tagName, setTagName] = useState("");

  const validate = () => {
    const newErrors = {};
    
    if (!form.Title?.trim()) newErrors.Title = "Title is required";
    if (!form.Location?.trim()) newErrors.Location = "Location is required";
    if (!form.City?.trim()) newErrors.City = "City is required";
    if (!form.Country?.trim()) newErrors.Country = "Country is required";
    if (!form.DateTime) newErrors.DateTime = "Date and time is required";
    if (!form.EventType) newErrors.EventType = "Select an event type";
    if (!form.Genre) newErrors.Genre = "Select a genre";
    
    if (form.FormLink && !form.FormLink.startsWith("http")) {
        newErrors.FormLink = "Link must start with http/https";
    }

    setErrors(newErrors); 
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = () => {
    if (validate()) {
      saveEvent(form); 
      navigate("/events");
    } else {
      alert("Please fix the errors before submitting.");
    }
  };

  const handleDelete = () => {
    if (form.Id) {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      
      const currentUserId = storedUser?.id || storedUser?.Id;

      deleteEvent(form.Id, currentUserId);
      
      navigate("/events");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, PhotoUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = (e) => {
    e.preventDefault();
    if (tagName.trim()) {
      setForm({ ...form, tags: [...(form.tags || []), { Name: tagName.trim() }] });
      setTagName("");
    }
  };

  const removeTag = (indexToRemove) => {
    setForm({
      ...form,
      tags: form.tags.filter((_, index) => index !== indexToRemove)
    });
  };

  ////

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: "100px" }}>
          <h3>Loading event...</h3>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="details-container">
        <div className="details-card-outer">
          <h2>{form.Id ? "Edit Event" : "Create Event"}</h2>

          <div className="details-card-inner">
            {/* Image Upload Section */}
            <div className="image-upload-wrapper">
              <label htmlFor="file-upload" className="image-placeholder-box">
                <img 
                  src={form.PhotoUrl} 
                  alt="upload" 
                  className="image-preview"
                />
                <p>{form.Id ? "Change Image" : "+ Add Image"}</p>
              </label>
              <input 
                id="file-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                style={{ display: 'none' }} 
              />
            </div>

            <div className="form-fields-grid">
              {/* Title - Required */}
              <div className="field">
                <label htmlFor="title">Title:</label>
                <input 
                  id="title"
                  type="text" 
                  value={form.Title} 
                  onChange={(e) => setForm({...form, Title: e.target.value})}
                  style={{ borderColor: errors.Title ? 'red' : '' }} 
                />
                {errors.Title && <span style={{ color: 'red', fontSize: '12px' }}>{errors.Title}</span>}
              </div>

              {/* Location - Required */}
              <div className="field">
                <label>Location:</label>
                <input 
                  type="text" 
                  value={form.Location} 
                  onChange={(e) => setForm({...form, Location: e.target.value})}
                  style={{ borderColor: errors.Location ? 'red' : '' }} 
                />
                {errors.Location && <span style={{ color: 'red', fontSize: '12px' }}>{errors.Location}</span>}
              </div>

              {/* City - Required */}
              <div className="field">
                <label htmlFor="city">City:</label>
                <input 
                  id="city"
                  type="text" 
                  value={form.City} 
                  onChange={(e) => setForm({...form, City: e.target.value})}
                  style={{ borderColor: errors.City ? 'red' : '' }} 
                />
                {errors.City && <span style={{ color: 'red', fontSize: '12px' }}>{errors.City}</span>}
              </div>

              {/* Country - Required */}
              <div className="field">
                <label>Country:</label>
                <input 
                  type="text" 
                  value={form.Country} 
                  onChange={(e) => setForm({...form, Country: e.target.value})}
                  style={{ borderColor: errors.Country ? 'red' : '' }} 
                />
                {errors.Country && <span style={{ color: 'red', fontSize: '12px' }}>{errors.Country}</span>}
              </div>

              {/* Event Type - Required Enum */}
              <div className="field">
                <label>Event Type:</label>
                <select 
                  value={form.EventType} 
                  onChange={(e) => setForm({...form, EventType: e.target.value})}
                >
                  <option value="CONCERT">Concert</option>
                  <option value="KARAOKE">Karaoke</option>
                  <option value="JAM_SESSION">Jam Session</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="OPEN_MIC">Open Mic</option>
                  <option value="CASTING">Casting</option>
                  <option value="COMPETITION">Competition</option>
                  <option value="MEET_THE_ARTIST">Meet the Artist</option>
                  <option value="RECITAL">Recital</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Music Genre - Required Enum */}
              <div className="field">
                <label>Music Genre:</label>
                <select 
                  value={form.Genre} 
                  onChange={(e) => setForm({...form, Genre: e.target.value})}
                >
                  <option value="ROCK">Rock</option>
                  <option value="JAZZ">Jazz</option>
                  <option value="POP">Pop</option>
                  <option value="CLASSIC">Classic</option>
                  <option value="METAL">Metal</option>
                  <option value="HIP_HOP">Hip Hop</option>
                  <option value="COUNTRY">Country</option>
                  <option value="JAZZ">Jazz</option>
                  <option value="REGGAE">Raggae</option>
                  <option value="SACRED">Sacred</option>
                  <option value="ALL">All Genres</option>
                </select>
              </div>

              {/* Date and Time - Required */}
              <div className="field">
                <label htmlFor="dateTime">Date and Time:</label>
                <input 
                  id="dateTime"
                  type="datetime-local" 
                  value={form.DateTime} 
                  onChange={(e) => setForm({...form, DateTime: e.target.value})}
                  style={{ borderColor: errors.DateTime ? 'red' : '' }} 
                />
                {errors.DateTime && <span style={{ color: 'red', fontSize: '12px' }}>{errors.DateTime}</span>}
              </div>

              {/* Capacity */}
              <div className="field">
                <label>Capacity:</label>
                <input 
                  type="number" 
                  min="0"
                  value={form.Capacity} 
                  onChange={(e) => setForm({...form, Capacity: Number(e.target.value)})}
                />
              </div>

              {/* Description */}
              <div className="field">
                <label>Description:</label>
                <textarea 
                  value={form.Description} 
                  onChange={(e) => setForm({...form, Description: e.target.value})}
                  rows="3"
                />
              </div>

              {/* Form Link */}
              <div className="field">
                <label htmlFor="formLink">Registration Link (optional):</label>
                <input 
                  id="formLink"
                  type="text" 
                  placeholder="https://..."
                  value={form.FormLink} 
                  onChange={(e) => setForm({...form, FormLink: e.target.value})}
                  style={{ borderColor: errors.FormLink ? 'red' : '' }} 
                />
                {errors.FormLink && <span style={{ color: 'red', fontSize: '12px' }}>{errors.FormLink}</span>}
              </div>

        {/* --- TAG MANAGER SECTION --- */}
        <div className="field field-full-width tag-manager"> 
          <label>Event Tags:</label>
          <div className="tag-input-row">
            <input 
              type="text" 
              value={tagName} 
              onChange={(e) => setTagName(e.target.value)}
              placeholder="e.g. Sold Out, Live"
            />
            <button type="button" className="crud-btn black small" onClick={addTag}>
              Add
            </button>
          </div>

          <div className="tag-list">
            {form.tags?.map((tag, index) => (
              <span key={index} className="tag-pill">
                {tag.Name || tag.name}
                <button 
                  type="button" 
                  onClick={() => removeTag(index)}
                  className="tag-remove-btn"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        {/* --- END TAG MANAGER --- */}
            </div>
          </div>

          <div className="form-actions">
            <button className="crud-btn black" onClick={handleSubmit}>
                {form.Id ? "Update Event" : "Add Event"}
            </button>
            
            {form.Id && (
              <button className="crud-btn red" onClick={handleDelete}>Delete Event</button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}