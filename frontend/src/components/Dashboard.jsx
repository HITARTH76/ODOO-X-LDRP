import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FileText, Users, DollarSign, Award, Clock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const Dashboard = ({ setActiveView }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [recentRfqs, setRecentRfqs] = useState([]);
  const [recentPos, setRecentPos] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch metrics
        const metricsData = await api.get('/reports/dashboard');
        setMetrics(metricsData);

        // Fetch logs
        const logsData = await api.get('/logs/activity');
        setLogs(logsData.slice(0, 5));

        // Fetch reports analytics for trend chart
        if (['Procurement Officer', 'Admin'].includes(user.role)) {
          const reportData = await api.get('/reports/analytics');
          setAnalytics(reportData);
        }

        // Fetch role specific recent items
        if (user.role === 'Procurement Officer' || user.role === 'Admin') {
          const rfqs = await api.get('/rfqs');
          setRecentRfqs(rfqs.slice(0, 5));
          const pos = await api.get('/orders');
          setRecentPos(pos.slice(0, 5));
          const invs = await api.get('/invoices').catch(() => []);
          setRecentInvoices(invs.slice(0, 5));
        } else if (user.role === 'Vendor') {
          const rfqs = await api.get('/rfqs');
          setRecentRfqs(rfqs.filter(r => r.status === 'Active').slice(0, 5));
          const pos = await api.get('/orders');
          setRecentPos(pos.slice(0, 5));
          const invs = await api.get('/invoices').catch(() => []);
          setRecentInvoices(invs.slice(0, 5));
        } else if (user.role === 'Manager') {
          const rfqs = await api.get('/rfqs');
          // Get quotations that need approval
          const pendingList = [];
          for (const rfq of rfqs) {
            const quotes = await api.get(`/quotations/rfq/${rfq.id}`);
            const pendingQuotes = quotes.filter(q => q.status === 'Submitted');
            pendingList.push(...pendingQuotes);
          }
          setPendingApprovals(pendingList.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading Dashboard Analytics...</div>;
  }

  // Helper to get initials
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'US';

  return (
    <div style={{ padding: '0 20px', color: 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Title & Subtitle */}
      <h1 style={{ fontSize: '28px', fontWeight: '500', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Dashboard</h1>
      <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>
        Welcome back, {user.role} - Today's Overview
      </p>

      {/* Metrics Row */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', flexWrap: 'wrap' }}>
        
        {(!metrics) && (
          <div style={{ width: '100%', color: 'var(--text-secondary)' }}>Loading metrics data...</div>
        )}

        {metrics && (user.role === 'Procurement Officer' || user.role === 'Admin') && (
          <>
            <div style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '32px', fontWeight: '500', marginBottom: '8px' }}>{metrics.activeRfqs || 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active RFQ's</div>
            </div>
            <div style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '32px', fontWeight: '500', marginBottom: '8px' }}>{metrics.pendingApprovals || 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pending Approvals</div>
            </div>
            <div style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '32px', fontWeight: '500', marginBottom: '8px' }}>{metrics.totalPos || 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>PO's this month</div>
            </div>
            <div style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '32px', fontWeight: '500', marginBottom: '8px' }}>
                ${parseFloat(metrics.totalSpend || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Spend</div>
            </div>
          </>
        )}

        {metrics && user.role === 'Vendor' && (
          <>
            <div style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '32px', fontWeight: '500', marginBottom: '8px' }}>{metrics.submittedQuotes || 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Submitted Bids</div>
            </div>
            <div style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '32px', fontWeight: '500', marginBottom: '8px' }}>{metrics.activeOrders || 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active Orders</div>
            </div>
            <div style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '32px', fontWeight: '500', marginBottom: '8px' }}>{metrics.pendingInvoices || 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pending Invoices</div>
            </div>
            <div style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '32px', fontWeight: '500', marginBottom: '8px' }}>{metrics.rating || '5.0'}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Vendor Rating</div>
            </div>
          </>
        )}

        {metrics && user.role === 'Manager' && (
          <>
            <div style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '32px', fontWeight: '500', marginBottom: '8px' }}>{metrics.pendingQuotes || 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pending Approvals</div>
            </div>
            <div style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '32px', fontWeight: '500', marginBottom: '8px' }}>{metrics.approvedQuotes || 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Bids Approved</div>
            </div>
            <div style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '32px', fontWeight: '500', marginBottom: '8px' }}>{metrics.rejectedQuotes || 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Bids Rejected</div>
            </div>
          </>
        )}
      </div>

      {/* Main Content: Table & Chart */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '40px', flexWrap: 'wrap' }}>
        
        {/* Left: Recent Purchase Orders Table */}
        <div style={{ flex: 2, minWidth: '400px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Recent Purchase Orders</h3>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-card)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>PO#</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Vendor</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Amount</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPos.length > 0 ? (
                  recentPos.slice(0, 4).map((po, idx, arr) => (
                    <tr key={po.id} style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{po.po_number}</td>
                      <td style={{ padding: '12px 16px' }}>{po.vendor_name || 'Vendor Partner'}</td>
                      <td style={{ padding: '12px 16px' }}>{po.total_amount ? `$${parseFloat(po.total_amount).toLocaleString()}` : '$0'}</td>
                      <td style={{ padding: '12px 16px' }}>{po.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No recent purchase orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Spending Trends Graphic */}
        <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 16px 0', color: 'var(--text-primary)', alignSelf: 'flex-start' }}>Spending Trends last 6 months</h3>
          
          <div style={{ width: '100%', maxWidth: '240px', backgroundColor: '#e8ecef', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top row: bullet list & pie chart */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8892b0' }}></div>
                    <div style={{ width: '40px', height: '4px', backgroundColor: '#ccd6f6', borderRadius: '2px' }}></div>
                  </div>
                ))}
              </div>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'conic-gradient(#4caf50 0% 60%, #2196f3 60% 85%, #ff9800 85% 100%)' }}></div>
            </div>
            {/* Middle row: line chart mockup */}
            <div style={{ width: '100%', height: '40px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                <polyline points="0,30 20,20 40,35 60,10 80,25 100,5" fill="none" stroke="#f44336" strokeWidth="2"/>
                {[0, 20, 40, 60, 80, 100].map((x, i) => (
                  <circle key={i} cx={x} cy={[30, 20, 35, 10, 25, 5][i]} r="2" fill="#f44336" />
                ))}
              </svg>
            </div>
            {/* Bottom row: bar chart mockup */}
            <div style={{ display: 'flex', gap: '8px', height: '40px', alignItems: 'flex-end', marginTop: '8px' }}>
              <div style={{ width: '12px', height: '60%', backgroundColor: '#ffb74d', borderRadius: '2px 2px 0 0' }}></div>
              <div style={{ width: '12px', height: '100%', backgroundColor: '#ffb74d', borderRadius: '2px 2px 0 0' }}></div>
              <div style={{ width: '12px', height: '40%', backgroundColor: '#ffb74d', borderRadius: '2px 2px 0 0' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: 'auto' }}>
                {[1,2,3].map(i => <div key={i} style={{ width: '50px', height: '4px', backgroundColor: '#ccd6f6', borderRadius: '2px' }}></div>)}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Horizontal Line separating buttons */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0 0 32px 0' }} />

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {user.role === 'Procurement Officer' ? (
          <>
            <button className="btn" onClick={() => setActiveView('rfqs')} style={{ padding: '8px 32px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '24px', cursor: 'pointer', fontSize: '13px' }}>
              Create RFQs
            </button>
            <button className="btn" onClick={() => setActiveView('quotations')} style={{ padding: '8px 32px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '24px', cursor: 'pointer', fontSize: '13px' }}>
              Compare quotations
            </button>
            <button className="btn" onClick={() => setActiveView('purchase_orders')} style={{ padding: '8px 32px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '24px', cursor: 'pointer', fontSize: '13px' }}>
              Generate purchase orders
            </button>
            <button className="btn" onClick={() => setActiveView('invoices')} style={{ padding: '8px 32px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '24px', cursor: 'pointer', fontSize: '13px' }}>
              Generate invoices
            </button>
          </>
        ) : (
          <>
            <button className="btn" onClick={() => setActiveView('rfqs')} style={{ padding: '8px 32px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '24px', cursor: 'pointer', fontSize: '13px' }}>
              + new RFQ
            </button>
            <button className="btn" onClick={() => setActiveView('vendors')} style={{ padding: '8px 32px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '24px', cursor: 'pointer', fontSize: '13px' }}>
              Add Vendor
            </button>
            <button className="btn" onClick={() => setActiveView('invoices')} style={{ padding: '8px 32px', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: '24px', cursor: 'pointer', fontSize: '13px' }}>
              View Invoices
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default Dashboard;