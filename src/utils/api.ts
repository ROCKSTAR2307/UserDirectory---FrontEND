export interface ApiErrorItem {
  field?: string;
  message?: string;
  [key: string]: unknown;
}

export interface ApiErrorBody {
  success?: boolean;
  message?: string;
  errors?: ApiErrorItem[];
  detail?: string;
  [key: string]: unknown;
}

export interface ParsedApiError {
  message: string;
  details: string[];
}

export async function parseApiError(response: Response): Promise<ParsedApiError> {
  const fallbackMessage = `HTTP ${response.status}`;
  let raw = '';
  try {
    raw = await response.clone().text();
  } catch {
    raw = '';
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (raw && contentType.includes('application/json')) {
    try {
      const data = JSON.parse(raw) as ApiErrorBody;
      const message =
        typeof data.message === 'string' && data.message.trim().length > 0
          ? data.message.trim()
          : fallbackMessage;

      const details: string[] = Array.isArray(data.errors)
        ? data.errors
            .map((error) => {
              if (!error || typeof error !== 'object') return '';
              const field =
                'field' in error && typeof error.field === 'string' && error.field.trim()
                  ? error.field.trim()
                  : undefined;
              const value =
                'message' in error && typeof error.message === 'string' && error.message.trim()
                  ? error.message.trim()
                  : undefined;
              if (field && value) return `${field}: ${value}`;
              return value ?? field ?? '';
            })
            .filter((entry): entry is string => Boolean(entry && entry.trim()))
        : [];

      if (details.length === 0 && typeof data.detail === 'string' && data.detail.trim()) {
        details.push(data.detail.trim());
      }

      return {
        message,
        details
      };
    } catch {
      // fall through to raw text fallback
    }
  }

  const trimmed = raw.trim();
  return {
    message: trimmed || fallbackMessage,
    details: []
  };
}

export function formatApiErrorMessage(prefix: string, parsed: ParsedApiError): string {
  const detailsText = parsed.details.length > 0 ? ` (${parsed.details.join('; ')})` : '';
  return prefix ? `${prefix}: ${parsed.message}${detailsText}` : `${parsed.message}${detailsText}`;
}
