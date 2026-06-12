import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import { register } from '../services/authService.jsx';
import './Register.css';
import '../style.css';

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What was the make of your first car?",
  "What is the name of the street you grew up on?",
];

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', username: '', password: '',
    country: '', city: '', occupation: '', instagram: '', skills: '', bio: '',
    photo: '',
    securityQuestion: '', securityAnswer: ''
  });
  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const name = e.target.name === 'skills2' ? 'skills' : e.target.name;
    setFormData({ ...formData, [name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('Image is too large (max 5MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setPhotoPreview(dataUrl);
      setFormData(prev => ({ ...prev, photo: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.securityQuestion) {
      setError('Please select a security question.');
      return;
    }
    if (!formData.securityAnswer.trim()) {
      setError('Please provide an answer to your security question.');
      return;
    }

    try {
      await register(formData);
      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="register-page">
      <Navbar />
      
      <main className="register-main">
        <div className="register-container fade-in-up">
          <div className="register-header-section">
            <h2 className="section-title delay-1">Musician</h2>
            <div className="profile-upload">
              <label className="profile-placeholder" htmlFor="profileUpload">
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </label>
              <input id="profileUpload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              <span style={{ marginLeft: 10, cursor: 'pointer' }} onClick={() => document.getElementById('profileUpload')?.click()}>+ add profile picture</span>
            </div>
            <h2 className="section-title delay-2">Register</h2>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            {error && <p style={{color: '#ff4d4d', textAlign: 'center', gridColumn: '1/-1'}}>{error}</p>}
            
            <div className="form-columns">
              <div className="form-column">
                <div className="input-field">
                  <label>First name:</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="input-field">
                  <label>Last name:</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
                <div className="input-field">
                  <label>Email:</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="input-field">
                  <label>Username:</label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                </div>
                <div className="input-field">
                  <label>Password:</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-column center-column">
                <div className="input-field">
                  <label>Short bio:</label>
                  <textarea name="bio" rows="6" value={formData.bio} onChange={handleChange}></textarea>
                </div>
              </div>

              <div className="form-column">
                <div className="input-field">
                  <label>Country:</label>
                  <input type="text" name="country" value={formData.country} onChange={handleChange} />
                </div>
                <div className="input-field">
                  <label>City:</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} />
                </div>
                <div className="input-field">
                  <label>Occupation:</label>
                  <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} />
                </div>
                <div className="input-field">
                  <label>Link to Instagram:</label>
                  <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} />
                </div>
                <div className="input-field">
                  <label>Skills:</label>
                  <input type="text" name="skills2" value={formData.skills} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Security section */}
            <div style={{
              marginTop: '30px',
              padding: '24px',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              backgroundColor: '#fafafa'
            }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
                🔒 Account Recovery
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#888' }}>
                This information is used to verify your identity during login.
              </p>

              <div className="input-field">
                <label>Security Question:</label>
                <select
                  name="securityQuestion"
                  value={formData.securityQuestion}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: formData.securityQuestion ? '#333' : '#999',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>Select a question...</option>
                  {SECURITY_QUESTIONS.map((q, i) => (
                    <option key={i} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div className="input-field" style={{ marginTop: '16px' }}>
                <label>Your Answer:</label>
                <input
                  type="text"
                  name="securityAnswer"
                  value={formData.securityAnswer}
                  onChange={handleChange}
                  placeholder="Your answer (case-insensitive)"
                  required
                  style={{ textTransform: 'lowercase' }}
                />
                <span style={{ fontSize: '12px', color: '#aaa', marginTop: '4px', display: 'block' }}>
                  Your answer is stored securely and is not case-sensitive.
                </span>
              </div>
            </div>

            <button type="submit" className="join-btn">Join us</button>
          </form>
        </div>
      </main>
    </div>
  );
}