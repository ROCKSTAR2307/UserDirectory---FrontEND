import React, { useState } from 'react';
import type { ImportPreview } from '../types';
import './ImportReviewModal.css';
import type { JSX } from 'react';

interface ImportReviewModalProps {
  importData: ImportPreview | null;
  onConfirm: () => void;
  onReject: () => void;
  onClose: () => void;
}

function ImportReviewModal({
  importData,
  onConfirm,
  onReject,
  onClose
}: ImportReviewModalProps): JSX.Element | null {
  const [expandedErrors, setExpandedErrors] = useState(false);

  if (!importData) return null;

  const { total_rows, valid_users, invalid_users } = importData;  const errors = importData.errors ?? [];
  const hasErrors = invalid_users > 0;

  return (
    <div className="modal-overlay">
      <div className="import-review-modal">
        <div className="import-review-header">
          <h2>Import Preview</h2>
          <button className="modal-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="import-review-body">
          <div className="import-stats">
            <div className="stat-card total">
              <div className="stat-icon">CSV</div>
              <div className="stat-info">
                <div className="stat-value">{total_rows}</div>
                <div className="stat-label">Total Rows</div>
              </div>
            </div>

            <div className="stat-card valid">
              <div className="stat-icon">OK</div>
              <div className="stat-info">
                <div className="stat-value">{valid_users}</div>
                <div className="stat-label">Valid Users</div>
              </div>
            </div>

            {hasErrors && (
              <div className="stat-card invalid">
                <div className="stat-icon">ERR</div>
                <div className="stat-info">
                  <div className="stat-value">{invalid_users}</div>
                  <div className="stat-label">Invalid Users</div>
                </div>
              </div>
            )}
          </div>

          {hasErrors && (
            <div className="error-section">
              <div
                className="error-header"
                onClick={() => setExpandedErrors(!expandedErrors)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    setExpandedErrors((prev) => !prev);
                  }
                }}
              >
                <span>Issues Found ({errors.length})</span>
                <span className="toggle-icon">{expandedErrors ? '-' : '+'}</span>
              </div>

              {expandedErrors && (
                <div className="error-list">
                  {errors.slice(0, 10).map((err, idx) => (
                    <div key={`${err.row}-${idx}`} className="error-item">
                      <div className="error-row">Row {err.row}</div>
                      <div className="error-email">{err.email}</div>
                      <div className="error-reason">{err.reason}</div>
                    </div>
                  ))}
                  {errors.length > 10 && (
                    <div className="error-more">... and {errors.length - 10} more errors</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={`decision-message ${hasErrors ? 'warning' : 'success'}`}>
            {hasErrors ? (
              <>
                <p><strong>Some rows have validation errors.</strong></p>
                <p>You can either:</p>
                <ul>
                  <li>
                    <strong>Import valid users only</strong> - Skip problematic rows
                  </li>
                  <li>
                    <strong>Reject file</strong> - Fix errors in CSV and re-upload
                  </li>
                </ul>
              </>
            ) : (
              <p>All users are valid and ready to import.</p>
            )}
          </div>
        </div>

        <div className="import-review-footer">
          <button className="btn-reject" onClick={onReject} type="button">
            Reject File
          </button>

          <button
            className="btn-confirm"
            onClick={onConfirm}
            disabled={valid_users === 0}
            type="button"
          >
            Import {valid_users} Valid User{valid_users !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportReviewModal;


