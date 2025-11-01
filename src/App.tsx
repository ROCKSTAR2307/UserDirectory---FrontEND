import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Header from './components/header';
import UserCard from './components/UserCard';
import UserModal from './components/UserModal';
import RecentlyViewed from './components/RecentlyViewed';
import Login from './auth/login';
import DeletedPanel from './components/DeletedPanel';
import RateLimitToast from './components/RateLimitToast';
import SkeletonCard from './components/SkeletonCard';
import ImportReviewModal from './components/ImportReviewModal';
import { useNotification } from './components/NotificationContext';
import NotificationContainer from './components/Notification';
import ConfirmDialog from './components/ConfirmDialog';
import { API_BASE } from './components/config';
import type { JSX } from 'react';
import type {
  AuthHeadersFn,
  ConfirmDialogRequest,
  ConfirmDialogState,
  NewUserForm,
  RecentUser,
  User,
  ImportPreview
} from './types';
import './App.css';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  addUserToFront,
  clearSelectedUsers,
  clearUsers,
  removeUser,
  resetFilters as resetFiltersAction,
  setBulkMode,
  setCurrentPage,
  setDepartmentFilter,
  setDepartments,
  setGenderFilter,
  setIsLoading,
  setRateLimitInfo,
  setSearchQuery,
  setSelectedUsers,
  setSortBy,
  setSortOrder,
  setTotalUsers,
  setUsers,
  toggleUserSelection as toggleUserSelectionAction,
  updateUser
} from './store/usersSlice';
import { formatApiErrorMessage, parseApiError } from './utils/api';

const USERS_PER_PAGE = 30;

const defaultNewUser: NewUserForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  city: '',
  department: '',
  image: null
};

const defaultConfirmDialog: ConfirmDialogState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'danger',
  onConfirm: () => undefined,
  onCancel: () => undefined
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

