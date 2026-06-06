import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FileCheck, Mail, Printer, Download, CreditCard, ChevronRight, ListCollapse, Eye } from 'lucide-react';

const BillingCenter = () => {
  const { user } = useAuth();
  
  // Tab states: 'po' | 'invoice'
  const [activeTab, setActiveTab] = useState('po');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Data
  const [pos, setPos] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [approvedQuotes, setApprovedQuotes] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ordersData = await api.get('/orders');
      setPos(ordersData);

      const invoicesData = await api.get('/invoices');
      setInvoices(invoicesData);

      // If Procurement Officer, fetch approved quotes that don't have POs
      if (['Procurement Officer', 'Admin'].includes(user.role)) {
        const rfqs = await api.get('/rfqs');
        const approvedList = [];

        for (const rfq of rfqs) {
          const quotes = await api.get(`/quotations/rfq/${rfq.id}`);
          const approved = quotes.filter(q => q.status === 'Approved');
          
          for (const q of approved) {
            // Check if PO already exists
            const alreadyHasPo = ordersData.some(po => po.quotation_id === q.id);
            if (!alreadyHasPo) {
              approvedList.push({ ...q, rfq_title: rfq.title, rfq_qty: rfq.quantity });
            }
          }
        }
        setApprovedQuotes(approvedList);
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreatePo = async (quoteId) => {
    setActionLoading(true);
    try {
      await api.post('/orders', { quotationId: quoteId });
      alert('Purchase Order successfully generated.');
      await fetchData();
    } catch (err) {
      alert(`PO creation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvoice = async (poId) => {
    setActionLoading(true);
    try {
      await api.post('/invoices', { purchaseOrderId: poId });
      alert('Invoice successfully generated.');
      await fetchData();
    } catch (err) {
      alert(`Invoice generation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePoStatus = async (poId, newStatus) => {
    setActionLoading(true);
    try {
      await api.patch(`/orders/${poId}/status`, { status: newStatus });
      alert(`PO status updated to ${newStatus}.`);
      await fetchData();
    } catch (err) {
      alert(`PO update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId, newStatus) => {
    setActionLoading(true);
    try {
      await api.patch(`/invoices/${invoiceId}/status`, { status: newStatus });
      alert(`Invoice marked as ${newStatus}.`);
      await fetchData();
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        // Refresh details
        const refreshedInv = await api.get(`/invoices/${invoiceId}`);
        setSelectedInvoice(refreshedInv);
      }
    } catch (err) {
      alert(`Invoice status update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenInvoiceDetails = async (invoiceId) => {
    setLoading(true);
    try {
      const data = await api.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(data);
    } catch (err) {
      alert(`Failed to load invoice details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSimulatedPdf = (invoice) => {
    const docText = `
VENDORBRIDGE PROCUREMENT ERP
INVOICE DETAILS - ${invoice.invoice_number}
===========================================
Invoice Date: ${new Date(invoice.created_at).toLocaleDateString()}
PO Reference: ${invoice.po_number}
Payment Status: ${invoice.status.toUpperCase()}

Vendor Partner:
-------------------------------------------
Company: ${invoice.company_name}
GST Number: ${invoice.gst_number || 'N/A'}
Contact: ${invoice.contact_phone}
Address: ${invoice.address}

Bidded Proposal Item:
-------------------------------------------
Scope/RFQ: ${invoice.rfq_title}
Unit Count: ${invoice.quantity}
Unit Price: $${(parseFloat(invoice.base_amount) / parseInt(invoice.quantity)).toFixed(2)} USD

Calculated Total:
-------------------------------------------
Subtotal Amount: $${parseFloat(invoice.base_amount).toFixed(2)} USD
GST Tax (18%): $${parseFloat(invoice.tax_amount).toFixed(2)} USD
Grand Total: $${parseFloat(invoice.total_amount).toFixed(2)} USD

===========================================
    `;
    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoice_number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailAddress) return;
    setActionLoading(true);
    try {
      await api.post(`/invoices/${selectedInvoice.id}/email`, { emailAddress });
      alert(`Invoice dispatched to ${emailAddress} successfully (simulated).`);
      setShowEmailModal(false);
    } catch (err) {
      alert(`Email dispatch failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && pos.length === 0 && invoices.length === 0) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading billing records...</div>;
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Procurement & Financial Billing Center</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Convert agreements to purchase orders, issue invoices, and track payment transactions.</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <button
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            color: activeTab === 'po' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'po' ? '2px solid var(--primary)' : 'none',
            fontWeight: activeTab === 'po' ? 600 : 500,
            cursor: 'pointer'
          }}
          onClick={() => { setActiveTab('po'); setSelectedInvoice(null); }}
        >
          Purchase Orders ({pos.length})
        </button>
        <button
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            color: activeTab === 'invoice' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'invoice' ? '2px solid var(--primary)' : 'none',
            fontWeight: activeTab === 'invoice' ? 600 : 500,
            cursor: 'pointer'
          }}
          onClick={() => { setActiveTab('invoice'); setSelectedInvoice(null); }}
        >
          Invoices ({invoices.length})
        </button>
      </div>

      {/* Invoice Email Modal Popup */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Email Invoice Document</h3>
              <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowEmailModal(false)}>✕</span>
            </div>
            <form onSubmit={handleSendEmail}>
              <div className="form-group">
                <label className="form-label">Recipient Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="accounts@vendor.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEmailModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  <Mail size={14} /> Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Tab Contents */}
      {activeTab === 'po' && !selectedInvoice && (
        <div>
          {/* PO generator list for Procurement Officers */}
          {['Procurement Officer', 'Admin'].includes(user.role) && approvedQuotes.length > 0 && (
            <div className="card" style={{ border: '1px dashed var(--primary)', backgroundColor: 'var(--primary-light)', padding: '16px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>Approved Bids Awaiting PO Dispatch</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {approvedQuotes.map(q => (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                    <div>
                      🏢 <strong>{q.company_name}</strong> selected for <strong>{q.rfq_title}</strong> (Bid: ${parseFloat(q.price).toLocaleString()})
                    </div>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleCreatePo(q.id)} disabled={actionLoading}>
                      Generate PO
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List of POs */}
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>PO Reference</th>
                  <th>Vendor Partner</th>
                  <th>Project / RFQ</th>
                  <th>Order Cost</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pos.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                      No Purchase Orders found.
                    </td>
                  </tr>
                ) : (
                  pos.map(po => {
                    const hasInvoice = invoices.some(inv => inv.purchase_order_id === po.id);
                    return (
                      <tr key={po.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{po.po_number}</td>
                        <td>{po.company_name}</td>
                        <td>{po.rfq_title}</td>
                        <td style={{ fontWeight: 700 }}>${parseFloat(po.price).toLocaleString()}</td>
                        <td>
                          <span className={`badge badge-${po.status.toLowerCase()}`}>{po.status}</span>
                        </td>
                        <td>
                          {user.role === 'Vendor' && po.status === 'Sent' && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--success)' }} onClick={() => handleUpdatePoStatus(po.id, 'Accepted')} disabled={actionLoading}>
                                Accept
                              </button>
                              <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleUpdatePoStatus(po.id, 'Cancelled')} disabled={actionLoading}>
                                Cancel
                              </button>
                            </div>
                          )}

                          {['Procurement Officer', 'Admin'].includes(user.role) && (
                            <div>
                              {hasInvoice ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Invoiced</span>
                              ) : ['Sent', 'Accepted'].includes(po.status) ? (
                                <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleCreateInvoice(po.id)} disabled={actionLoading}>
                                  Generate Invoice
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>PO {po.status}</span>
                              )}
                            </div>
                          )}

                          {user.role === 'Manager' && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Read-only</span>
                          )}

                          {user.role === 'Vendor' && po.status !== 'Sent' && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Acknowledged</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Tab Contents */}
      {activeTab === 'invoice' && !selectedInvoice && (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>PO Reference</th>
                <th>Vendor Partner</th>
                <th>Grand Total</th>
                <th>Billing Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    No invoices recorded in ledger.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.invoice_number}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{inv.po_number}</td>
                    <td>{inv.company_name}</td>
                    <td style={{ fontWeight: 700 }}>${parseFloat(inv.total_amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${inv.status.toLowerCase()}`}>{inv.status}</span>
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }} onClick={() => handleOpenInvoiceDetails(inv.id)}>
                        <Eye size={12} /> View invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail printable Invoice view */}
      {selectedInvoice && (
        <div>
          <div style={{ display: 'flex', justifySelf: 'flex-start', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }} className="no-print" onClick={() => setSelectedInvoice(null)}>
            <ListCollapse size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to Invoice List</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '16px' }} className="no-print">
            {['Procurement Officer', 'Admin'].includes(user.role) && selectedInvoice.status === 'Pending' && (
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }} onClick={() => handleUpdateInvoiceStatus(selectedInvoice.id, 'Paid')} disabled={actionLoading}>
                <CreditCard size={14} /> Record Payment
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => handleDownloadSimulatedPdf(selectedInvoice)}>
              <Download size={14} /> Download Plain Text
            </button>
            <button className="btn btn-secondary" onClick={() => { setEmailAddress(selectedInvoice.contact_email || ''); setShowEmailModal(true); }}>
              <Mail size={14} /> Email Invoice
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={14} /> Print Invoice
            </button>
          </div>

          {/* Actual Invoice Sheet (styled like raw billing) */}
          <div className="card" style={{ padding: '40px', border: '1px solid var(--border-color)', maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', color: '#1e293b', boxShadow: 'var(--shadow-md)' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #334155', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>VENDORBRIDGE</h1>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Enterprise Procurement Operations</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>INVOICE</h2>
                <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px', color: '#475569', marginTop: '4px' }}>{selectedInvoice.invoice_number}</div>
              </div>
            </div>

            {/* Meta Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '36px', fontSize: '13px' }}>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase' }}>Supplier Details:</div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedInvoice.company_name}</div>
                <div style={{ color: '#475569', marginTop: '4px' }}>📞 {selectedInvoice.contact_phone}</div>
                <div style={{ color: '#475569' }}>📍 {selectedInvoice.address}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '6px', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                  GSTIN: {selectedInvoice.gst_number || 'NOT PROVIDED'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase' }}>Invoice metadata:</div>
                <div><strong>Invoice Date:</strong> {new Date(selectedInvoice.created_at).toLocaleDateString()}</div>
                <div style={{ marginTop: '2px' }}><strong>PO Reference:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedInvoice.po_number}</span></div>
                <div style={{ marginTop: '2px' }}><strong>PO Date:</strong> {new Date(selectedInvoice.po_date).toLocaleDateString()}</div>
                <div style={{ marginTop: '8px' }}>
                  <strong>Payment Status:</strong>{' '}
                  <span className={`badge badge-${selectedInvoice.status.toLowerCase()}`} style={{ border: '1px solid currentColor' }}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Line items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '36px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ backgroundColor: 'transparent', color: '#475569', padding: '10px 0', borderBottom: 'none' }}>Description of Work</th>
                  <th style={{ backgroundColor: 'transparent', color: '#475569', padding: '10px 0', borderBottom: 'none', textAlign: 'right' }}>Quantity</th>
                  <th style={{ backgroundColor: 'transparent', color: '#475569', padding: '10px 0', borderBottom: 'none', textAlign: 'right' }}>Base Amount (USD)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px 0', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedInvoice.rfq_title}</div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Sourced under agreement PO-{selectedInvoice.po_number}</span>
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 600 }}>{selectedInvoice.quantity}</td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 700 }}>${parseFloat(selectedInvoice.base_amount).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            {/* Grand Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '13px' }}>
              <div style={{ width: '280px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>${parseFloat(selectedInvoice.base_amount).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>GST Tax (18%):</span>
                  <span style={{ fontWeight: 600 }}>${parseFloat(selectedInvoice.tax_amount).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>
                  <span>Grand Total:</span>
                  <span>${parseFloat(selectedInvoice.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer Notice */}
            <div style={{ marginTop: '60px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
              This is a computer-generated transaction ledger document. No signature required.
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default BillingCenter;