import { AuthUser } from '../models';

type JsonObject = Record<string, unknown>;

function asObject(v: unknown): JsonObject | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as JsonObject) : null;
}

/** Read JWT string from typical API login payloads. */
export function extractTokenFromLoginResponse(body: unknown): string | null {
  const root = asObject(body);
  if (!root) return null;
  const candidates = [root['token'], root['accessToken'], root['jwt'], root['access_token']];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  const data = asObject(root['data']);
  if (data) {
    const nested = [data['token'], data['accessToken'], data['jwt'], data['access_token']];
    for (const c of nested) {
      if (typeof c === 'string' && c.trim()) return c.trim();
    }
  }
  return null;
}

export function extractUserFromLoginResponse(body: unknown): (AuthUser & { _id?: string }) | null {
  const root = asObject(body);
  if (!root) return null;
  const u = root['user'] ?? asObject(root['data'])?.['user'];
  if (u && typeof u === 'object' && !Array.isArray(u)) {
    return u as AuthUser & { _id?: string };
  }
  return null;
}
