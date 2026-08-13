export interface HttpErrorInfo {
  status: number;
  message: string;
}

export function getHttpErrorInfo(
  err: any,
  fallback = 'Ha ocurrido un error inesperado',
): HttpErrorInfo {
  const status =
    err?.status ?? err?.error?.statusCode ?? err?.statusCode ?? 0;

  const raw = err?.error?.message ?? err?.message ?? err?.error ?? '';

  let message = '';
  if (Array.isArray(raw)) {
    message = raw
      .map((m: any) => (typeof m === 'string' ? m : JSON.stringify(m)))
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
