import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { CheckCircle2, XCircle, FileClock, ClipboardList, Send } from 'lucide-react';

const ApprovalQueue = () => {
  const [pendingQuotes, setPendingQuotes] = useState([]);
  const [approvedQuotes, setApprovedQuotes] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [timeline, setTimeline] = useState([]);

  const fetchPendingQuotes = async () => {
    try {
      setLoading(true);
      const rfqs = await api.get('/rfqs');
      const allPending = [];
      const allApproved = [];

      for (const rfq of rfqs) {
        // Fetch quotes for each rfq
        const quotes = await api.get(`/quotations/rfq/${rfq.id}`);
        quotes.forEach(q => {
          if (q.status === 'Submitted' || q.status === 'Under Review') {
            allPending.push({ ...q, rfq_title: rfq.title, rfq_qty: rfq.quantity });
          } else if (q.status === 'Approved') {
            allApproved.push({ ...q, rfq_title: rfq.title, rfq_qty: rfq.quantity });
          }
        });
      }

      setPendingQuotes(allPending);
      setApprovedQuotes(allApproved);
    } catch (err) {
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingQuotes();
  }, []);

  const handleOpenReview = async (quote) => {
    setSelectedQuote(quote);
    setRemarks('');
    try {
      // Fetch approval history/timeline for this quote
      const data = await api.get(`/approvals/quotation/${quote.id}`);
      setTimeline(data);
    } catch (err) {
      console.error('Failed to load approval timeline:', err);
    }
  };

  const handleDecision = async (status) => {
    if (!selectedQuote) return;
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this procurement bid?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/approvals', {
        quotationId: selectedQuote.id,
        status,
        remarks
      });
      alert(`Bid has been successfully ${status.toLowerCase()}ed.`);
      setSelectedQuote(null);
      await fetchPendingQuotes();
    } catch (err) {
      alert(`Failed to register decision: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && pendingQuotes.length === 0) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading Manager Approval Queue...</div>;
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Procurement Workflow Approval Queue</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Review submitted vendor proposals, inspect bid details, and grant approvals.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('Pending')}
          style={{ padding: '6px 16px', backgroundColor: activeTab === 'Pending' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border-color)', color: activeTab === 'Pending' ? '#fff' : 'var(--text-primary)', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}
        >
          Pending ({pendingQuotes.length})
        </button>
        <button 
          onClick={() => setActiveTab('Approved')}
          style={{ padding: '6px 16px', backgroundColor: activeTab === 'Approved' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border-color)', color: activeTab === 'Approved' ? '#fff' : 'var(--text-primary)', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}
        >
          Approved ({approvedQuotes.length})
        </button>
      </div>

      {/* Detail Review Portal Modal */}
      {selectedQuote && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Review Quotation Bids</h3>
              <span style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-muted)' }} onClick={() => setSelectedQuote(null)}>✕ Close</span>
            </div>

            <div className="card" style={{ padding: '16px', marginBottom: '16px', backgroundColor: 'var(--bg-tertiary)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PROJECT / RFQ TITLE</span>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '2px 0 8px' }}>{selectedQuote.rfq_title} ({selectedQuote.rfq_qty} units)</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>VENDOR COMPANY</span>
                  <div style={{ fontWeight: 600 }}>{selectedQuote.company_name}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PROPOSAL BID</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>${parseFloat(selectedQuote.price).toLocaleString()}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DELIVERY LEADTIME</span>
                  <div style={{ fontWeight: 600 }}>{selectedQuote.delivery_days} Days</div>
                </div>
              </div>

              {selectedQuote.remarks && (
                <div style={{ marginTop: '12px', fontSize: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  <strong>Vendor Remarks:</strong> {selectedQuote.remarks}
                </div>
              )}
            </div>

            {/* Approval timeline logs */}
            {timeline.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Workflow History</h4>
                <div className="timeline" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                  {timeline.map((item) => (
                    <div className="timeline-item" key={item.id}>
                      <div className="timeline-point"></div>
                      <div className="timeline-content">
                        <span className="timeline-time">{new Date(item.created_at).toLocaleString()}</span>
                        <div style={{ fontSize: '11px' }}>
                          <strong>{item.approver_name}</strong> marked as <strong style={{ color: item.status === 'Approved' ? 'var(--success)' : 'var(--error)' }}>{item.status}</strong>
                        </div>
                        {item.remarks && <div style={{ fontSize: '10px', fontStyle: 'italic' }}>"{item.remarks}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision fields */}
            <div className="form-group">
              <label className="form-label">Approver Remarks / Comments</label>
              <textarea
                className="form-control"
                placeholder="Specify justification details for this decision..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={actionLoading}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                onClick={() => handleDecision('Rejected')}
                disabled={actionLoading}
              >
                <XCircle size={16} /> Reject Bid
              </button>
              <button
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--success)' }}
                onClick={() => handleDecision('Approved')}
                disabled={actionLoading}
              >
                <CheckCircle2 size={16} /> Approve & Close RFQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Proposal Code</th>
              <th>Vendor Partner</th>
              <th>Project / RFQ</th>
              <th>Bidding Cost</th>
              <th>Delivery Days</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'Pending' ? pendingQuotes : approvedQuotes).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                  No quotations {activeTab === 'Pending' ? 'pending approval decisions' : 'approved yet'}.
                </td>
              </tr>
            ) : (
              (activeTab === 'Pending' ? pendingQuotes : approvedQuotes).map(q => (
                <tr key={q.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>#QTE-{String(q.id).padStart(4, '0')}</td>
                  <td style={{ fontWeight: 600 }}>{q.company_name}</td>
                  <td>{q.rfq_title}</td>
                  <td style={{ fontWeight: 700 }}>${parseFloat(q.price).toLocaleString()}</td>
                  <td>{q.delivery_days} Days</td>
                  <td>
                    {activeTab === 'Pending' ? (
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleOpenReview(q)}>
                        <ClipboardList size={12} /> Review Bid
                      </button>
                    ) : (
                      <span className="badge badge-approved">Approved</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApprovalQueue;
