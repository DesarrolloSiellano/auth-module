import { getHttpErrorInfo } from './http-error';

describe('getHttpErrorInfo', () => {
  it('should extract status from err.status', () => {
    expect(getHttpErrorInfo({ status: 400, error: { message: 'x' } }).status).toBe(400);
  });

  it('should extract status from err.error.statusCode', () => {
    expect(
      getHttpErrorInfo({ error: { statusCode: 404, message: 'x' } }).status,
    ).toBe(404);
  });

  it('should join array messages with a dot separator', () => {
    const info = getHttpErrorInfo({
      status: 400,
      error: { message: ['name required', 'id empty'] },
    });
    expect(info.message).toBe('name required. id empty');
  });

  it('should stringify non-string array elements', () => {
    const info = getHttpErrorInfo({
      status: 400,
      error: { message: ['x', { field: 'name' }] },
    });
    expect(info.message).toBe('x. {"field":"name"}');
  });

  it('should fall back when the array message is empty', () => {
    const info = getHttpErrorInfo({
      status: 400,
      error: { message: ['', ''] },
    });
    expect(info.message).toBe('Ha ocurrido un error inesperado');
  });

  it('should use string messages directly', () => {
    const info = getHttpErrorInfo({ status: 400, error: { message: 'Invalid ID format' } });
    expect(info.message).toBe('Invalid ID format');
  });

  it('should serialize object messages', () => {
    const info = getHttpErrorInfo({ status: 500, error: { message: { a: 1 } } });
    expect(info.message).toBe('{"a":1}');
  });

  it('should fall back to a default message', () => {
    expect(getHttpErrorInfo({}).message).toBe('Ha ocurrido un error inesperado');
  });

  it('should respect a custom fallback', () => {
    expect(getHttpErrorInfo(null, 'custom').message).toBe('custom');
  });
});
