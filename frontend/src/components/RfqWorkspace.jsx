import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, List, Calendar, User, Send, FileText, UploadCloud, X, PlusCircle } from 'lucide-react';

const RfqWorkspace = () => {
  const { user } = useAuth();
  
  // Lists & Loaders
  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Navigation states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState(null);

  // New RFQ Fields
  const [title, setTitle] = useState('Office Furniture procurement Q2');
  const [category, setCategory] = useState('Furniture');
  const [deadline, setDeadline] = useState('2025-06-15');
  const [description, setDescription] = useState('Ergonomic chairs and standing desks for 3rd floor');
  
  // Dynamic Line Items State
  const [lineItems, setLineItems] = useState([
    { item: 'Ergonomic chair', qty: '25', unit: 'NOS' },
    { item: 'Standing desks', qty: '10', unit: 'NOS' }
  ]);

  // Vendor Assignment State
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [availableVendorToAdd, setAvailableVendorToAdd] = useState('');

  // Vendor Quotation Submission Fields
  const [price, setPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Attachments State
  const [attachments, setAttachments] = useState([]);

  const fetchRfqs = async () => {
    try {
      setLoading(true);
      const data = await api.get('/rfqs');
      setRfqs(data);
    } catch (err) {
      console.error('Error fetching RFQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await api.get('/vendors');
      // Remove status filter so all registered vendors are available
      setVendors(data);
    } catch (err) {
      console.error('Error fetching vendors for RFQ allocation:', err);
    }
  };

  useEffect(() => {
    fetchRfqs();
    if (['Procurement Officer', 'Admin'].includes(user.role)) {
      fetchVendors();
    }
  }, [user]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { item: '', qty: '', unit: 'NOS' }]);
  };

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;
    setLineItems(newItems);
  };

  const handleRemoveLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleAddVendor = (e) => {
    const vId = parseInt(e.target.value);
    if (!vId) return;
    const vendorToAdd = vendors.find(v => v.id === vId);
    if (vendorToAdd && !selectedVendors.find(v => v.id === vId)) {
      setSelectedVendors([...selectedVendors, vendorToAdd]);
    }
    setAvailableVendorToAdd(''); // reset dropdown
  };

  const handleRemoveVendor = (vId) => {
    setSelectedVendors(selectedVendors.filter(v => v.id !== vId));
  };

  const handleFileUpload = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = files.map(f => f.name);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleDeleteRfq = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this RFQ? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/rfqs/${id}`);
      setSelectedRfq(null);
      await fetchRfqs();
    } catch (err) {
      console.error('Error deleting RFQ:', err);
      alert('Failed to delete RFQ: ' + err.message);
    }
  };

  const handleCreateRfqSubmit = async (status) => {
    if (!title || !deadline) {
      setMessage('Error: Title and Deadline are required fields.');
      return;
    }

    setFormLoading(true);
    setMessage('');
    try {
      await api.post('/rfqs', {
        title,
        category,
        description,
        deadline,
        lineItems,
        vendorIds: selectedVendors.map(v => v.id),
        attachments, // using actual attachments array
        status
      });
      setMessage(status === 'Draft' ? 'RFQ saved as a draft successfully.' : 'RFQ created successfully and dispatched to vendors.');
      
      // Reset fields to defaults
      setTitle('Office Furniture procurement Q2');
      setCategory('Furniture');
      setDescription('Ergonomic chairs and standing desks for 3rd floor');
      setDeadline('2025-06-15');
      setLineItems([
        { item: 'Ergonomic chair', qty: '25', unit: 'NOS' },
        { item: 'Standing desks', qty: '10', unit: 'NOS' }
      ]);
      setSelectedVendors([]);
      setAttachments([]);
      setShowCreateForm(false);
      
      await fetchRfqs();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewDetails = async (rfqId) => {
    setLoading(true);
    try {
      const data = await api.get(`/rfqs/${rfqId}`);
      setSelectedRfq(data);
      
      if (user.role === 'Vendor' && data.myQuotation) {
        setPrice(data.myQuotation.price);
        setDeliveryDays(data.myQuotation.delivery_days);
        setRemarks(data.myQuotation.remarks);
      } else {
        setPrice('');
        setDeliveryDays('');
        setRemarks('');
      }
    } catch (err) {
      alert(`Failed to load RFQ Details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    if (!price || !deliveryDays) {
      alert('Price and delivery timeline are required.');
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/quotations', {
        rfqId: selectedRfq.id,
        price,
        deliveryDays,
        remarks
      });
      alert('Quotation submitted successfully.');
      await handleViewDetails(selectedRfq.id);
      await fetchRfqs();
    } catch (err) {
      alert(`Bidding error: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading && rfqs.length === 0) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading RFQ Workspace...</div>;
  }

  return (
    <div style={{ color: 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {!showCreateForm && !selectedRfq && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '400', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Request For Quotation (RFQ) Workspace</h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: '0' }}>
              {user.role === 'Vendor' ? 'Respond to invited proposals and manage your bids.' : 'Draft RFQs, set quantities, and assign vendors.'}
            </p>
          </div>
          {['Procurement Officer', 'Admin'].includes(user.role) && (
            <button 
              onClick={() => { setShowCreateForm(true); setMessage(''); }}
              style={{ padding: '8px 24px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '24px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              + Create RFQ
            </button>
          )}
        </div>
      )}

      {message && (
        <div style={{ padding: '12px', marginBottom: '24px', backgroundColor: message.startsWith('Error') ? 'var(--error-light)' : 'var(--success-light)', color: message.startsWith('Error') ? 'var(--error-text)' : 'var(--success-text)', borderRadius: '6px' }}>
          {message}
        </div>
      )}

      {/* Creation Form Wizard matching the wireframe exactly */}
      {showCreateForm && (
        <div style={{ padding: '20px 0' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px', cursor: 'pointer' }} onClick={() => setShowCreateForm(false)}>
            <List size={16} style={{ color: 'var(--text-primary)' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Back to RFQ List</span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '400', margin: '0 0 8px 0' }}>Create RFQ's</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: '0 0 40px 0' }}>new request for quotation</p>

          {/* Progress Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', maxWidth: '600px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>1</div>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--text-secondary)', margin: '0 12px' }}></div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>2</div>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--text-secondary)', margin: '0 12px' }}></div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>3</div>
          </div>

          <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
            
            {/* Left Column: Form Fields */}
            <div style={{ flex: 1, minWidth: '350px' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-primary)' }}>RFQ's title*</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                  disabled={formLoading}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-primary)' }}>Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                  disabled={formLoading}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-primary)' }}>Deadline*</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                  disabled={formLoading}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-primary)' }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', minHeight: '80px' }}
                  disabled={formLoading}
                />
              </div>
            </div>

            {/* Right Column: Line Items & Vendors */}
            <div style={{ flex: 1, minWidth: '350px' }}>
              
              {/* Line Items Section */}
              <div style={{ marginBottom: '40px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', color: 'var(--text-primary)' }}>Line items</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ paddingBottom: '12px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>item</th>
                        <th style={{ paddingBottom: '12px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>qty</th>
                        <th style={{ paddingBottom: '12px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>Unit</th>
                        <th style={{ paddingBottom: '12px', fontWeight: 'normal', width: '30px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ paddingTop: '12px' }}>
                            <input type="text" value={item.item} onChange={(e) => handleLineItemChange(idx, 'item', e.target.value)} style={{ width: '90%', padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }} placeholder="Item name" />
                          </td>
                          <td style={{ paddingTop: '12px' }}>
                            <input type="number" value={item.qty} onChange={(e) => handleLineItemChange(idx, 'qty', e.target.value)} style={{ width: '80%', padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }} placeholder="0" />
                          </td>
                          <td style={{ paddingTop: '12px' }}>
                            <input type="text" value={item.unit} onChange={(e) => handleLineItemChange(idx, 'unit', e.target.value)} style={{ width: '80%', padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }} placeholder="Unit" />
                          </td>
                          <td style={{ paddingTop: '12px', textAlign: 'center' }}>
                            <button onClick={() => handleRemoveLineItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--error-text)', cursor: 'pointer' }}><X size={14}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={handleAddLineItem} style={{ padding: '6px 16px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}>
                  + add line item
                </button>
              </div>

              {/* Assign Vendors Section */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Assign Vendors</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {selectedVendors.map(v => (
                      <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-primary)' }}>
                        <span>{v.company_name}</span>
                        <X size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => handleRemoveVendor(v.id)} />
                      </div>
                    ))}
                    {selectedVendors.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No vendors assigned yet.</div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <select 
                      value={availableVendorToAdd}
                      onChange={handleAddVendor}
                      style={{ width: '100%', padding: '8px', background: 'transparent', color: 'var(--text-primary)', border: 'none', outline: 'none', fontSize: '13px', cursor: 'pointer' }}
                    >
                      <option value="" style={{ color: '#000' }}>+ add vendor</option>
                      {vendors.filter(v => !selectedVendors.find(sv => sv.id === v.id)).map(v => (
                        <option key={v.id} value={v.id} style={{ color: '#000' }}>{v.company_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '40px 0' }} />

          {/* Bottom Action Area */}
          <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '350px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'flex-start' }}>
              <button 
                onClick={() => handleCreateRfqSubmit('Active')} 
                disabled={formLoading}
                style={{ alignSelf: 'flex-start', padding: '10px 24px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '24px', cursor: 'pointer', fontSize: '14px', minWidth: '220px' }}
              >
                Save & Send to Vendors
              </button>
              <button 
                onClick={() => handleCreateRfqSubmit('Draft')} 
                disabled={formLoading}
                style={{ alignSelf: 'flex-start', padding: '10px 24px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '24px', cursor: 'pointer', fontSize: '14px', minWidth: '220px' }}
              >
                Save as Draft
              </button>
            </div>

            <div style={{ flex: 1, minWidth: '350px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px' }}>Attachments</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                {attachments.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '6px 12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={14} style={{ color: 'var(--primary)' }} />
                      <span>{file}</span>
                    </div>
                    <X size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(idx); }} />
                  </div>
                ))}
              </div>

              <label style={{ display: 'block', border: '1px dashed var(--text-secondary)', borderRadius: '8px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', backgroundColor: 'transparent' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <UploadCloud size={24} />
                  <span style={{ fontSize: '13px' }}>Drag & drop files or click to upload</span>
                </div>
                <input type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
            </div>
          </div>

        </div>
      )}

      {/* RFQ Detail View */}
      {selectedRfq && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }} onClick={() => { setSelectedRfq(null); fetchRfqs(); }}>
            <List size={16} style={{ color: 'var(--text-primary)' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Back to RFQ List</span>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '500', margin: 0 }}>{selectedRfq.title}</h3>
                <span className={`badge badge-${selectedRfq.status.toLowerCase()}`}>{selectedRfq.status}</span>
              </div>
              {user.role === 'Admin' && (
                <button 
                  onClick={() => handleDeleteRfq(selectedRfq.id)}
                  style={{ padding: '8px 16px', backgroundColor: 'var(--error-light)', color: 'var(--error-text)', border: '1px solid var(--error-text)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Delete RFQ
                </button>
              )}
            </div>
            
            {selectedRfq.category && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Category: {selectedRfq.category}</div>
            )}
            
            <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
              {selectedRfq.description || 'No description provided.'}
            </p>
            
            <div style={{ display: 'flex', gap: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '24px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Deadline</span>
                <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>
                  {new Date(selectedRfq.deadline).toLocaleDateString()}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Created By</span>
                <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>
                  {selectedRfq.creator_name}
                </div>
              </div>
            </div>

            {/* Attachments Display in Detail View */}
            {selectedRfq.attachments && JSON.parse(selectedRfq.attachments).length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Attachments</h4>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {JSON.parse(selectedRfq.attachments).map((att, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: '24px', fontSize: '13px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)', cursor: 'pointer' }}>
                      <FileText size={14} style={{ color: 'var(--primary)' }} />
                      <span>{att}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Line Items display */}
            {selectedRfq.line_items && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Requested Items</h4>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Item</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Qty</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {JSON.parse(selectedRfq.line_items).map((item, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px' }}>{item.item}</td>
                          <td style={{ padding: '12px 16px' }}>{item.qty}</td>
                          <td style={{ padding: '12px 16px' }}>{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Vendors List for Admin/PO */}
            {['Procurement Officer', 'Admin'].includes(user.role) && (
              <div>
                <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Assigned Vendors</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedRfq.assignedVendors && selectedRfq.assignedVendors.length > 0 ? (
                    selectedRfq.assignedVendors.map(v => (
                      <span key={v.id} style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '16px', fontSize: '12px' }}>
                        {v.company_name}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None assigned.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vendor Bidding Panel */}
          {user.role === 'Vendor' && selectedRfq.status === 'Active' && (
            <div className="card" style={{ marginTop: '20px' }}>
              <h3 className="card-title" style={{ marginBottom: '14px' }}>
                {selectedRfq.myQuotation ? 'Update Submitted Quotation' : 'Submit Bidding Quotation'}
              </h3>
              
              <form onSubmit={handleQuoteSubmit}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Total Proposed Price (USD) *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>$</span>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        style={{ paddingLeft: '28px', width: '100%' }}
                        placeholder="e.g. 25000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        disabled={formLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Delivery Timeline (Days) *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      placeholder="e.g. 15"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                      disabled={formLoading}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Clarifications / Remarks</label>
                  <textarea
                    className="form-control"
                    placeholder="Include specifications, warranties, or delivery contingencies..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    disabled={formLoading}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  <Send size={14} /> {selectedRfq.myQuotation ? 'Save Quotation Changes' : 'Submit Official Bid'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* RFQ List */}
      {!showCreateForm && !selectedRfq && (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflowX: 'auto', backgroundColor: 'var(--bg-card)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                <th style={{ padding: '16px 24px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>RFQ CODE</th>
                <th style={{ padding: '16px 24px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>TITLE</th>
                <th style={{ padding: '16px 24px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>DEADLINE</th>
                <th style={{ padding: '16px 24px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>STATUS</th>
                <th style={{ padding: '16px 24px', fontWeight: 'normal', color: 'var(--text-secondary)', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No RFQs found in your dashboard.
                  </td>
                </tr>
              ) : (
                rfqs.map((r, idx) => (
                  <tr key={r.id} style={{ borderBottom: idx === rfqs.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 24px', fontFamily: 'monospace' }}>#RFQ-{String(r.id).padStart(4, '0')}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 500 }}>{r.title}</td>
                    <td style={{ padding: '16px 24px' }}>{new Date(r.deadline).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleViewDetails(r.id)}
                        style={{ padding: '6px 20px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RfqWorkspace;