const authHeaders: AuthHeadersFn = () => {
  const token = sessionStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

interface UsersResponse {
  users: Array<Record<string, unknown>>;
  total?: number;
}

function normalizeUser(raw: Record<string, unknown>): User {
  const idValue = String(raw._id ?? raw.id ?? '');
  const rawImage = typeof raw.image === 'string' ? raw.image : null;
  const image =
    rawImage && rawImage.startsWith('http') ? rawImage : rawImage ? `${API_BASE}${rawImage}` : null;

  return {
    _id: idValue,
    id: idValue,
    firstName: String(raw.firstName ?? ''),
    lastName: String(raw.lastName ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    gender: raw.gender === 'female' ? 'female' : 'male',
    city: raw.city ? String(raw.city) : '',
    department: raw.department ? String(raw.department) : '',
    image,
    status: raw.status ? String(raw.status) : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
    deletedAt: raw.deletedAt ? String(raw.deletedAt) : undefined
  };
}

function App(): JSX.Element {
  const { showNotification } = useNotification();
  const deptSelectRef = useRef<HTMLSelectElement | null>(null);
  const dispatch = useAppDispatch();
  const {
    items: users,
    departments,
    searchQuery,
    genderFilter,
    departmentFilter,
    selectedUsers,
    bulkMode,
    currentPage,
    totalUsers,
    sortBy,
    sortOrder,
    isLoading,
    rateLimitInfo
  } = useAppSelector((state) => state.users);

  const [isLoggedIn] = useState<boolean>(() => sessionStorage.getItem('isLoggedIn') === 'true');

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

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>(defaultNewUser);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showDeletedPanel, setShowDeletedPanel] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [currentBackend] = useState<string>(() => localStorage.getItem('selectedBackend') || 'node');
  const fetchUsersRef = useRef<(() => Promise<void>) | null>(null);
  const textFieldKeys: Array<keyof Omit<NewUserForm, 'image' | 'gender'>> = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'city',
    'department'
  ];

  useEffect(() => {
    localStorage.setItem('selectedBackend', currentBackend);
  }, [currentBackend]);

  const handleFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      try {
        const response = await fetch(input, init);

        if (response.status === 429) {
          const data = (await response.json()) as { detail?: { retry_after?: number }; retry_after?: number };
          const retryAfter = data.detail?.retry_after ?? data.retry_after ?? 60;
          dispatch(setRateLimitInfo({ retryAfter }));
          throw new Error('Rate limit exceeded');
        }

        return response;
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    },
    [dispatch]
  );




  const fetchUsers = useCallback(async () => {
    if (!isLoggedIn) {
      dispatch(clearUsers());
      return;
    }
    try {
      dispatch(setIsLoading(true));

      const skip = (currentPage - 1) * USERS_PER_PAGE;
      const params = new URLSearchParams({
        skip: String(skip),
        limit: String(USERS_PER_PAGE),
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (genderFilter !== 'all') params.append('gender', genderFilter);
      if (departmentFilter !== 'all') params.append('department', departmentFilter);

      const response = await handleFetch(`${API_BASE}/api/users/?${params.toString()}`, {
        headers: {
          ...authHeaders()
        }
      });

      if (!response.ok) {
        const apiError = await parseApiError(response);
        throw new Error(formatApiErrorMessage('Failed to fetch users', apiError));
      }

      const data = (await response.json()) as UsersResponse;
      const normalizedUsers = (data.users ?? []).map(normalizeUser);

      dispatch(setUsers(normalizedUsers));
      dispatch(setTotalUsers(data.total ?? 0));
    } catch (error) {
      if (error instanceof Error && error.message === 'Rate limit exceeded') {
        return;
      }
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to fetch users: Unknown error';
      showNotification(message, 'error');
    } finally {
      dispatch(setIsLoading(false));
    }
  }, [
    currentPage,
    departmentFilter,
    genderFilter,
    handleFetch,
    isLoggedIn,
    searchQuery,
    showNotification,
    sortBy,
    sortOrder,
    dispatch
  ]);

  fetchUsersRef.current = fetchUsers;
  useEffect(() => {
    if (!rateLimitInfo?.retryAfter || !isLoggedIn) {
      return;
    }

    const refreshTimer = window.setTimeout(() => {
      dispatch(setRateLimitInfo(null));

      if (showCreateForm || isModalOpen || bulkMode) {
        return;
      }

      fetchUsersRef.current?.();
    }, rateLimitInfo.retryAfter * 1000);

    return () => window.clearTimeout(refreshTimer);
  }, [bulkMode, dispatch, isLoggedIn, isModalOpen, rateLimitInfo, showCreateForm]);

  const fetchDepartments = useCallback(async () => {
    if (!isLoggedIn) {
      dispatch(setDepartments([]));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/users/departments?cb=${Date.now()}`, {
        headers: {
          ...authHeaders()
        }
      });

      if (res.status === 401) {
        showNotification('Session expired. Please log in again.', 'error');
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('token');
        window.location.reload();
        return;
      }

      if (!res.ok) {
        const apiError = await parseApiError(res);
        throw new Error(formatApiErrorMessage('Failed to load departments', apiError));
      }

      const list = (await res.json()) as unknown;
      if (Array.isArray(list)) {
        dispatch(setDepartments(list.filter((item): item is string => typeof item === 'string')));
      }
    } catch (error) {
      console.error('fetchDepartments error:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to load departments: Unknown error';
      showNotification(message, 'error');
    }
  }, [dispatch, isLoggedIn, showNotification]);
  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(clearUsers());
      return;
    }
    fetchUsersRef.current?.();
  }, [currentPage, departmentFilter, dispatch, genderFilter, isLoggedIn, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    dispatch(setCurrentPage(1));
  }, [departmentFilter, dispatch, genderFilter, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [currentPage]);

  useEffect(() => {
    void fetchDepartments();
  }, [fetchDepartments]);

  const getRecentViewedKey = useCallback(() => `recentviewedusers_${currentBackend}_v1`, [currentBackend]);

  const loadRecentViewed = useCallback(() => {
    try {
      const key = getRecentViewedKey();
      const raw = localStorage.getItem(key);
      const items: RecentUser[] = raw ? JSON.parse(raw) : [];
      setRecentUsers(items);
    } catch {
      setRecentUsers([]);
    }
  }, [getRecentViewedKey]);

  useEffect(() => {
    loadRecentViewed();
  }, [loadRecentViewed]);

  useEffect(() => {
    if (!deptSelectRef.current) return;
    if (!departmentFilter || departmentFilter === 'all') return;

    const sel = deptSelectRef.current;
    const opt = sel.querySelector(`option[value="${departmentFilter}"]`);
    if (opt && typeof (opt as HTMLOptionElement).scrollIntoView === 'function') {
      (opt as HTMLOptionElement).scrollIntoView({ block: 'nearest' });
    }
  }, [departments, departmentFilter]);

  const trackRecentlyViewed = useCallback(
    (user: User | RecentUser | null) => {
      if (!user) return;
      const uid = user._id ?? user.id;
      if (!uid) return;

      const latest: RecentUser = {
        id: uid,
        _id: uid,
        firstName: 'firstName' in user ? user.firstName : undefined,
        lastName: 'lastName' in user ? user.lastName : undefined,
        email: 'email' in user ? user.email : undefined,
        image: user.image ?? null
      };

      const key = getRecentViewedKey();
      const stored = localStorage.getItem(key);
      let items: RecentUser[] = stored ? JSON.parse(stored) : [];
      items = items.filter((u) => u.id !== uid && u._id !== uid);
      items.unshift(latest);
      if (items.length > 10) items = items.slice(0, 10);
      setRecentUsers(items);
      localStorage.setItem(key, JSON.stringify(items));
    },
    [getRecentViewedKey]
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedUser(null);
  }, []);

  const deleteUser = useCallback(
    async (userId: string | User | null) => {
      if (!userId) {
        showNotification('Invalid user ID', 'error');
        return;
      }

      const id =
        typeof userId === 'string' ? userId : typeof userId === 'object' ? userId._id ?? userId.id : null;

      if (!id) {
        showNotification('Invalid user ID', 'error');
        return;
      }

      const confirmed = await requestConfirmation({
        title: 'Delete User',
        message: 'Delete this user? You can restore it later from Deleted Users.',
        type: 'danger',
        confirmLabel: 'Delete'
      });
      if (!confirmed) return;

      try {
        const res = await fetch(`${API_BASE}/api/users/${id}`, {
          method: 'DELETE',
          headers: {
            ...authHeaders()
          }
        });

        if (!res.ok) {
          const apiError = await parseApiError(res);
          throw new Error(formatApiErrorMessage('Failed to delete user', apiError));
        }

        dispatch(removeUser(id));

        setRecentUsers((prev) => {
          const key = getRecentViewedKey();
          const next = prev.filter((user) => user.id !== id && user._id !== id);
          localStorage.setItem(key, JSON.stringify(next));
          return next;
        });

        if (selectedUser && selectedUser._id === id) {
          closeModal();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Failed to delete user: Unknown error';
        showNotification(message, 'error');
      }
    },
    [authHeaders, closeModal, dispatch, getRecentViewedKey, requestConfirmation, selectedUser, showNotification]
  );

  const handleUserUpdated = useCallback(
    async (updatedUser: Record<string, unknown>) => {
      const id = updatedUser._id ?? updatedUser.id;
      if (!id) return;
      const normalized = normalizeUser(updatedUser);

      dispatch(updateUser(normalized));
      setRecentUsers((prev) => {
        const key = getRecentViewedKey();
        const next = prev.map((user) => (user.id === normalized._id ? { ...user, ...normalized } : user));
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });

      closeModal();
      await fetchDepartments();
    },
    [dispatch, fetchDepartments, getRecentViewedKey, closeModal]
  );

  const clearRecentViewed = useCallback(() => {
    const key = getRecentViewedKey();
    localStorage.removeItem(key);
    setRecentUsers([]);
  }, [getRecentViewedKey]);

  const handleRecentUserClick = useCallback(
    (user: RecentUser) => {
      trackRecentlyViewed(user);
      const fullUser = users.find((candidate) => candidate._id === user.id || candidate._id === user._id);
      if (fullUser) {
        setSelectedUser(fullUser);
        setIsModalOpen(true);
      }
    },
    [trackRecentlyViewed, users]
  );

  const handleUserClick = useCallback(
    (user: User) => {
      trackRecentlyViewed(user);
      setSelectedUser(user);
      setIsModalOpen(true);
    },
    [trackRecentlyViewed]
  );
  const handleCreateSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!emailRegex.test(newUser.email)) {
        showNotification('Please enter a valid email address.', 'warning');
        return;
      }
      if (!phoneRegex.test(newUser.phone)) {
        showNotification('Please enter a valid phone number.', 'warning');
        return;
      }
      if (!['male', 'female'].includes(newUser.gender)) {
        showNotification('Gender must be male or female.', 'warning');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('firstName', newUser.firstName || '');
        formData.append('lastName', newUser.lastName || '');
        formData.append('email', newUser.email || '');
        formData.append('phone', newUser.phone || '');
        formData.append('gender', newUser.gender || '');
        formData.append('city', newUser.city || '');
        formData.append('department', newUser.department || '');
        if (newUser.image) {
          formData.append('image', newUser.image);
        }

        const res = await fetch(`${API_BASE}/api/users/`, {
          method: 'POST',
          headers: {
            ...authHeaders()
          },
          body: formData
        });

        if (!res.ok) {
          const apiError = await parseApiError(res);
          throw new Error(formatApiErrorMessage('Failed to create user', apiError));
        }

        const created = (await res.json()) as Record<string, unknown>;
        const createdNormalized = normalizeUser(created);

        dispatch(addUserToFront(createdNormalized));
        setSubmitSuccess(true);
        setNewUser(defaultNewUser);

        if (
          createdNormalized.department &&
          !departments.includes(createdNormalized.department)
        ) {
          await fetchDepartments();
        }
      } catch (error) {
        console.error('Error creating user:', error);
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Failed to create user: Unknown error';
        showNotification(message, 'error');
      }
    },
    [departments, dispatch, fetchDepartments, newUser, showNotification]
  );

  const resetFilters = useCallback(() => {
    dispatch(resetFiltersAction());
  }, [dispatch]);

  const handleSearchQueryChange = useCallback(
    (value: string) => {
      dispatch(setSearchQuery(value));
    },
    [dispatch]
  );

  const handleGenderFilterChange = useCallback(
    (value: 'all' | 'male' | 'female') => {
      dispatch(setGenderFilter(value));
    },
    [dispatch]
  );

  const handleDepartmentFilterChange = useCallback(
    (value: string) => {
      dispatch(setDepartmentFilter(value));
    },
    [dispatch]
  );

  const handleSortByChange = useCallback(
    (value: 'firstName' | 'lastName' | 'department' | 'city') => {
      dispatch(setSortBy(value));
    },
    [dispatch]
  );

  const handleSortOrderChange = useCallback(
    (value: 'asc' | 'desc') => {
      dispatch(setSortOrder(value));
    },
    [dispatch]
  );

  useEffect(() => {
    let escPressCount = 0;
    let escTimeout: number | undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (isModalOpen) {
          closeModal();
        } else if (showCreateForm) {
          setShowCreateForm(false);
          setSubmitSuccess(false);
        } else {
          escPressCount += 1;

          if (escPressCount === 1) {
            escTimeout = window.setTimeout(() => {
              escPressCount = 0;
            }, 500);
          } else if (escPressCount === 2) {
            if (escTimeout) window.clearTimeout(escTimeout);
            escPressCount = 0;
            resetFilters();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeModal, isModalOpen, resetFilters, showCreateForm]);

  const handleBulkImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/api/users/import/preview`, {
          method: 'POST',
          headers: {
            ...authHeaders()
          },
          body: formData
        });

        if (response.ok) {
          const previewData = (await response.json()) as ImportPreview;
          setImportPreview(previewData);
          setPendingImportFile(file);
        } else {
          const apiError = await parseApiError(response);
          const message = formatApiErrorMessage('Failed to read file', apiError);
          showNotification(message, 'error');
        }
      } catch (error) {
        console.error('Import preview error:', error);
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Failed to read file. Please try again.';
        showNotification(message, 'error');
      }
    };

    input.click();
  }, [authHeaders, showNotification]);

  const handleConfirmImport = useCallback(async () => {
    if (!pendingImportFile) return;

    try {
      const formData = new FormData();
      formData.append('file', pendingImportFile);

      const response = await fetch(`${API_BASE}/api/users/import/confirm`, {
        method: 'POST',
        headers: {
          ...authHeaders()
        },
        body: formData
      });

      if (response.ok) {
        const result = (await response.json()) as { imported?: number };
        if (typeof result?.imported === 'number') {
          showNotification(`Successfully imported ${result.imported} users!`, 'success');
        } else {
          showNotification('Import completed but response format was unexpected.', 'warning');
        }
        setImportPreview(null);
        setPendingImportFile(null);
        await fetchUsers();
        await fetchDepartments();
      } else {
        const apiError = await parseApiError(response);
        throw new Error(formatApiErrorMessage('Import failed', apiError));
      }
    } catch (error) {
      console.error('Import error:', error);
      const message =
        error instanceof Error && error.message ? error.message : 'Import failed. Please try again.';
      showNotification(message, 'error');
    }
  }, [authHeaders, fetchDepartments, fetchUsers, pendingImportFile, showNotification]);

  const handleRejectImport = useCallback(() => {
    setImportPreview(null);
    setPendingImportFile(null);
    showNotification('Import cancelled. Please fix the CSV and try again.', 'warning');
  }, [showNotification]);

  const handleUserExport = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (genderFilter !== 'all') params.append('gender', genderFilter);
      if (departmentFilter !== 'all') params.append('department', departmentFilter);
      const skip = (currentPage - 1) * USERS_PER_PAGE;
      params.append('skip', String(skip));
      params.append('limit', String(USERS_PER_PAGE));
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const response = await fetch(`${API_BASE}/api/users/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          ...authHeaders()
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(anchor);
        showNotification('Users exported successfully!', 'success');
      } else {
        const apiError = await parseApiError(response);
        throw new Error(formatApiErrorMessage('Export failed', apiError));
      }
    } catch (error) {
      console.error('Export error:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Export failed: Please try again.';
      showNotification(message, 'error');
    }
  }, [authHeaders, currentPage, departmentFilter, genderFilter, searchQuery, showNotification, sortBy, sortOrder]);

  const bulkDeleteUsers = useCallback(async () => {
    if (selectedUsers.length === 0) {
      showNotification('No users selected', 'warning');
      return;
    }

    const confirmed = await requestConfirmation({
      title: 'Bulk Delete',
      message: `Delete ${selectedUsers.length} selected user(s)? This can be undone from Deleted Users.`,
      type: 'danger',
      confirmLabel: 'Delete'
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/users/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({ ids: selectedUsers })
      });

      if (!res.ok) {
        const apiError = await parseApiError(res);
        throw new Error(formatApiErrorMessage('Failed to bulk delete users', apiError));
      }

      showNotification(`${selectedUsers.length} user(s) deleted successfully!`, 'success');
      dispatch(clearSelectedUsers());
      dispatch(setBulkMode(false));
      await fetchUsers();
    } catch (error) {
      console.error('Bulk delete error:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to bulk delete users: Unknown error';
      showNotification(message, 'error');
    }
  }, [authHeaders, dispatch, fetchUsers, requestConfirmation, selectedUsers, showNotification]);

  const toggleUserSelection = useCallback(
    (userId: string) => {
      dispatch(toggleUserSelectionAction(userId));
    },
    [dispatch]
  );

  const selectAll = useCallback(() => {
    dispatch(setSelectedUsers(users.map((user) => user._id)));
  }, [dispatch, users]);

  const deselectAll = useCallback(() => {
    dispatch(clearSelectedUsers());
  }, [dispatch]);

  const sortedUsers = useMemo(() => users, [users]);

  if (!isLoggedIn) {
    return (
      <>
        <Login />
        <NotificationContainer />
      </>
    );
  }

  return (
    <>
      <div className="app">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
          </div>
        )}

        <Header
          searchQuery={searchQuery}
          setSearchQuery={handleSearchQueryChange}
          genderFilter={genderFilter}
          setGenderFilter={handleGenderFilterChange}
          departmentFilter={departmentFilter}
          setDepartmentFilter={handleDepartmentFilterChange}
          departments={departments}
          deptSelectRef={deptSelectRef}
          sortBy={sortBy}
          setSortBy={handleSortByChange}
          sortOrder={sortOrder}
          setSortOrder={handleSortOrderChange}
        />

        <div className="action-buttons-container">
          <button
            className="action-btn create-btn"
            onClick={() => {
              setShowCreateForm(true);
              setSubmitSuccess(false);
            }}
            disabled={showCreateForm}
            type="button"
          >
            Create New User
          </button>

          <button
            className={`action-btn bulk-select-btn ${bulkMode ? 'active' : ''}`}
            onClick={() => {
              dispatch(setBulkMode(!bulkMode));
              dispatch(clearSelectedUsers());
            }}
            type="button"
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
          </button>

          <button
            className="action-btn deleted-btn"
            onClick={() => setShowDeletedPanel(true)}
            type="button"
          >
            Deleted Users
          </button>

          <button className="action-btn import-btn" onClick={handleBulkImport} type="button">
            Bulk Import
          </button>

          <button className="action-btn export-btn" onClick={handleUserExport} type="button">
            User Export
          </button>

          <button
            className="action-btn logout-btn"
            onClick={() => {
              sessionStorage.removeItem('isLoggedIn');
              sessionStorage.removeItem('token');
              window.location.reload();
            }}
            type="button"
          >
            Logout
          </button>
        </div>

        {bulkMode && (
          <div className="bulk-action-bar">
            <span>{selectedUsers.length} selected</span>
            <div className="bulk-actions">
              <button className="bulk-btn" onClick={selectAll} type="button">
                Select All
              </button>
              <button className="bulk-btn" onClick={deselectAll} type="button">
                Clear Selection
              </button>
              <button
                className="bulk-btn danger"
                onClick={() => {
                  void bulkDeleteUsers();
                }}
                disabled={selectedUsers.length === 0}
                type="button"
              >
                Delete Selected
              </button>
              <button
                className="bulk-btn cancel"
                onClick={() => {
                  dispatch(setBulkMode(false));
                  dispatch(clearSelectedUsers());
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <main className="user-container">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={index} />)
          ) : sortedUsers.length === 0 ? (
            <div className="no-results">
              <h2>No Results Found</h2>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            sortedUsers.map((user, index) => (
              <UserCard
                key={user._id || user.email}
                user={user}
                onClick={handleUserClick}
                isCreateFormOpen={showCreateForm}
                isSelected={selectedUsers.includes(user._id)}
                onSelect={toggleUserSelection}
                showCheckbox={bulkMode}
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                }}
              />
            ))
          )}
        </main>

        {totalUsers > USERS_PER_PAGE && (
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => {
                dispatch(setCurrentPage(Math.max(1, currentPage - 1)));
              }}
              disabled={currentPage === 1}
              type="button"
            >
              Previous
            </button>

            <span className="pagination-info">
              Page {currentPage} of {Math.ceil(totalUsers / USERS_PER_PAGE)}
            </span>

            <button
              className="pagination-btn"
              onClick={() => {
                dispatch(setCurrentPage(currentPage + 1));
              }}
              disabled={currentPage >= Math.ceil(totalUsers / USERS_PER_PAGE)}
              type="button"
            >
              Next
            </button>
          </div>
        )}

        {rateLimitInfo && (
          <RateLimitToast
            retryAfter={rateLimitInfo.retryAfter}
            onClose={() => dispatch(setRateLimitInfo(null))}
          />
        )}

        <ImportReviewModal
          importData={importPreview}
          onConfirm={handleConfirmImport}
          onReject={handleRejectImport}
          onClose={() => {
            setImportPreview(null);
            setPendingImportFile(null);
          }}
        />

        <DeletedPanel
          isOpen={showDeletedPanel}
          onClose={() => setShowDeletedPanel(false)}
          authHeaders={authHeaders}
          onRestoreComplete={() => {
            fetchUsersRef.current?.();
            void fetchDepartments();
          }}
        />

        <RecentlyViewed
          recentUsers={recentUsers}
          onUserClick={handleRecentUserClick}
          onClear={clearRecentViewed}
          isCreateFormOpen={showCreateForm}
        />

        <UserModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={closeModal}
          onDelete={deleteUser}
          onUpdate={handleUserUpdated}
        />

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={
            confirmDialog.onCancel ||
            (() => setConfirmDialog((prev) => ({ ...prev, isOpen: false })))
          }
          type={confirmDialog.type}
          confirmLabel={confirmDialog.confirmLabel}
        />
      </div>
      <NotificationContainer />

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span
              className="modal-close"
              onClick={() => {
                setShowCreateForm(false);
                setSubmitSuccess(false);
              }}
            >
              &times;
            </span>

            {submitSuccess ? (
              <div className="success-container">
                <div className="success-icon">
                  <span>*</span>
                </div>
                <h2>User Created Successfully!</h2>
                <p>The new user has been added to the directory.</p>
                <button
                  className="success-close-btn"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSubmitSuccess(false);
                  }}
                  type="button"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 className="form-title">Create New User</h2>
                <form onSubmit={handleCreateSubmit}>
                  {textFieldKeys.map((field) => (
                    <div key={field} className="form-group">
                      <label className="form-label">
                        {field.charAt(0).toUpperCase() + field.slice(1)}:
                      </label>
                      <input
                        className="form-input"
                        type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                        value={newUser[field] ?? ''}
                        onChange={(event) =>
                          setNewUser((prev) => ({
                            ...prev,
                            [field]: event.target.value
                          }))
                        }
                        required={field === 'firstName' || field === 'email'}
                      />
                    </div>
                  ))}

                  <div className="form-group">
                    <label className="form-label">Gender:</label>
                    <select
                      className="form-select"
                      value={newUser.gender}
                      onChange={(event) =>
                        setNewUser((prev) => ({
                          ...prev,
                          gender: event.target.value as NewUserForm['gender']
                        }))
                      }
                      required
                    >
                      <option value="" disabled hidden>
                        Choose an option
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Image:</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setNewUser((prev) => ({
                          ...prev,
                          image: file
                        }));
                      }}
                    />
                    {newUser.image && (
                      <img
                        src={URL.createObjectURL(newUser.image)}
                        alt="preview"
                        className="form-image-preview"
                      />
                    )}
                  </div>

                  <button type="submit" className="form-submit-btn">
                    Create User
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;







