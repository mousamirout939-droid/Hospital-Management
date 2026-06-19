import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBell } from '../common/Icons';
import { useNotifications } from '../../context/NotificationContext';
import { timeAgo } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) await markAsRead(notification._id);
    setOpen(false);

    const base = user?.role === 'admin' ? '/admin' : '/patient';
    const typeRouteMap = {
      'appointment-booked': `${base}/appointments`,
      'appointment-confirmed': `${base}/appointments`,
      'appointment-cancelled': `${base}/appointments`,
      'appointment-reminder': `${base}/appointments`,
      'prescription-issued': `${base}/prescriptions`,
      'lab-report-ready': `${base}/lab-reports`,
      'invoice-generated': `${base}/billing`,
      'payment-received': `${base}/billing`,
    };
    const path = typeRouteMap[notification.type];
    if (path) navigate(path);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="notif-bell" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <IconBell width={18} height={18} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div
            className="flex items-center justify-between"
            style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}
          >
            <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
            {unreadCount > 0 && (
              <button
                className="btn-ghost"
                style={{ fontSize: '0.78rem', padding: '4px 8px', border: 'none', cursor: 'pointer', background: 'none', color: 'var(--color-primary)' }}
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-ink-faint)', fontSize: '0.85rem' }}>
              You're all caught up.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="notif-item-title">{n.title}</div>
                <div className="notif-item-message">{n.message}</div>
                <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
