import React from 'react';
import { Users, Building, BarChart3, ChevronRight } from 'lucide-react';

const AdminDashboard = ({ setActiveView }) => {
  return (
    <div style={{ color: 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '40px', marginTop: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '400', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Admin</h1>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: '0' }}>Platform administration and system overview</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Manage Users */}
        <div 
          onClick={() => alert('Manage users functionality coming soon!')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.2s' }}
          className="admin-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', color: 'var(--primary)' }}>
              <Users size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '500' }}>Manage users</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Add, edit, or remove system users and roles.</p>
            </div>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
        </div>

        {/* Manage Vendors */}
        <div 
          onClick={() => setActiveView('vendors')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.2s' }}
          className="admin-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', color: 'var(--primary)' }}>
              <Building size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '500' }}>Manage vendors</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Approve pending vendors and manage supplier profiles.</p>
            </div>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
        </div>

        {/* View Analytics */}
        <div 
          onClick={() => setActiveView('reports')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.2s' }}
          className="admin-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', color: 'var(--primary)' }}>
              <BarChart3 size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '500' }}>View procurement analytics</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Review platform-wide spending, trends, and reports.</p>
            </div>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
