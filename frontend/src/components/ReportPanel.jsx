import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Download, TrendingUp, BarChart4, Star, Award, Layers } from 'lucide-react';

const ReportPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await api.get('/reports/analytics');
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportData = () => {
    if (!analytics) return;

    const exportText = `
VENDORBRIDGE PROCUREMENT ANALYTICS REPORT
Export Date: ${new Date().toLocaleString()}
==================================================

1. MONTHLY PROCUREMENTS TRENDS
--------------------------------------------------
${analytics.spendTrend.map(t => `${t.month}: $${t.amount.toLocaleString()} USD`).join('\n')}

2. SPENDING BY VENDOR CATEGORIES
--------------------------------------------------
${analytics.categorySpend.map(c => `${c.category}: $${c.amount.toLocaleString()} USD`).join('\n')}

3. VENDOR PERFORMANCE RATINGS & STATS
--------------------------------------------------
${analytics.vendorPerformance.map(v => `${v.name} | Rating: ${v.rating} | Orders: ${v.count} | Value: $${v.total.toLocaleString()} USD`).join('\n')}

==================================================
Report compiled automatically by VendorBridge ERP System.
    `;

    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Procurement_Analytics_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Compiling analytics reports...</div>;
  }

  if (!analytics) {
    return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>No report data loaded. Check connection.</div>;
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>ERP Procurement Reports & Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Analyze monthly trends, category spending allocations, and vendor performance stats.</p>
        </div>
        <button className="btn btn-primary" onClick={handleExportData}>
          <Download size={14} /> Export Report File
        </button>
      </div>

      <div className="grid-2">
        {/* Spend Trend Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>Monthly Procurement Trends</h3>
          </div>
          
          <div className="chart-container">
            {analytics.spendTrend.map((t, idx) => {
              const maxAmt = Math.max(...analytics.spendTrend.map(x => x.amount), 1);
              const barHeight = `${(t.amount / maxAmt) * 80}%`;
              return (
                <div className="chart-bar-group" key={idx}>
                  <div className="chart-bar" style={{ height: barHeight }}>
                    <span className="chart-bar-value">${(t.amount / 1000).toFixed(0)}k</span>
                  </div>
                  <span className="chart-label">{t.month}</span>
                </div>
              );
            })}
            <div className="chart-y-axis"></div>
          </div>
        </div>

        {/* Category Allocation Horizontal Bars */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>Spending by Category Allocation</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
            {analytics.categorySpend.map((c, idx) => {
              const maxCatAmt = Math.max(...analytics.categorySpend.map(x => x.amount), 1);
              const pctWidth = `${(c.amount / maxCatAmt) * 100}%`;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    <span>{c.category}</span>
                    <span>${c.amount.toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: pctWidth, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vendor Performance Ranking List */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Award size={18} style={{ color: 'var(--primary)' }} />
          <h3 className="card-title" style={{ margin: 0 }}>Vendor Performance Analytics</h3>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Performance Rating</th>
                <th>Fulfillment Count</th>
                <th>Total Transaction Value</th>
              </tr>
            </thead>
            <tbody>
              {analytics.vendorPerformance.map((v, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{v.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} fill="var(--warning)" color="var(--warning)" />
                      <span style={{ fontWeight: 600 }}>{v.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td>{v.count} Purchase Orders</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    ${parseFloat(v.total).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportPanel;