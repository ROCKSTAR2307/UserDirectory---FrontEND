import './ConfirmDialog.css';
import type { ConfirmDialogType } from '../types';
import type { JSX } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: ConfirmDialogType;
  confirmLabel?: string;
  cancelLabel?: string;
}

const ICONS: Record<ConfirmDialogType, string> = {
  danger: '!',
  warning: 'WARN',
  info: 'INFO',
  success: 'OK'
};

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  type = 'danger',
  confirmLabel,
  cancelLabel = 'Cancel'
}: ConfirmDialogProps): JSX.Element | null => {
  if (!isOpen) return null;

  const actionLabel = confirmLabel || (type === 'danger' ? 'Delete' : 'Confirm');
  const handleCancel = onCancel ?? (() => undefined);
  const handleConfirm = onConfirm ?? (() => undefined);

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <div className={`confirm-header confirm-${type}`}>
          <div className="confirm-icon">{ICONS[type]}</div>
          <h3 className="confirm-title">{title}</h3>
        </div>

        <div className="confirm-body">
          <p className="confirm-message">{message}</p>
        </div>

        <div className="confirm-footer">
          <button className="confirm-btn confirm-cancel" onClick={handleCancel} type="button">
            {cancelLabel}
          </button>
          <button
            className={`confirm-btn confirm-action confirm-${type}`}
            onClick={handleConfirm}
            type="button"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;


