export const jwtConfig = {
  secret: (process.env['JWT_SECRET'] || 'fallback-secret-key') as string,
  refreshSecret: (process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret-key') as string,
  expiresIn: (process.env['JWT_EXPIRES_IN'] || '15m') as string,
  refreshExpiresIn: (process.env['JWT_REFRESH_EXPIRES_IN'] || '7d') as string,
} as const;
