export function validateConfig(config: Record<string, unknown>) {
  if (typeof config.DATABASE_URL !== 'string' || !config.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  if (typeof config.JWT_SECRET !== 'string' || config.JWT_SECRET.length < 16) {
    throw new Error('JWT_SECRET must contain at least 16 characters');
  }
  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return { ...config, PORT: port };
}
