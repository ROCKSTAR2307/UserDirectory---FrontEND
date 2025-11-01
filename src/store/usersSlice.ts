import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RateLimitInfo, User } from '../types';

export type GenderFilter = 'all' | 'male' | 'female';
export type UserSortBy = 'firstName' | 'lastName' | 'department' | 'city';
export type SortOrder = 'asc' | 'desc';

interface UsersState {
  items: User[];
  departments: string[];
  searchQuery: string;
  genderFilter: GenderFilter;
  departmentFilter: string;
  selectedUsers: string[];
  bulkMode: boolean;
  currentPage: number;
  totalUsers: number;
  sortBy: UserSortBy;
  sortOrder: SortOrder;
  isLoading: boolean;
  rateLimitInfo: RateLimitInfo | null;
}

const initialState: UsersState = {
  items: [],
  departments: [],
  searchQuery: '',
  genderFilter: 'all',
  departmentFilter: 'all',
  selectedUsers: [],
  bulkMode: false,
  currentPage: 1,
  totalUsers: 0,
  sortBy: 'firstName',
  sortOrder: 'asc',
  isLoading: false,
  rateLimitInfo: null
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsers(state, action: PayloadAction<User[]>) {
      state.items = action.payload;
    },
    addUserToFront(state, action: PayloadAction<User>) {
      state.items = [action.payload, ...state.items];
    },
    updateUser(state, action: PayloadAction<User>) {
      const index = state.items.findIndex((user) => user._id === action.payload._id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeUser(state, action: PayloadAction<string>) {
      state.items = state.items.filter((user) => user._id !== action.payload);
    },
    clearUsers(state) {
      state.items = [];
      state.totalUsers = 0;
    },
    setDepartments(state, action: PayloadAction<string[]>) {
      state.departments = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setGenderFilter(state, action: PayloadAction<GenderFilter>) {
      state.genderFilter = action.payload;
    },
    setDepartmentFilter(state, action: PayloadAction<string>) {
      state.departmentFilter = action.payload;
    },
    resetFilters(state) {
      state.searchQuery = '';
      state.genderFilter = 'all';
      state.departmentFilter = 'all';
    },
    setSelectedUsers(state, action: PayloadAction<string[]>) {
      state.selectedUsers = action.payload;
    },
    toggleUserSelection(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.selectedUsers.includes(id)) {
        state.selectedUsers = state.selectedUsers.filter((userId) => userId !== id);
      } else {
        state.selectedUsers.push(id);
      }
    },
    clearSelectedUsers(state) {
      state.selectedUsers = [];
    },
    setBulkMode(state, action: PayloadAction<boolean>) {
      state.bulkMode = action.payload;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
    setTotalUsers(state, action: PayloadAction<number>) {
      state.totalUsers = action.payload;
    },
    setSortBy(state, action: PayloadAction<UserSortBy>) {
      state.sortBy = action.payload;
    },
    setSortOrder(state, action: PayloadAction<SortOrder>) {
      state.sortOrder = action.payload;
    },
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setRateLimitInfo(state, action: PayloadAction<RateLimitInfo | null>) {
      state.rateLimitInfo = action.payload;
    }
  }
});

export const {
  setUsers,
  addUserToFront,
  updateUser,
  removeUser,
  clearUsers,
  setDepartments,
  setSearchQuery,
  setGenderFilter,
  setDepartmentFilter,
  resetFilters,
  setSelectedUsers,
  toggleUserSelection,
  clearSelectedUsers,
  setBulkMode,
  setCurrentPage,
  setTotalUsers,
  setSortBy,
  setSortOrder,
  setIsLoading,
  setRateLimitInfo
} = usersSlice.actions;

export default usersSlice.reducer;
