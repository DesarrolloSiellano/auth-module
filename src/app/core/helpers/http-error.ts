export interface HttpErrorInfo {
  status: number;
  message: string;
}

interface NormalizedError {
  status?: number;
  statusCode?: number;
  message?: unknown;
  error?: unknown;
}

export function getHttpErrorInfo(
  err: unknown,
  fallback = 'Ha ocurrido un error inesperado',
): HttpErrorInfo {
  const e = (err ?? {}) as NormalizedError;
  const nested = (e.error ?? {}) as NormalizedError;

  const status = e.status ?? nested.statusCode ?? e.statusCode ?? 0;
  const raw = nested.message ?? e.message ?? e.error ?? '';

  let message = '';
  if (Array.isArray(raw)) {
    message = raw
      .map((m: unknown) => (typeof m === 'string' ? m : JSON.stringify(m)))
      .filter(Boolean)
      .join('. ');
  } else if (typeof raw === 'string' && raw.trim()) {
    message = raw;
  } else if (raw && typeof raw === 'object') {
    message = JSON.stringify(raw);
  } else {
    message = fallback;
  }

  return { status, message: message || fallback };
}
