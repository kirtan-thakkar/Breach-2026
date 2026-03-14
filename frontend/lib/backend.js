export const FALLBACK_CAMPAIGNS = [];

export function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://127.0.0.1:8000";
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function postJson(pathname, body, init = {}) {
  const url = `${getBackendBaseUrl()}${pathname}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    body: JSON.stringify(body),
    ...init,
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    const message = data?.detail || "Request failed";
    throw new Error(message);
  }

  return data;
}

export function applyAuthSessionCookies(payload) {
  if (typeof document === "undefined" || !payload) {
    return;
  }

  const maxAge = 60 * 60 * 24 * 7;
  const safeRole = payload.role || "admin";

  document.cookie = `role=${safeRole}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

  if (payload.access_token) {
    document.cookie = `auth_session=${payload.access_token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }

  if (payload.organization_id) {
    document.cookie = `org_id=${payload.organization_id}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }
}

export function clearAuthSessionCookies() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = "role=; Path=/; Max-Age=0; SameSite=Lax";
  document.cookie = "auth_session=; Path=/; Max-Age=0; SameSite=Lax";
  document.cookie = "org_id=; Path=/; Max-Age=0; SameSite=Lax";
}

export async function signupWithRole(payload) {
  return postJson("/api/v1/auth/signup", payload);
}

export async function loginWithPassword(payload) {
  return postJson("/api/v1/auth/login", payload);
}

export async function fetchSafe(pathname, cacheSeconds = 20, init = {}) {
  const url = `${getBackendBaseUrl()}${pathname}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
      },
      next: { revalidate: cacheSeconds, ...(init.next || {}) },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    return null;
  }
}

export async function loadUserSnapshot(token) {
  if (!token) return null;
  return fetchSafe("/api/v1/users/me", 0, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function pickHighlightedCampaign(campaigns) {
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    return null;
  }

  return campaigns.find((campaign) => campaign.status === "running") || campaigns[0];
}

export async function loadOrgSnapshot(orgId, token) {
  try {
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    const orgQuery = orgId ? `?org_id=${encodeURIComponent(orgId)}` : "";

    const [campaigns, targets] = await Promise.all([
      fetchSafe(`/api/v1/campaigns${orgQuery}`, 20, { headers: authHeader }),
      fetchSafe(`/api/v1/targets${orgQuery}`, 20, { headers: authHeader }),
    ]);

    const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
    const safeTargets = Array.isArray(targets) ? targets : [];
    const inferredOrgId =
      orgId ||
      safeTargets.find((entry) => entry?.organization_id)?.organization_id ||
      safeCampaigns.find((entry) => entry?.organization_id)?.organization_id ||
      "";

    let summary = null;
    let overview = null;
    let employees = [];
    if (inferredOrgId) {
      [summary, overview, employees] = await Promise.all([
        fetchSafe(`/api/v1/analytics/summary/${inferredOrgId}`, 20, { headers: authHeader }),
        fetchSafe(`/api/v1/analytics/overview/${inferredOrgId}`, 20, { headers: authHeader }),
        fetchSafe(`/api/v1/analytics/employees/${inferredOrgId}`, 20, { headers: authHeader }),
      ]);
    }

    const safeEmployees = Array.isArray(employees) ? employees : [];
    const highlightedCampaign = pickHighlightedCampaign(safeCampaigns);
    
    let campaignAnalytics = null;
    if (highlightedCampaign?.id) {
      campaignAnalytics = await fetchSafe(`/api/v1/analytics/campaign/${highlightedCampaign.id}`, 20, {
        headers: authHeader,
      });
    }

    const safeSummary = summary || {
      total_campaigns: safeCampaigns.length,
      total_targets: safeTargets.length,
      risk_score: 0,
      trend: "stable",
      click_rate: campaignAnalytics?.click_rate ?? 0,
      compromise_rate: campaignAnalytics?.compromise_rate ?? 0,
    };

    return {
      summary: safeSummary,
      campaigns: safeCampaigns,
      targets: safeTargets,
      employees: safeEmployees,
      overview: overview || null,
      highlightedCampaign,
      highlightedAnalytics: campaignAnalytics,
    };
  } catch (error) {
    console.error("Failed to load org snapshot:", error);
    return {
      summary: { total_campaigns: 0, total_targets: 0, risk_score: 0, trend: "stable" },
      campaigns: [],
      targets: [],
      employees: [],
      overview: null,
      highlightedCampaign: null,
      highlightedAnalytics: null,
    };
  }
}

export async function loadCampaignDetail(campaignId, orgId) {
  if (!orgId) return { campaign: null, analytics: null, campaigns: [] };
  
  try {
    const [campaigns, analytics] = await Promise.all([
      fetchSafe(`/api/v1/campaigns?org_id=${orgId}`),
      fetchSafe(`/api/v1/analytics/campaign/${campaignId}`),
    ]);

    const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
    const campaign = safeCampaigns.find((entry) => entry.id === campaignId) || null;

    const safeAnalytics = analytics || {
      total_sent: 0,
      total_clicks: 0,
      total_submissions: 0,
      click_rate: 0,
      compromise_rate: 0,
    };

    return {
      campaign,
      analytics: safeAnalytics,
      campaigns: safeCampaigns,
    };
  } catch (error) {
    return {
      campaign: null,
      analytics: { total_sent: 0, total_clicks: 0, total_submissions: 0, click_rate: 0, compromise_rate: 0 },
      campaigns: [],
    };
  }
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatCampaignType(value) {
  if (!value) {
    return "phishing";
  }

  return value.replaceAll("_", " ");
}

export function getOrgIdFromParams(params) {
  return params?.org_id || params?.orgId || "";
}