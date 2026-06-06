import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, ShieldCheck, ShieldAlert, Award, Star } from 'lucide-react';

const VendorManagement = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add Vendor Form State
  const [newVendor, setNewVendor] = useState({
    name: '', email: '', password: 'VendorPassword123!',
    companyName: '', category: 'IT & Hardware', gstNumber: '', phone: '', address: 'TBD'
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await api.get('/vendors');
      setVendors(data);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleStatusChange = async (vendorId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change this vendor's status to ${newStatus}?`)) {
      return;
    }
    
    setActionLoading(true);
    setMessage('');
    try {
      await api.patch(`/vendors/${vendorId}/status`, { status: newStatus });
      setMessage(`Vendor status changed to ${newStatus} successfully.`);
      setSelectedVendor(null); // Close modal
      await fetchVendors();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.company_name.toLowerCase().includes(search.toLowerCase()) || 
                          (v.gst_number && v.gst_number.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || v.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading Vendor Directory...</div>;
  }

  const allCount = vendors.length;
  const activeCount = vendors.filter(v => v.status === 'Approved').length;
  const pendingCount = vendors.filter(v => v.status === 'Pending').length;
  const blockedCount = vendors.filter(v => v.status === 'Inactive').length;

  return (
    <div style={{ padding: '0 20px', color: 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative' }}>
      
      {/* Header section with + Add Vendor button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '400', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Vendors</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: '0' }}>Manage supplier profiles and registrations</p>
        </div>
        {user.role === 'Admin' && (
          <button 
            onClick={() => setShowAddModal(true)}
            style={{ padding: '8px 24px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '24px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            + Add Vendor
          </button>
        )}
      </div>

      {message && (
        <div style={{ padding: '12px', marginBottom: '24px', backgroundColor: message.startsWith('Error') ? 'var(--error-light)' : 'var(--success-light)', color: message.startsWith('Error') ? 'var(--error-text)' : 'var(--success-text)', borderRadius: '6px' }}>
          {message}
        </div>
      )}

      {/* Large Pill Search Bar */}
      <div style={{ marginBottom: '32px' }}>
        <input
          type="text"
          placeholder="Search bar ...... search by name, gst number, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '16px 24px', 
            borderRadius: '32px', 
            border: '1px solid var(--border-color)', 
            backgroundColor: 'transparent', 
            color: 'var(--text-primary)',
            fontSize: '15px'
          }}
        />
      </div>

      {/* Filter Tabs Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => setStatusFilter('All')}
          style={{ padding: '6px 16px', backgroundColor: statusFilter === 'All' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border-color)', color: statusFilter === 'All' ? '#fff' : 'var(--text-primary)', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}
        >
          All ({allCount})
        </button>
        <button 
          onClick={() => setStatusFilter('Approved')}
          style={{ padding: '6px 16px', backgroundColor: statusFilter === 'Approved' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border-color)', color: statusFilter === 'Approved' ? '#fff' : 'var(--text-primary)', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}
        >
          Approved ({activeCount})
        </button>
        <button 
          onClick={() => setStatusFilter('Pending')}
          style={{ padding: '6px 16px', backgroundColor: statusFilter === 'Pending' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border-color)', color: statusFilter === 'Pending' ? '#fff' : 'var(--text-primary)', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}
        >
          Pending ({pendingCount})
        </button>
        <button 
          onClick={() => setStatusFilter('Inactive')}
          style={{ padding: '6px 16px', backgroundColor: statusFilter === 'Inactive' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border-color)', color: statusFilter === 'Inactive' ? '#fff' : 'var(--text-primary)', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}
        >
          Blocked ({blockedCount})
        </button>
      </div>

      {/* Main Table */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflowX: 'auto', backgroundColor: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px 24px', fontWeight: 'normal', color: 'var(--text-secondary)', width: '20%' }}>Vendor Name</th>
              <th style={{ padding: '16px 24px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>Category</th>
              <th style={{ padding: '16px 24px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>GST no.</th>
              <th style={{ padding: '16px 24px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>Contact no.</th>
              <th style={{ padding: '16px 24px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: 'normal', color: 'var(--text-secondary)', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No vendors found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredVendors.map((v, idx) => (
                <tr key={v.id} style={{ borderBottom: idx === filteredVendors.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px' }}>{v.company_name}</td>
                  <td style={{ padding: '16px 24px' }}>{v.category || '-'}</td>
                  <td style={{ padding: '16px 24px' }}>{v.gst_number || '-'}</td>
                  <td style={{ padding: '16px 24px' }}>{v.contact_phone || '-'}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{v.status === 'Inactive' ? 'Blocked' : v.status}</span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <button 
                      onClick={() => setSelectedVendor(v)}
                      style={{ padding: '6px 20px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vendor Details / Approval Modal */}
      {selectedVendor && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '32px', borderRadius: '12px', width: '500px', maxWidth: '90%', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>{selectedVendor.company_name}</h2>
                <span className={`badge badge-${selectedVendor.status.toLowerCase()}`}>{selectedVendor.status === 'Inactive' ? 'Blocked' : selectedVendor.status}</span>
              </div>
              <button onClick={() => setSelectedVendor(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', fontSize: '14px' }}>
              <div><strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Category</strong> {selectedVendor.category || 'N/A'}</div>
              <div><strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>GST Number</strong> {selectedVendor.gst_number || 'N/A'}</div>
              <div><strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Contact Phone</strong> {selectedVendor.contact_phone || 'N/A'}</div>
              <div><strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Contact Email</strong> {selectedVendor.contact_email || 'N/A'}</div>
              <div><strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Rating</strong> {selectedVendor.rating ? `${selectedVendor.rating} / 5` : 'Unrated'}</div>
            </div>

            {user.role === 'Admin' && (
              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <button 
                  onClick={() => handleStatusChange(selectedVendor.id, 'Approved')}
                  disabled={actionLoading || selectedVendor.status === 'Approved'}
                  style={{ flex: 1, padding: '10px', backgroundColor: 'var(--success)', color: '#fff', border: 'none', borderRadius: '8px', cursor: selectedVendor.status === 'Approved' ? 'not-allowed' : 'pointer', opacity: selectedVendor.status === 'Approved' ? 0.5 : 1 }}
                >
                  Approve / Set Active
                </button>
                <button 
                  onClick={() => handleStatusChange(selectedVendor.id, 'Inactive')}
                  disabled={actionLoading || selectedVendor.status === 'Inactive'}
                  style={{ flex: 1, padding: '10px', backgroundColor: 'var(--error-text)', color: '#fff', border: 'none', borderRadius: '8px', cursor: selectedVendor.status === 'Inactive' ? 'not-allowed' : 'pointer', opacity: selectedVendor.status === 'Inactive' ? 0.5 : 1 }}
                >
                  Block Vendor
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '32px', borderRadius: '12px', width: '500px', maxWidth: '90%', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Add New Vendor</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Company Name</label>
                <input type="text" value={newVendor.companyName} onChange={e => setNewVendor({...newVendor, companyName: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Contact Name</label>
                  <input type="text" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Contact Phone</label>
                  <input type="text" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Email (for Login)</label>
                  <input type="email" value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Category</label>
                  <input type="text" value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>GST Number</label>
                <input type="text" value={newVendor.gstNumber} onChange={e => setNewVendor({...newVendor, gstNumber: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)' }} />
              </div>
              
              <button 
                disabled={actionLoading}
                onClick={async () => {
                  if (!newVendor.companyName || !newVendor.email || !newVendor.name) {
                    alert('Please fill out the required fields (Company, Name, Email).');
                    return;
                  }
                  setActionLoading(true);
                  try {
                    await api.post('/auth/register', { ...newVendor, role: 'Vendor' });
                    setMessage(`Vendor ${newVendor.companyName} added successfully!`);
                    setShowAddModal(false);
                    fetchVendors();
                  } catch (err) {
                    alert('Failed to add vendor: ' + err.message);
                  } finally {
                    setActionLoading(false);
                  }
                }}
                style={{ width: '100%', padding: '12px', marginTop: '16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
              >
                {actionLoading ? 'Saving...' : 'Register Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorManagement;