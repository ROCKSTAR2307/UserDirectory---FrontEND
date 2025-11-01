import { useCallback, useEffect, useState } from 'react';
import './DeletedPanel.css';
import { useNotification } from './NotificationContext';
import ConfirmDialog from './ConfirmDialog';
import { API_BASE } from './config';
import type { JSX } from 'react';
import type { AuthHeadersFn, ConfirmDialogRequest, ConfirmDialogState, User } from '../types';
import { formatApiErrorMessage, parseApiError } from '../utils/api';

interface DeletedPanelProps {
  isOpen: boolean;
  onClose: () => void;
  authHeaders: AuthHeadersFn;
  onRestoreComplete?: () => void;
}

const defaultConfirmDialog: ConfirmDialogState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'danger',
  onConfirm: () => undefined,
  onCancel: () => undefined
};

function DeletedPanel({ isOpen, onClose, authHeaders, onRestoreComplete }: DeletedPanelProps): JSX.Element | null {
  const { showNotification } = useNotification();
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeleted, setSelectedDeleted] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(defaultConfirmDialog);

  const requestConfirmation = useCallback(
    ({ title, message, type = 'danger', confirmLabel }: ConfirmDialogRequest): Promise<boolean> =>
      new Promise((resolve) => {
        setConfirmDialog({
          isOpen: true,
          title,
          message,
          type,
          confirmLabel,
          onConfirm: () => {
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            resolve(true);
          },
          onCancel: () => {
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            resolve(false);
          }
        });
      }),
    []
  );

  const fetchDeletedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/deleted?limit=100`, {
        headers: authHeaders()
      });
      if (!res.ok) {
        const apiError = await parseApiError(res);
        throw new Error(formatApiErrorMessage('Failed to fetch deleted users', apiError));
      }

      const data = (await res.json()) as { users?: User[] };
      setDeletedUsers(data.users ?? []);
    } catch (error) {
      console.error('fetchDeletedUsers error:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to fetch deleted users: Unknown error';
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, showNotification]);

  useEffect(() => {
    if (isOpen) {
      void fetchDeletedUsers();
    }
  }, [fetchDeletedUsers, isOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const toggleSelection = useCallback((userId: string) => {
    setSelectedDeleted((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  const selectAllDeleted = useCallback(() => {
    setSelectedDeleted(deletedUsers.map((user) => user._id));
  }, [deletedUsers]);

  const deselectAllDeleted = useCallback(() => {
    setSelectedDeleted([]);
  }, []);

  const bulkRestore = useCallback(async () => {
    if (selectedDeleted.length === 0) {
      showNotification('No users selected', 'warning');
      return;
    }

    const confirmed = await requestConfirmation({
      title: 'Restore Selected Users',
      message: `Restore ${selectedDeleted.length} user(s)? They will return to the active directory.`,
      type: 'info',
      confirmLabel: 'Restore'
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/users/bulk-restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({ ids: selectedDeleted })
      });

      if (!res.ok) {
        const apiError = await parseApiError(res);
        throw new Error(formatApiErrorMessage('Failed to restore users', apiError));
      }

      showNotification(`${selectedDeleted.length} user(s) restored!`, 'success');
      setSelectedDeleted([]);
      setBulkMode(false);
      await fetchDeletedUsers();
      onRestoreComplete?.();
    } catch (error) {
      console.error('Bulk restore error:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to restore users: Unknown error';
      showNotification(message, 'error');
    }
  }, [authHeaders, fetchDeletedUsers, onRestoreComplete, requestConfirmation, selectedDeleted, showNotification]);

  const bulkPermanentDelete = useCallback(async () => {
    if (selectedDeleted.length === 0) {
      showNotification('No users selected', 'warning');
      return;
    }

    const confirmed = await requestConfirmation({
      title: 'Delete Permanently',
      message: `Delete ${selectedDeleted.length} user(s) permanently? This cannot be undone.`,
      type: 'danger',
      confirmLabel: 'Delete'
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/users/bulk-delete-permanent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({ ids: selectedDeleted })
      });

      if (!res.ok) {
        const apiError = await parseApiError(res);
        throw new Error(formatApiErrorMessage('Failed to delete users permanently', apiError));
      }

      showNotification(`${selectedDeleted.length} user(s) deleted permanently.`, 'success');
      setSelectedDeleted([]);
      setBulkMode(false);
      await fetchDeletedUsers();
      onRestoreComplete?.();
    } catch (error) {
      console.error('Bulk permanent delete error:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to delete users permanently: Unknown error';
      showNotification(message, 'error');
    }
  }, [authHeaders, fetchDeletedUsers, onRestoreComplete, requestConfirmation, selectedDeleted, showNotification]);

  const handleRestore = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/restore`, {
        method: 'POST',
        headers: authHeaders()
      });
      if (!res.ok) {
        const apiError = await parseApiError(res);
        throw new Error(formatApiErrorMessage('Failed to restore user', apiError));
      }

      showNotification('User restored successfully', 'success');
      await fetchDeletedUsers();
      onRestoreComplete?.();
    } catch (error) {
      console.error('Restore error:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to restore user: Unknown error';
      showNotification(message, 'error');
    }
  }, [authHeaders, fetchDeletedUsers, onRestoreComplete, showNotification]);

  const handlePermanentDelete = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/permanent`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) {
        const apiError = await parseApiError(res);
        throw new Error(formatApiErrorMessage('Failed to delete user permanently', apiError));
      }

      showNotification('User permanently deleted', 'success');
      await fetchDeletedUsers();
      onRestoreComplete?.();
    } catch (error) {
      console.error('Permanent delete error:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to delete user permanently: Unknown error';
      showNotification(message, 'error');
    }
  }, [authHeaders, fetchDeletedUsers, onRestoreComplete, showNotification]);

  if (!isOpen) return null;

  return (
    <>
      <div className="deleted-panel-overlay" onClick={onClose}>
        <div className="deleted-panel-content" onClick={(event) => event.stopPropagation()}>
          <button className="deleted-panel-close" onClick={onClose} type="button">
            ×
          </button>

          <h2 className="deleted-panel-title">Deleted Users</h2>

          <div className="deleted-panel-actions">
            <button
              className={`bulk-mode-toggle ${bulkMode ? 'active' : ''}`}
              onClick={() => {
                setBulkMode((prev) => !prev);
                setSelectedDeleted([]);
              }}
              type="button"
            >
              {bulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
            </button>
          </div>

          {bulkMode && (
            <div className="bulk-action-bar-deleted">
              <button onClick={selectAllDeleted} type="button">
                Select All
              </button>
              <button onClick={deselectAllDeleted} type="button">
                Deselect All
              </button>
              <button
                onClick={() => {
                  void bulkRestore();
                }}
                disabled={selectedDeleted.length === 0}
                className="restore-btn"
                type="button"
              >
                Restore Selected ({selectedDeleted.length})
              </button>
              <button
                onClick={() => {
                  void bulkPermanentDelete();
                }}
                disabled={selectedDeleted.length === 0}
                className="permanent-delete-btn"
                type="button"
              >
                Delete Permanently ({selectedDeleted.length})
              </button>
            </div>
          )}

          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : deletedUsers.length === 0 ? (
            <p className="empty-message">No deleted users</p>
          ) : (
            <div className="deleted-users-list">
              {deletedUsers.map((user) => (
                <div
                  key={user._id}
                  className={`deleted-user-item ${selectedDeleted.includes(user._id) ? 'selected' : ''}`}
                >
                  {bulkMode && (
                    <input
                      type="checkbox"
                      checked={selectedDeleted.includes(user._id)}
                      onChange={() => toggleSelection(user._id)}
                      className="deleted-user-checkbox"
                    />
                  )}

                  <img
                    src={user.image || 'https://via.placeholder.com/50'}
                    alt={user.firstName}
                    className="deleted-user-avatar"
                  />

                  <div className="deleted-user-info">
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>
                    <p>{user.email}</p>
                    <p>{user.department || 'N/A'}</p>
                  </div>

                  {!bulkMode && (
                    <div className="deleted-user-actions">
                      <button onClick={() => handleRestore(user._id)} type="button">
                        Restore
                      </button>
                      <button onClick={() => handlePermanentDelete(user._id)} type="button">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="deleted-panel-footer">Total deleted: {deletedUsers.length}</div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
      />
    </>
  );
}

export default DeletedPanel;

