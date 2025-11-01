import './SkeletonCard.css';
import type { JSX } from 'react';

function SkeletonCard(): JSX.Element {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image" />
      <div className="skeleton-content">
        <div className="skeleton-title" />
        <div className="skeleton-text" />
        <div className="skeleton-text short" />
      </div>
    </div>
  );
}

export default SkeletonCard;

