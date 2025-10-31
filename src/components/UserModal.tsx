import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import './UserModal.css';
import { useNotification } from './NotificationContext';
import { API_BASE } from './config';
import type { User } from '../types';

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (userId: string) => void;
  onUpdate?: (updatedUser: Record<string, unknown>) => void;
}

type EditableUser = Partial<User> & { image?: string | File | null };

function UserModal({ user, isOpen, onClose, onDelete, onUpdate }: UserModalProps): JSX.Element | null {
  const { showNotification } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState<EditableUser>(user ?? {});
  const [preview, setPreview] = useState<string | null>(user?.image ?? null);

  useEffect(() => {
    setEditUser(user ?? {});
    setPreview(user?.image ?? null);
    setIsEditing(false);
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = user._id;
    if (!id) {
      showNotification('Missing user identifier. Update aborted.', 'error');
      console.error('Missing user._id', user);
      return;
    }

    const formData = new FormData();
    const fields: Array<keyof EditableUser> = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'gender',
      'city',
      'department'
    ];

    fields.forEach((field) => {
      const value = editUser[field];
      if (value !== undefined && value !== null) {
        const text = String(value).trim();
        if (text) {
          formData.append(field, text);
        }
      }
    });

    if (editUser.image && editUser.image instanceof File) {
      formData.append('image', editUser.image);
    }

    const url = `${API_BASE}/api/users/${id}`;

    try {
      const token = sessionStorage.getItem('token');

      const res = await fetch(url, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      const text = await res.text();
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        parsed = null;
      }

      if (!res.ok) {
        const msg = (parsed && (parsed.detail as string | undefined)) || text || `HTTP ${res.status}`;
        showNotification(`Update failed: ${msg}`, 'error');
        throw new Error(`Update failed: ${msg}`);
      }

      const data = parsed ?? {};
      showNotification('User updated successfully!', 'success');
      onUpdate?.(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
      if (error instanceof TypeError) {
        showNotification('Network error. Please ensure the backend is running and CORS is configured.', 'error');
      }
    }
  };

  const handleFieldChange = (field: keyof EditableUser) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { value } = event.target;
    setEditUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setEditUser((prev) => ({ ...prev, image: file }));
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close" onClick={onClose} type="button">
          &times;
        </button>

        {!isEditing ? (
          <>
            <div className="modal-header">
              <h2>
                {user.firstName} {user.lastName}
              </h2>
              <p>{user.email}</p>
            </div>

            <div className="modal-avatar">
              <img
                src={user.image || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}
                alt={user.firstName}
              />
            </div>

            <div className="modal-info">
              <div className="info-row">
                <div className="info-label">Phone:</div>
                <div className="info-value">{user.phone || 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Gender:</div>
                <div className="info-value">{user.gender || 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">City:</div>
                <div className="info-value">{user.city || 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Department:</div>
                <div className="info-value">{user.department || 'N/A'}</div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="delete-btn"
                onClick={() => onDelete?.(user._id || user.id || '')}
                type="button"
              >
                Delete
              </button>
              <button className="edit-btn" onClick={() => setIsEditing(true)} type="button">
                Edit
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="form-title">Edit User</h2>
            <form className="edit-form" onSubmit={handleSubmit}>
              {['firstName', 'lastName', 'email', 'phone', 'city', 'department'].map((field) => (
                <div key={field} className="form-group">
                  <label className="form-label">
                    {field.charAt(0).toUpperCase() + field.slice(1)}:
                  </label>
                  <input
                    className="form-input"
                    type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                    value={(editUser[field as keyof EditableUser] as string) || ''}
                    onChange={handleFieldChange(field as keyof EditableUser)}
                  />
                </div>
              ))}

              <div className="form-group">
                <label className="form-label">Gender:</label>
                <select
                  className="form-select"
                  value={(editUser.gender as string) || ''}
                  onChange={handleFieldChange('gender')}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Image:</label>
                <input className="form-input" type="file" accept="image/*" onChange={handleImageChange} />
                {preview && <img src={preview} alt="Preview" className="form-image-preview" />}
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  Save
                </button>
                <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default UserModal;

