import { useEffect, useState } from 'react';
import './RateLimitToast.css';

interface RateLimitToastProps {
  retryAfter: number;
  onClose: () => void;
}

function RateLimitToast({ retryAfter, onClose }: RateLimitToastProps): JSX.Element {
  const [timeLeft, setTimeLeft] = useState(retryAfter);

  useEffect(() => {
    if (timeLeft <= 0) {
      onClose();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeft, onClose]);

  return (
    <div className="rate-limit-toast">
      <div className="rate-limit-content">
        <div className="rate-limit-icon">RATE</div>
        <div className="rate-limit-text">
          <h4>Rate Limit Exceeded</h4>
          <p>Too many requests. Please wait...</p>
        </div>
        <div className="rate-limit-timer">
          <div className="countdown-circle">
            <svg className="countdown-svg" viewBox="0 0 36 36">
              <path
                className="countdown-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="countdown-progress"
                strokeDasharray={`${(timeLeft / retryAfter) * 100}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="countdown-number">{timeLeft}s</div>
          </div>
        </div>
        <button className="rate-limit-close" onClick={onClose} type="button">
          ×
        </button>
      </div>
    </div>
  );
}

export default RateLimitToast;

