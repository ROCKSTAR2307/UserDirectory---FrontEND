import type { RecentUser } from '../types';

interface RecentlyViewedProps {
  recentUsers: RecentUser[];
  onUserClick: (user: RecentUser) => void;
  onClear: () => void;
  isCreateFormOpen: boolean;
}

function RecentlyViewed({
  recentUsers,
  onUserClick,
  onClear,
  isCreateFormOpen
}: RecentlyViewedProps): JSX.Element {
  const handleCardClick = (user: RecentUser) => {
    if (isCreateFormOpen) return;
    onUserClick(user);
  };

  return (
    <section className="recent-viewed">
      <div className="recent-header">
        <h3>Recently Viewed</h3>
        <button
          className="clear-btn"
          onClick={onClear}
          disabled={isCreateFormOpen}
          style={{
            opacity: isCreateFormOpen ? 0.5 : 1,
            cursor: isCreateFormOpen ? 'not-allowed' : 'pointer'
          }}
          type="button"
        >
          Clear
        </button>
      </div>

      <div className="recent-viewed-list">
        {(!recentUsers || recentUsers.length === 0) ? (
          <p className="no-recent">No recently viewed users.</p>
        ) : (
          recentUsers.map((user) => (
            <div
              key={user.id || user._id}
              className="recent-card"
              onClick={() => handleCardClick(user)}
              style={{
                cursor: isCreateFormOpen ? 'not-allowed' : 'pointer',
                opacity: isCreateFormOpen ? 0.7 : 1
              }}
            >
              <img
                src={user.image || '/default-avatar.png'}
                alt={
                  `${user.firstName ?? ''}${user.lastName ? ` ${user.lastName}` : ''}`.trim() || 'User avatar'
                }
                onError={(event) => {
                  event.currentTarget.src = '/default-avatar.png';
                }}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #ff8c00',
                  marginRight: '10px'
                }}
              />
              <div className="meta">
                <div className="name">
                  {`${user.firstName ?? ''}${user.lastName ? ` ${user.lastName}` : ''}`.trim()}
                </div>
                <div className="sub" style={{ fontSize: '0.85rem', color: '#555' }}>
                  {user.email ?? ''}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default RecentlyViewed;

