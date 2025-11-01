import type { CSSProperties, ChangeEvent, MouseEvent } from 'react';
import type { User } from '../types';
import type { JSX } from 'react';

interface UserCardProps {
  user: User;
  onClick: (user: User) => void;
  isCreateFormOpen: boolean;
  isSelected: boolean;
  onSelect: (userId: string) => void;
  showCheckbox: boolean;
  style?: CSSProperties;
}

function UserCard({
  user,
  onClick,
  isCreateFormOpen,
  isSelected,
  onSelect,
  showCheckbox,
  style
}: UserCardProps): JSX.Element {
  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLInputElement).type === 'checkbox') return;
    onClick(user);
  };

  const handleCheckboxClick = (event: ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    onSelect(user._id);
  };

  return (
    <div
      className={`user-card ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
      style={{ opacity: isCreateFormOpen ? 0.5 : 1, ...style }}
    >
      {showCheckbox && (
        <input
          type="checkbox"
          className="user-checkbox"
          checked={isSelected}
          onChange={handleCheckboxClick}
          onClick={(event) => event.stopPropagation()}
        />
      )}

      <img
        src={user.image || 'https://via.placeholder.com/100'}
        alt={user.firstName}
        className="user-avatar"
      />
      <h3 className="user-name">
        {user.firstName} {user.lastName}
      </h3>
      <p className="user-email">{user.email}</p>
      <p className="user-phone">{user.phone}</p>
    </div>
  );
}

export default UserCard;



