import type { ChangeEvent, MutableRefObject } from 'react';
import type { JSX } from 'react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  genderFilter: 'all' | 'male' | 'female';
  setGenderFilter: (value: 'all' | 'male' | 'female') => void;
  departmentFilter: string;
  setDepartmentFilter: (value: string) => void;
  departments: string[];
  deptSelectRef: MutableRefObject<HTMLSelectElement | null>;
  sortBy: 'firstName' | 'lastName' | 'department' | 'city';
  setSortBy: (value: 'firstName' | 'lastName' | 'department' | 'city') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (value: 'asc' | 'desc') => void;
}

function Header({
  searchQuery,
  setSearchQuery,
  genderFilter,
  setGenderFilter,
  departmentFilter,
  setDepartmentFilter,
  departments,
  deptSelectRef,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder
}: HeaderProps): JSX.Element {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleGenderChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setGenderFilter(event.target.value as HeaderProps['genderFilter']);
  };

  const handleDepartmentChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setDepartmentFilter(event.target.value);
  };

  const handleSortByChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value as HeaderProps['sortBy']);
  };

  const handleSortOrderChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(event.target.value as HeaderProps['sortOrder']);
  };

  return (
    <header>
      <h1>User Directory</h1>
      <input
        type="text"
        placeholder="Search users by name or email..."
        value={searchQuery}
        onChange={handleSearchChange}
      />
      <div className="filters">
        <div className="gender-filter">
          <label htmlFor="filter-gender-select">Gender:</label>
          <select
            id="filter-gender-select"
            value={genderFilter}
            onChange={handleGenderChange}
          >
            <option value="all">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="dept-filter">
          <label htmlFor="filter-dept-select" className="dept-title">
            Department:
          </label>
          <select
            id="filter-dept-select"
            ref={deptSelectRef}
            value={departmentFilter}
            onChange={handleDepartmentChange}
          >
            <option value="all">All departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="dept-filter">
          <label htmlFor="sort-by" className="dept-title">
            Sort by:
          </label>
          <select id="sort-by" value={sortBy} onChange={handleSortByChange}>
            <option value="firstName">First Name</option>
            <option value="lastName">Last Name</option>
            <option value="department">Department</option>
            <option value="city">City</option>
          </select>
        </div>

        <div className="dept-filter">
          <label htmlFor="sort-order" className="dept-title">
            Order:
          </label>
          <select id="sort-order" value={sortOrder} onChange={handleSortOrderChange}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    </header>
  );
}

export default Header;

