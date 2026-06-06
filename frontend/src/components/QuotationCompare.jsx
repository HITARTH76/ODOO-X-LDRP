import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { GitPullRequest, Award, ShieldCheck, Flame, Star, CheckCircle, Clock } from 'lucide-react';

const QuotationCompare = () => {
  const { user } = useAuth();
  
  // Data State
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchAllQuotations = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await api.get(`/quotations/all`);
      setQuotations(data);
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setMessage(`Error loading quotations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllQuotations();
  }, []);

  const handleInitiateApproval = async (quoteId) => {
    if (!window.confirm('Submit this bid to the Manager/Approver for final authorization?')) {
      return;
    }

    setActionLoading(true);
    try {
      // Find the specific quotation to know its RFQ
      const quote = quotations.find(q => q.id === quoteId);
      if (quote) {
        await api.patch(`/quotations/rfq/${quote.rfq_id}`, { status: 'Submitted' });
        alert('Approval workflow successfully initiated. The reviewing manager has been notified.');
        fetchAllQuotations();
      }
    } catch (err) {
      alert(`Workflow trigger error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>All Vendor Quotations</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Review all submitted bids across all active procurement RFQs.</p>
        </div>
      </div>

      {message && (
        <div className="card" style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'var(--error-light)', color: 'var(--error-text)', borderRadius: '6px' }}>
          {message}
        </div>
      )}

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading all vendor quotations...</div>}

      {!loading && quotations.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
          No quotations have been submitted by vendors yet.
        </div>
      )}

      {/* Quotations List */}
      {!loading && quotations.length > 0 && (
        <div className="comparison-table-wrapper card" style={{ padding: '20px' }}>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>RFQ Project</th>
                  <th>Vendor Partner</th>
                  <th>Proposal Price</th>
                  <th>Delivery Days</th>
                  <th>Vendor Rating</th>
                  <th>Remarks / Notes</th>
                  <th>Bid Status</th>
                  {['Procurement Officer', 'Admin'].includes(user.role) && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => {
                  return (
                    <tr key={q.id}>
                      <td style={{ maxWidth: '200px' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary)', whiteSpace: 'normal', lineHeight: '1.4' }}>{q.rfq_title}</div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RFQ ID: #{String(q.rfq_id).padStart(4, '0')}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{q.company_name}</div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: #VND-{String(q.vendor_id).padStart(4, '0')}</span>
                      </td>
                      
                      {/* Price Cell */}
                      <td>
                        <div style={{ fontSize: '16px', fontWeight: 700 }}>
                          ${parseFloat(q.price).toLocaleString()}
                        </div>
                      </td>

                      {/* Delivery Days Cell */}
                      <td>
                        <div style={{ fontWeight: 600 }}>{q.delivery_days} Days</div>
                      </td>

                      {/* Rating Cell */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <Star size={13} fill="var(--warning)" color="var(--warning)" />
                          <span>{parseFloat(q.rating).toFixed(1)}</span>
                        </div>
                      </td>

                      <td style={{ fontSize: '12px', maxWidth: '240px', color: 'var(--text-secondary)' }}>
                        {q.remarks || 'No remarks provided.'}
                      </td>

                      <td>
                        <span className={`badge badge-${q.status.toLowerCase()}`}>{q.status}</span>
                      </td>

                      {/* Action Cell */}
                      {['Procurement Officer', 'Admin'].includes(user.role) && (
                        <td style={{ textAlign: 'right' }}>
                          {q.status === 'Submitted' ? (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                              <Clock size={14} /> Pending Manager review
                            </div>
                          ) : q.status === 'Approved' ? (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center', color: 'var(--success)', fontWeight: 600, fontSize: '12px' }}>
                              <CheckCircle size={14} /> Bid Approved
                            </div>
                          ) : q.status === 'Rejected' ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Closed</span>
                          ) : (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => handleInitiateApproval(q.id)}
                              disabled={actionLoading}
                            >
                              <GitPullRequest size={12} /> Send for Approval
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationCompare;
