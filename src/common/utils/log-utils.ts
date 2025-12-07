/**
 * Utility functions for logging
 */

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'authorization',
  'auth',
  'accessToken',
  'refreshToken',
  'apiKey',
];

/**
 * Masks sensitive data from objects
 */
export function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  const masked: any = {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const lowerKey = key.toLowerCase();

      // Check if field is sensitive
      if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
        masked[key] = '***MASKED***';
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        // Recursively mask nested objects
        masked[key] = maskSensitiveData(data[key]);
      } else {
        masked[key] = data[key];
      }
    }
  }

  return masked;
}

/**
 * Formats log context with correlation ID and other metadata
 */
export function formatLogContext(context: string, correlationId?: string, additionalData?: Record<string, any>) {
  return {
    context,
    correlationId,
    timestamp: new Date().toISOString(),
    ...additionalData,
  };
}
