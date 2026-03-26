import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { 
  Plus, Search, Download, Trash2, Edit3, Phone, Mail, 
  FileText, ChevronLeft, ChevronRight, BarChart3, Star, 
  Cake, Clock, Heart, AlertCircle 
} from 'lucide-react';
import { toast } from 'react-toastify';
import ContactForm from '../components/ContactForm';

const Dashboard = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    favorites: 0,
    recent: 0,
    birthdaysToday: [],
    upcomingBirthdaysCount: 0
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/contacts/analytics');
      setStats(response.data);
      
      // Notify about today's birthdays only once on load (simplified to one toast)
      if (response.data.birthdaysToday?.length > 0) {
        toast.info(`🎂 You have ${response.data.birthdaysToday.length} birthday(s) today!`, {
          position: "top-center",
          autoClose: 10000,
        });
      }
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/contacts?search=${search}&page=${page}`;
      if (activeFilter === 'favorite') url += '&favorite=true';
      if (activeFilter === 'recent') url += '&recent=true';
      if (activeFilter === 'upcoming') url += '&upcomingBirthdays=true';
      
      const response = await api.get(url);
      setContacts(response.data.contacts);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      toast.error('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  }, [search, page, activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const toggleFilter = (filter) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filter);
    }
    setPage(1);
  };

  const confirmDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      await api.delete(`/contacts/${deleteConfirmId}`);
      toast.success('Contact deleted successfully');
      setDeleteConfirmId(null);
      fetchContacts();
    } catch (err) {
      toast.error('Failed to delete contact');
      setDeleteConfirmId(null);
    }
  };

  const handleExport = async () => {
    try {
      toast.info('Exporting contacts to CSV...');
      const response = await api.get('/contacts/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contacts.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Export failed: Not authorized or server error');
    }
  };

  const toggleFavorite = async (contact) => {
    try {
      await api.put(`/contacts/${contact._id}`, { favorite: !contact.favorite });
      fetchContacts();
      fetchStats();
      toast.success(contact.favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      toast.error('Failed to update favorite status');
    }
  };

  const openAddModal = () => {
    setCurrentContact(null);
    setShowModal(true);
  };

  const openEditModal = (contact) => {
    setCurrentContact(contact);
    setShowModal(true);
  };

  return (
    <div className="container dashboard">
      <header className="dashboard-header">
        <div className="title-section">
          <h1>Contacts</h1>
          <p className="subtitle">Manage and organize your personal network.</p>
        </div>
        <div className="header-actions">
          <button onClick={handleExport} className="btn btn-secondary btn-icon">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button onClick={openAddModal} className="btn-glow-accent btn-icon">
            <Plus size={18} />
            <span>Add Contact</span>
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <div 
          className={`stat-card glass-card ${!activeFilter ? 'active' : ''}`} 
          onClick={() => setActiveFilter(null)}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-bg total"><BarChart3 size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Contacts</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div 
          className={`stat-card glass-card ${activeFilter === 'favorite' ? 'active' : ''}`} 
          onClick={() => toggleFilter('favorite')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-bg favorite"><Heart size={20} fill="var(--danger)" stroke="var(--danger)" /></div>
          <div className="stat-info">
            <span className="stat-label">Favorites</span>
            <span className="stat-value">{stats.favorites}</span>
          </div>
        </div>
        <div 
          className={`stat-card glass-card ${activeFilter === 'recent' ? 'active' : ''}`} 
          onClick={() => toggleFilter('recent')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-bg recent"><Clock size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Recent (7d)</span>
            <span className="stat-value">{stats.recent}</span>
          </div>
        </div>
        <div 
          className={`stat-card glass-card ${activeFilter === 'upcoming' ? 'active' : ''}`} 
          onClick={() => toggleFilter('upcoming')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-bg birthday"><Cake size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Upcoming Birthdays</span>
            <span className="stat-value">{stats.upcomingBirthdaysCount}</span>
          </div>
        </div>
      </section>

      {stats.birthdaysToday?.length > 0 && (
        <div className="birthday-alert glass-card animate-slide-down">
          <AlertCircle className="alert-icon" />
          <span><strong>Celebration Today!</strong> There are {stats.birthdaysToday.length} birthdays today.</span>
        </div>
      )}

      <div className="dashboard-controls glass-card">
        <div className="search-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="filter-group">
          <button 
            className={`filter-btn ${activeFilter === 'favorite' ? 'active' : ''}`}
            onClick={() => toggleFilter('favorite')}
          >
            <Star size={18} fill={activeFilter === 'favorite' ? "currentColor" : "none"} />
            <span>Favorites</span>
          </button>
        </div>
      </div>

      <div className="contact-grid">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching your contacts...</p>
          </div>
        ) : contacts.length > 0 ? (
          contacts.map((contact) => (
            <div key={contact._id} className={`contact-card glass-card ${contact.favorite ? 'is-favorite' : ''}`}>
              <div className="contact-card-header">
                <div className="contact-avatar">
                  {contact.image ? (
                    <img src={contact.image} alt={contact.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    contact.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="name-wrapper">
                  <h3>{contact.name}</h3>
                  {contact.favorite && <Star className="favorite-star" size={14} fill="var(--accent)" stroke="var(--accent)" />}
                </div>
              </div>
              <div className="contact-details">
                <div className="detail-row">
                  <Phone size={16} className="detail-icon" />
                  <span>{contact.phone}</span>
                </div>
                {contact.notes && (
                  <div className="detail-row">
                    <FileText size={16} className="detail-icon" />
                    <p className="notes-preview">{contact.notes}</p>
                  </div>
                )}
              </div>
              <div className="contact-actions">
                <button onClick={() => toggleFavorite(contact)} className="btn-icon-sm fav-btn">
                  <Star size={18} fill={contact.favorite ? "var(--accent)" : "none"} stroke={contact.favorite ? "var(--accent)" : "currentColor"} />
                </button>
                <button onClick={() => openEditModal(contact)} className="btn-icon-sm edit-btn">
                  <Edit3 size={18} />
                </button>
                <button onClick={() => confirmDelete(contact._id)} className="btn-icon-sm delete-btn">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state glass-card">
            <p>{search ? 'No contacts found matching your search.' : filterFavorite ? 'No favorite contacts found.' : "You haven't added any contacts yet."}</p>
            {!search && !filterFavorite && <button onClick={openAddModal} className="btn btn-link">Add your first contact</button>}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination glass-card">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
            className="pagination-btn"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="pagination-info">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(page + 1)}
            className="pagination-btn"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {showModal && (
        <ContactForm 
          contact={currentContact} 
          onClose={() => setShowModal(false)}
          onRefresh={() => { fetchContacts(); fetchStats(); }}
        />
      )}

      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-zoom" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ color: 'var(--error)', marginBottom: '1.5rem' }}>
              <Trash2 size={48} />
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Delete Contact?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Are you sure you want to remove this contact? This action cannot be undone.
            </p>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete} 
                className="btn" 
                style={{ background: 'var(--error)', color: 'white' }}
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
