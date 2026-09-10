const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

export function getJwtSecret(): string {
  return requireEnv("JWT_SECRET");
}

export function getSessionMaxAgeSeconds(): number {
  const value = process.env.SESSION_MAX_AGE_SECONDS;

  if (!value) {
    return DEFAULT_SESSION_MAX_AGE_SECONDS;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error("SESSION_MAX_AGE_SECONDS must be a positive integer");
  }

  return parsed;
}
