const db = require('../config/db');

// Get activity logs (Admin gets all, others get logs matching their user ID)
exports.getActivityLogs = async (req, res) => {
  try {
    let queryStr = 'SELECT l.*, u.name as user_name, u.role as user_role FROM activity_logs l LEFT JOIN users u ON l.user_id = u.id';
    let params = [];

    if (req.user.role !== 'Admin') {
      queryStr += ' WHERE l.user_id = ?';
      params = [req.user.id];
    }

    queryStr += ' ORDER BY l.created_at DESC LIMIT 100';

    const [logs] = await db.query(queryStr, params);
    res.json(logs);
  } catch (err) {
    console.error('Error fetching logs:', err.message);
    res.status(500).json({ message: 'Server error fetching activity logs' });
  }
};

// Get current user notifications
exports.getNotifications = async (req, res) => {
  try {
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

// Mark all notifications as read for current user
exports.markNotificationsRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = true WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking notifications read:', err.message);
    res.status(500).json({ message: 'Server error marking notifications read' });
  }
};
