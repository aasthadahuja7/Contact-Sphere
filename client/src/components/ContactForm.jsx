import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { X, User, Phone, Mail, FileText, Save, Cake, Star, Camera, Upload, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const ContactForm = ({ contact, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    dateOfBirth: '',
    favorite: false,
    image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        notes: contact.notes || '',
        dateOfBirth: contact.dateOfBirth ? new Date(contact.dateOfBirth).toISOString().split('T')[0] : '',
        favorite: contact.favorite || false,
        image: contact.image || null,
      });
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [contact]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setShowCamera(true);
    } catch (err) {
      toast.error("Could not access camera");
    }
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setFormData({ ...formData, image: dataUrl });
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (contact) {
        await api.put(`/contacts/${contact._id}`, formData);
        toast.success('Contact updated successfully');
      } else {
        await api.post('/contacts', formData);
        toast.success('Contact added successfully');
      }
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card animate-zoom">
        <div className="modal-header">
          <h2>{contact ? 'Edit Contact' : 'Add New Contact'}</h2>
          <button onClick={onClose} className="modal-close"><X size={20} /></button>
        </div>

        <div className="image-upload-section">
          {showCamera ? (
            <div className="camera-preview">
              <video ref={videoRef} autoPlay playsInline muted />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="camera-controls">
                <button type="button" onClick={captureImage} className="btn-primary">Capture</button>
                <button type="button" onClick={stopCamera} className="btn-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="avatar-preview-container">
              <div className="avatar-preview glass-card">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" />
                ) : (
                  <User size={48} className="text-muted" />
                )}
              </div>
              <div className="avatar-actions">
                <label className="btn-icon-sm upload-btn" title="Upload from computer">
                  <Upload size={18} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                <button type="button" onClick={startCamera} className="btn-icon-sm camera-btn" title="Take photo with camera">
                  <Camera size={18} />
                </button>
                {formData.image && (
                  <button type="button" onClick={() => setFormData({ ...formData, image: null })} className="btn-icon-sm delete-btn" title="Remove photo">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="modal-name">Full Name</label>
            <div className="input-with-icon">
              <User size={18} />
              <input id="modal-name" name="name" type="text" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="modal-phone">Phone Number</label>
              <div className="input-with-icon">
                <Phone size={18} />
                <input id="modal-phone" name="phone" type="text" value={formData.phone} onChange={handleChange} required placeholder="+1 234 567 890" />
              </div>
            </div>
            <div className="form-group flex-1">
              <label htmlFor="modal-email">Email Address (Optional)</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input id="modal-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="modal-dob">Date of Birth</label>
              <div className="input-with-icon">
                <Cake size={18} />
                <input id="modal-dob" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group flex-1 flex-center-start">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="favorite" 
                  checked={formData.favorite} 
                  onChange={handleChange} 
                />
                <Star size={18} fill={formData.favorite ? "var(--accent)" : "none"} stroke={formData.favorite ? "var(--accent)" : "currentColor"} />
                <span>Mark as Favorite</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="modal-notes">Notes (Optional)</label>
            <div className="input-with-icon align-start">
              <FileText size={18} />
              <textarea id="modal-notes" name="notes" rows="3" value={formData.notes} onChange={handleChange} placeholder="Add any special notes..."></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-glow-accent">
              <Save size={18} />
              <span>{isSubmitting ? 'Saving...' : 'Save Contact'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
