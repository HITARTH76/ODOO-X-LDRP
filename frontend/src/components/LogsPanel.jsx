import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ClipboardList, ShieldAlert, CheckSquare } from 'lucide-react';

const LogsPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await api.get('/logs/activity');
        setLogs(data);
      } catch (err) {
        console.error('Failed to load logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading system audit logs...</div>;
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>ERP Security Audit Trails</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Browse chronological entries of all procurement actions, workflow updates, and system logins.</p>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action Category</th>
              <th>Triggered By</th>
              <th>ERP Role</th>
              <th>Description Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                  No activity log entries recorded in database.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-completed" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.user_name || 'System'}</td>
                  <td>
                    <span className="user-role-badge" style={{ fontSize: '11px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                      {log.user_role || 'Automation'}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                    {log.details}
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

export default LogsPanel;
