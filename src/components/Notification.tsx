import { useNotification } from './NotificationContext';
import type { NotificationItem as NotificationEntry, NotificationKind } from '../types';
import './Notification.css';
import type { JSX } from 'react';

interface NotificationItemProps {
  notification: NotificationEntry;
}

const ICONS: Record<NotificationKind, string> = {
  success: 'OK',
  error: 'ERR',
  warning: 'WARN',
  info: 'INFO'
};

const NotificationItem = ({ notification }: NotificationItemProps): JSX.Element => {
  const { removeNotification } = useNotification();
  const { id, message, type } = notification;

  return (
    <div className={`notification-item notification-${type}`}>
      <div className="notification-icon">{ICONS[type]}</div>
      <div className="notification-message">{message}</div>
      <button
        className="notification-close"
        onClick={() => removeNotification(id)}
        aria-label="Close notification"
        type="button"
      >
        ×
      </button>
    </div>
  );
};

const NotificationContainer = (): JSX.Element | null => {
  const { notifications } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

export default NotificationContainer;

