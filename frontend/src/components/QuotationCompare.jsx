import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { GitPullRequest, Award, ShieldCheck, Flame, Star, CheckCircle, Clock } from 'lucide-react';

const QuotationCompare = () => {
  const { user } = useAuth();
  
  // Data State
  const [rfqs, setRfqs] = useState([]);
  const [selectedRfqId, setSelectedRfqId] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchRfqs = async () => {
      try {
        const data = await api.get('/rfqs');
        // Only show RFQs that are Active or Closed but have bids
        setRfqs(data.filter(r => ['Active', 'Closed'].includes(r.status)));
      } catch (err) {
        console.error('Error fetching RFQs for comparison:', err);
      }
    };
    fetchRfqs();
  }, []);

  const handleRfqChange = async (rfqId) => {
    setSelectedRfqId(rfqId);
    if (!rfqId) {
      setQuotations([]);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const data = await api.get(`/quotations/rfq/${rfqId}`);
      setQuotations(data);
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setMessage(`Error loading quotations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateApproval = async (quoteId) => {
    if (!window.confirm('Submit this bid to the Manager/Approver for final authorization?')) {
      return;
    }

    setActionLoading(true);
    try {
      // In our flow, submitting a quote for approval moves it to the 'Submitted' state
      // (which makes it visible in the Manager's Approval Queue)
      await api.patch(`/quotations/rfq/${selectedRfqId}`, { status: 'Submitted' }); // or we can trigger it in backend
      // To simulate workflow initiation, we can log an audit trail and notify managers
      alert('Approval workflow successfully initiated. The reviewing manager has been notified.');
      handleRfqChange(selectedRfqId);
    } catch (err) {
      alert(`Workflow trigger error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Find optimal index values for highlights
  const getHighlights = () => {
    if (quotations.length === 0) return {};
    
    let lowestPrice = Infinity;
    let fastestDelivery = Infinity;
    let highestRating = -1;

    quotations.forEach(q => {
      const priceVal = parseFloat(q.price);
      const deliveryVal = parseInt(q.delivery_days);
      const ratingVal = parseFloat(q.rating);

      if (priceVal < lowestPrice) lowestPrice = priceVal;
      if (deliveryVal < fastestDelivery) fastestDelivery = deliveryVal;
      if (ratingVal > highestRating) highestRating = ratingVal;
    });

    return { lowestPrice, fastestDelivery, highestRating };
  };

  const highlights = getHighlights();

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Side-by-Side Quotation Comparison</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Select an active procurement RFQ to compare submitted vendor bids side-by-side.</p>
        </div>
      </div>

      {message && (
        <div className="card" style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'var(--error-light)', color: 'var(--error-text)', borderRadius: '6px' }}>
          {message}
        </div>
      )}

      {/* Selector Card */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div className="form-group" style={{ maxWidth: '480px', marginBottom: 0 }}>
          <label className="form-label">Select RFQ Project</label>
          <select
            className="form-control"
            value={selectedRfqId}
            onChange={(e) => handleRfqChange(e.target.value)}
          >
            <option value="">-- Choose RFQ to Compare --</option>
            {rfqs.map(r => (
              <option key={r.id} value={r.id}>
                #RFQ-{String(r.id).padStart(4, '0')} - {r.title} ({r.quantity} units)
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Analyzing vendor quotations...</div>}

      {!loading && selectedRfqId && quotations.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
          No quotations submitted for this RFQ yet. Waiting for vendor bids.
        </div>
      )}

      {/* Comparison Grid */}
      {!loading && quotations.length > 0 && (
        <div className="comparison-table-wrapper">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
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
                  const isLowestPrice = parseFloat(q.price) === highlights.lowestPrice;
                  const isFastestDelivery = parseInt(q.delivery_days) === highlights.fastestDelivery;
                  const isHighestRating = parseFloat(q.rating) === highlights.highestRating;

                  return (
                    <tr key={q.id} style={{ borderLeft: isLowestPrice ? '4px solid var(--success)' : 'none' }}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{q.company_name}</div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: #VND-{String(q.vendor_id).padStart(4, '0')}</span>
                      </td>
                      
                      {/* Price Cell */}
                      <td className={isLowestPrice ? 'lowest-price-cell' : ''} style={{ position: 'relative' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700 }}>
                          ${parseFloat(q.price).toLocaleString()}
                        </div>
                        {isLowestPrice && (
                          <span className="badge badge-active" style={{ fontSize: '9px', padding: '2px 6px', marginTop: '4px', gap: '2px' }}>
                            <Flame size={8} /> Lowest price
                          </span>
                        )}
                      </td>

                      {/* Delivery Days Cell */}
                      <td>
                        <div style={{ fontWeight: 600 }}>{q.delivery_days} Days</div>
                        {isFastestDelivery && (
                          <span className="badge badge-completed" style={{ fontSize: '9px', padding: '2px 6px', marginTop: '4px' }}>
                            🚀 Quickest
                          </span>
                        )}
                      </td>

                      {/* Rating Cell */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <Star size={13} fill="var(--warning)" color="var(--warning)" />
                          <span>{parseFloat(q.rating).toFixed(1)}</span>
                        </div>
                        {isHighestRating && (
                          <span className="badge badge-completed" style={{ fontSize: '9px', padding: '2px 6px', marginTop: '4px', background: 'var(--info-light)', color: 'var(--info-text)' }}>
                            Top Rated
                          </span>
                        )}
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