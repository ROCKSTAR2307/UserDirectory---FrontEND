import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import './UserModal.css';
import { useNotification } from './NotificationContext';
import { API_BASE } from './config';
import type { User } from '../types';
import type { JSX } from 'react';
import { formatApiErrorMessage, parseApiError } from '../utils/api';

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (userId: string) => void;
  onUpdate?: (updatedUser: Record<string, unknown>) => void;
}

type EditableUser = Partial<Omit<User, 'image'>> & { image?: string | File | null };
type EditableUserKey = Extract<keyof EditableUser, string>;
const editableFieldKeys: EditableUserKey[] = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'gender',
  'city',
  'department'
];

const nonNumericFields = new Set<EditableUserKey>(['firstName', 'lastName', 'city', 'department']);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

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

    const sanitizedValues: Partial<Record<EditableUserKey, string>> = {};

    for (const field of editableFieldKeys) {
      const rawValue = editUser[field];
      if (rawValue === undefined || rawValue === null) {
        showNotification(`${field} cannot be empty.`, 'warning');
        return;
      }

      const value = String(rawValue).trim();
      if (!value) {
        showNotification(`${field} cannot be blank or whitespace.`, 'warning');
        return;
      }

      if (field === 'email') {
        if (!emailRegex.test(value)) {
          showNotification('Please enter a valid email address.', 'warning');
          return;
        }
      } else if (field === 'phone') {
        if (!phoneRegex.test(value)) {
          showNotification('Please enter a valid phone number.', 'warning');
          return;
        }
      } else {
        if (/\d/.test(value)) {
          showNotification(`${field} cannot contain numbers.`, 'warning');
          return;
        }
      }

      if (field === 'gender' && value !== 'male' && value !== 'female') {
        showNotification('Please select a valid gender.', 'warning');
        return;
      }

      sanitizedValues[field] = value;
    }

    const formData = new FormData();
    setEditUser((prev) => ({ ...prev, ...sanitizedValues }));
    editableFieldKeys.forEach((field) => {
      const value = sanitizedValues[field];
      if (value) {
        formData.append(field, value);
      }
    });

    if (editUser.image && typeof editUser.image !== 'string') {
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

      if (!res.ok) {
        const apiError = await parseApiError(res);
        throw new Error(formatApiErrorMessage('Failed to update user', apiError));
      }

      let data: Record<string, unknown> = {};
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        data = {};
      }
      showNotification('User updated successfully!', 'success');
      onUpdate?.(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
      if (error instanceof TypeError) {
        showNotification(
          'Network error. Please ensure the backend is running and CORS is configured.',
          'error'
        );
      } else {
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Failed to update user: Unknown error';
        showNotification(message, 'error');
      }
    }
  };

  const handleFieldChange =
    (field: EditableUserKey) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = event.target;
      const sanitized = nonNumericFields.has(field) ? value.replace(/\d+/g, '') : value;
      setEditUser((prev) => ({ ...prev, [field]: sanitized }));
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
              {editableFieldKeys
                .filter((field) => field !== 'gender')
                .map((field) => (
                <div key={field} className="form-group">
                  <label className="form-label">
                    {field.charAt(0).toUpperCase() + field.slice(1)}:
                  </label>
                  <input
                    className="form-input"
                    type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                    value={(editUser[field] as string) || ''}
                    onChange={handleFieldChange(field)}
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
