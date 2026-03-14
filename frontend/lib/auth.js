const ROLE_ROUTES = Object.freeze({
  advisor: "/dashboard/advisor",
  user: "/dashboard/user",
});

const VALID_ROLES = new Set(Object.keys(ROLE_ROUTES));
const ROLE_COOKIE_KEYS = ["role", "user_role", "userRole"];
const SESSION_COOKIE_KEYS = ["session", "auth_session", "user_session", "token", "access_token", "id_token"];

function readCookieValue(cookieStore, key) {
  if (!cookieStore?.get) {
    return null;
  }

  const entry = cookieStore.get(key);

  if (!entry) {
    return null;
  }

  if (typeof entry === "string") {
    return entry;
  }

  return entry.value ?? null;
}

function decodeBase64Url(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);

  try {
    if (typeof atob === "function") {
      return atob(normalized + padding);
    }

    if (typeof Buffer !== "undefined") {
      return Buffer.from(normalized + padding, "base64").toString("utf-8");
    }
  } catch (error) {
    return "";
  }

  return "";
}

function decodeJwtPayload(token) {
  if (typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  const decoded = decodeBase64Url(parts[1]);

  if (!decoded) {
    return null;
  }

  try {
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

export function normalizeRole(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (VALID_ROLES.has(normalized)) {
    return normalized;
  }

  if (normalized === "admin" || normalized === "analyst") {
    return "advisor";
  }

  return null;
}

function extractRoleFromObject(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const probes = [
    candidate.role,
    candidate.userRole,
    candidate.user_role,
    candidate.user?.role,
    candidate.account?.role,
    candidate.profile?.role,
    candidate.app_metadata?.role,
    candidate.user_metadata?.role,
  ];

  for (const probe of probes) {
    const role = normalizeRole(probe);

    if (role) {
      return role;
    }
  }

  return null;
}

function extractRoleFromValue(rawValue) {
  if (!rawValue || typeof rawValue !== "string") {
    return null;
  }

  const directRole = normalizeRole(rawValue);

  if (directRole) {
    return directRole;
  }

  try {
    const parsed = JSON.parse(rawValue);
    const parsedRole = extractRoleFromObject(parsed);

    if (parsedRole) {
      return parsedRole;
    }
  } catch (error) {
    // Not JSON; continue parsing.
  }

  const jwtPayload = decodeJwtPayload(rawValue);
  const jwtRole = extractRoleFromObject(jwtPayload);

  if (jwtRole) {
    return jwtRole;
  }

  const keyValueRole = rawValue.match(/(?:^|[;\s])role=([a-zA-Z_]+)/);

  if (keyValueRole?.[1]) {
    return normalizeRole(keyValueRole[1]);
  }

  return null;
}

export function resolveRoleFromCookieStore(cookieStore) {
  for (const key of ROLE_COOKIE_KEYS) {
    const role = normalizeRole(readCookieValue(cookieStore, key));

    if (role) {
      return role;
    }
  }

  for (const key of SESSION_COOKIE_KEYS) {
    const role = extractRoleFromValue(readCookieValue(cookieStore, key));

    if (role) {
      return role;
    }
  }

  if (cookieStore?.getAll) {
    for (const entry of cookieStore.getAll()) {
      const role = extractRoleFromValue(entry?.value);

      if (role) {
        return role;
      }
    }
  }

  return null;
}

export function getDashboardRouteForRole(role) {
  return ROLE_ROUTES[normalizeRole(role)] ?? null;
}

export function isRoleRouteAllowed(role, pathname) {
  const safeRole = normalizeRole(role);

  if (!safeRole || typeof pathname !== "string") {
    return false;
  }

  return pathname.startsWith(ROLE_ROUTES[safeRole]);
}
