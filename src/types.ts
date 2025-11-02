export type Gender = 'male' | 'female';

export interface User {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  city: string;
  department: string;
  image: string | null;
  status?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  [key: string]: unknown;
}

export interface NewUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender | '';
  city: string;
  department: string;
  image: File | null;
}

export interface RecentUser {
  id: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  image?: string | null;
}

export interface RateLimitInfo {
  retryAfter: number;
}

export type ConfirmDialogType = 'danger' | 'info' | 'warning' | 'success';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ConfirmDialogType;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ConfirmDialogRequest {
  title: string;
  message: string;
  type?: ConfirmDialogType;
  confirmLabel?: string;
}

export interface ImportErrorItem {
  row: number;
  email: string;
  reason: string;
}

export interface ImportPreview {
  total_rows: number;
  valid_users: number;
  invalid_users: number;
  errors: ImportErrorItem[];
}

export type AuthHeadersFn = () => Record<string, string>;

export type NotificationKind = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: number;
  message: string;
  type: NotificationKind;
  duration: number;
}
