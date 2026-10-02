export interface HttpErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface HttpErrorInfo {
  status: number;
  message: string;
  code?: string;
  errors: HttpErrorDetail[];
}

interface NormalizedError {
  status?: number;
  statusCode?: number;
  message?: unknown;
  error?: unknown;
  code?: unknown;
  errors?: unknown;
}

function stringifyMessage(raw: unknown, fallback: string): string {
  if (Array.isArray(raw)) {
    const joined = raw
      .map((m: unknown) => (typeof m === 'string' ? m : JSON.stringify(m)))
      .filter(Boolean)
      .join('. ');
    return joined || fallback;
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }
  if (raw && typeof raw === 'object') {
    return JSON.stringify(raw);
  }
  return fallback;
}

/** Normaliza `errors` (objeto completo o mensaje) a una lista de detalles. */
function normalizeErrors(node: any): HttpErrorDetail[] {
  const list = node?.errors;
  if (!Array.isArray(list)) return [];

  return list
    .map((item: any): HttpErrorDetail | null => {
      if (typeof item === 'string') {
        return { code: '', message: item };
      }
      if (!item || typeof item !== 'object') return null;
      const message = stringifyMessage(item.message, '');
      if (!message) return null;
      return {
        code: typeof item.code === 'string' ? item.code : '',
        message,
        ...(item.details && typeof item.details === 'object'
          ? { details: item.details as Record<string, unknown> }
          : {}),
      };
    })
    .filter((item: HttpErrorDetail | null): item is HttpErrorDetail => !!item);
}

export function getHttpErrorInfo(
  err: unknown,
  fallback = 'Ha ocurrido un error inesperado',
): HttpErrorInfo {
  const e = (err ?? {}) as NormalizedError;
  const nested = (e.error ?? {}) as NormalizedError;

  const status = e.status ?? nested.statusCode ?? e.statusCode ?? 0;
  const raw = nested.message ?? e.message ?? e.error ?? '';
  const message = stringifyMessage(raw, fallback);

  const rawCode = nested.code ?? e.code;
  const code = typeof rawCode === 'string' && rawCode ? rawCode : undefined;

  let errors = normalizeErrors(nested);
  if (errors.length === 0) {
    errors = normalizeErrors(e);
  }
  // Un `code`+`message` sin arreglo de errores se expone como un único detalle.
  if (errors.length === 0 && message) {
    errors = [{ code: code || '', message }];
  }

  return { status, message: message || fallback, code, errors };
}
