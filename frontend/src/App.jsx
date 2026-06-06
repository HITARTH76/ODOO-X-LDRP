import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import VendorManagement from './components/VendorManagement';
import RfqWorkspace from './components/RfqWorkspace';
import QuotationCompare from './components/QuotationCompare';
import ApprovalQueue from './components/ApprovalQueue';
import BillingCenter from './components/BillingCenter';
import ReportPanel from './components/ReportPanel';
import LogsPanel from './components/LogsPanel';
import AdminDashboard from './components/AdminDashboard';
import { api } from './utils/api';
import InventoryManager from './components/InventoryManager';
import ProductCatalog from './components/ProductCatalog';
// Icon library
import {
  LayoutDashboard,
  Users,
  FileText,
  GitCompare,
  CheckSquare,
  CreditCard,
  BarChart3,
  ListTodo,
  LogOut,
  Bell,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';

const App = () => {
  const { user, loading, logout } = useAuth();
  
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // Notification center states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Active view routing
  const [activeView, setActiveView] = useState('dashboard');

  // Handle theme transitions
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load notifications if user logged in
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.get('/logs/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkNotificationsRead = async () => {
    try {
      await api.post('/logs/notifications/read');
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite' }}></div>
          <span>Synchronizing Session Details...</span>
        </div>
      </div>
    );
  }

  // If user is null, prompt Auth form
  if (!user) {
    return <Login />;
  }

  // Determine available navigation views based on user's role
  const getNavItems = () => {
    switch (user.role) {
      case 'Vendor':
        return [
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'rfqs', label: "RFQ's" },
          { id: 'quotations', label: 'My Quotations' },
          { id: 'purchase_orders', label: 'My Orders' },
          { id: 'invoices', label: 'Invoices' },
          { id: 'reports', label: 'Reports' },
          { id: 'logs', label: 'Activity' },
        ];
      case 'Procurement Officer':
        return [
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'rfqs', label: 'Create RFQs' },
          { id: 'quotations', label: 'Compare quotations' },
          { id: 'purchase_orders', label: 'Generate purchase orders' },
          { id: 'invoices', label: 'Generate invoices' },
        ];
      case 'Manager':
        return [
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'quotations', label: 'Compare quotations' },
          { id: 'approvals', label: 'Approvals' },
          { id: 'reports', label: 'Reports' },
        ];
      case 'Admin':
      default:
        return [
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'admin', label: 'Admin' },
          { id: 'vendors', label: 'Vendors' },
          { id: 'rfqs', label: "RFQ's" },
          { id: 'quotations', label: 'Quotations' },
          { id: 'approvals', label: 'Approvals' },
          { id: 'purchase_orders', label: 'Purchase orders' },
          { id: 'invoices', label: 'Invoices' },
          { id: 'reports', label: 'Reports' },
          { id: 'logs', label: 'Activity' },
        ];
    }
  };

  const navItems = getNavItems();

  // Helper to render active panel component
  const renderContentView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard setActiveView={setActiveView} />;
      case 'admin':
        return <AdminDashboard setActiveView={setActiveView} />;
      case 'vendors':
        return <VendorManagement />;
      case 'rfqs':
        return <RfqWorkspace />;
      case 'quotations':
        return <QuotationCompare />;
      case 'approvals':
        return <ApprovalQueue />;
      case 'billing':
      case 'purchase_orders':
      case 'invoices':
        return <BillingCenter activeView={activeView} />;
      case 'reports':
        return <ReportPanel />;
      case 'logs':
        return <LogsPanel />;
      case 'inventory':
        return <InventoryManager setActiveView={setActiveView} />;
      case 'catalog':
        return <ProductCatalog />;
      default:
        return <Dashboard setActiveView={setActiveView} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* Top Header Navbar with all Nav items */}
      <header className="header-nav no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0, marginRight: '24px' }} onClick={() => setActiveView('dashboard')}>
          <div className="brand-logo" style={{ width: '32px', height: '32px', fontSize: '15px', borderRadius: '4px', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>VB</div>
          <span className="brand-text" style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '0.5px' }}>VendorBridge</span>
        </div>

        {/* Navigation Buttons (Upper Side) */}
        <div className="header-nav-buttons" style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: 1 }}>
          {navItems.map(item => {
            const isMatch = activeView === item.id || (activeView === 'billing' && (item.id === 'purchase_orders' || item.id === 'invoices'));
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                  backgroundColor: isMatch ? 'var(--primary)' : 'transparent',
                  color: isMatch ? '#fff' : 'var(--text-secondary)',
                  border: isMatch ? 'none' : '1px solid transparent',
                  borderRadius: '20px', cursor: 'pointer', fontSize: '14px', fontWeight: isMatch ? 600 : 400,
                  transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Header Actions & Profile */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          {/* Theme Toggler */}
          <button className="header-icon-btn" onClick={toggleTheme} title="Toggle Color Theme" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Notification Bell Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="header-icon-btn"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadCount > 0) handleMarkNotificationsRead();
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', position: 'relative' }}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="badge-dot" style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', backgroundColor: 'red', borderRadius: '50%' }}></span>}
            </button>
            {showNotifications && (
              <div className="notif-dropdown" style={{ position: 'absolute', right: 0, top: '40px', width: '300px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000 }}>
                <div className="notif-header" style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications Center</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer' }} onClick={handleMarkNotificationsRead}>
                      Mark all read
                    </span>
                  )}
                </div>
                <div className="notif-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No notifications found.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', backgroundColor: !n.is_read ? 'rgba(66, 165, 245, 0.05)' : 'transparent' }}>
                        <div className="notif-message" style={{ fontSize: '13px', marginBottom: '4px' }}>{n.message}</div>
                        <div className="notif-time" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="notif-footer" onClick={() => { setShowNotifications(false); setActiveView('logs'); }} style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: 'var(--primary)', cursor: 'pointer', borderTop: '1px solid var(--border-color)', fontWeight: 500 }}>
                  See all audit logs
                </div>
              </div>
            )}
          </div>

          {/* Circle Profile / Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '16px', borderLeft: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.2' }}>{user.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, backgroundColor: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', marginTop: '2px' }}>
                {user.role}
              </span>
            </div>
            <div 
              onClick={logout}
              title="Log Out"
              style={{ 
                width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--border-color)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--error-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
            >
              <LogOut size={16} />
            </div>
          </div>

        </div>
      </header>

      {/* Main Viewport Panel */}
      <div className="content-viewport" style={{ flex: 1, padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto', overflowX: 'hidden' }}>
        {renderContentView()}
      </div>

    </div>
  );
};

export default App;