import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Download, TrendingUp, BarChart4, Star, Award, Layers } from 'lucide-react';
import jsPDF from 'jspdf';

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

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text('VENDORBRIDGE PROCUREMENT ANALYTICS REPORT', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 105, 26, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);
    
    let yPos = 45;
    
    // 1. Monthly Trends
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('1. MONTHLY PROCUREMENTS TRENDS', 20, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    analytics.spendTrend.forEach(t => {
      doc.text(`${t.month}:`, 25, yPos);
      doc.text(`$${t.amount.toLocaleString()} USD`, 80, yPos);
      yPos += 6;
    });
    
    yPos += 10;
    
    // 2. Spending by Categories
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. SPENDING BY VENDOR CATEGORIES', 20, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    analytics.categorySpend.forEach(c => {
      doc.text(`${c.category}:`, 25, yPos);
      doc.text(`$${c.amount.toLocaleString()} USD`, 80, yPos);
      yPos += 6;
    });
    
    yPos += 10;
    
    // Check page break for the next section
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    // 3. Vendor Performance
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. VENDOR PERFORMANCE RATINGS & STATS', 20, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    analytics.vendorPerformance.forEach(v => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(v.name, 25, yPos);
      doc.text(`Rating: ${v.rating.toFixed(1)} | Orders: ${v.count} | Value: $${v.total.toLocaleString()} USD`, 25, yPos + 5);
      yPos += 12;
    });
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Report compiled automatically by VendorBridge ERP System.', 105, 280, { align: 'center' });
    
    // Save PDF
    doc.save(`Procurement_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
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
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>
            {analytics.isVendor ? 'Vendor Performance Dashboard' : 'ERP Procurement Reports & Analytics'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            {analytics.isVendor ? 'Track your proposal success rate, order fulfillment, and earnings.' : 'Analyze monthly trends, category spending allocations, and vendor performance stats.'}
          </p>
        </div>
        {!analytics.isVendor && (
          <button className="btn btn-primary" onClick={handleExportData}>
            <Download size={14} /> Export Report File
          </button>
        )}
      </div>

      {analytics.isVendor ? (
        <div className="grid-2">
          {/* Vendor Earnings Trend */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
              <h3 className="card-title" style={{ margin: 0 }}>My Billed Earnings (Last 6 Months)</h3>
            </div>
            <div className="chart-container">
              {analytics.earningsTrend.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No earnings data recorded yet.</div>
              ) : (
                analytics.earningsTrend.map((t, idx) => {
                  const maxAmt = Math.max(...analytics.earningsTrend.map(x => x.amount), 1);
                  const barHeight = `${(t.amount / maxAmt) * 80}%`;
                  return (
                    <div className="chart-bar-group" key={idx}>
                      <div className="chart-bar" style={{ height: barHeight, backgroundColor: 'var(--success)' }}>
                        <span className="chart-bar-value">${(t.amount / 1000).toFixed(0)}k</span>
                      </div>
                      <span className="chart-label">{t.month}</span>
                    </div>
                  );
                })
              )}
              <div className="chart-y-axis"></div>
            </div>
          </div>

          {/* Quotation & PO Stats */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <BarChart4 size={18} style={{ color: 'var(--primary)' }} />
              <h3 className="card-title" style={{ margin: 0 }}>Proposal & Order Fulfillment Metrics</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Quotations Breakdown</h4>
                {analytics.quotationStats.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No quotations submitted.</div>
                ) : (
                  analytics.quotationStats.map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{s.status}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.count}</span>
                    </div>
                  ))
                )}
              </div>
              
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Purchase Orders</h4>
                {analytics.orderStats.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No orders received.</div>
                ) : (
                  analytics.orderStats.map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{s.status}</span>
                      <span style={{ fontWeight: 700, color: 'var(--success)' }}>{s.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default ReportPanel;
