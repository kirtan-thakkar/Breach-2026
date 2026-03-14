export const FALLBACK_CAMPAIGNS = [
  {
    id: "demo-1",
    title: "Quarterly Credential Probe",
    status: "running",
    type: "phishing",
    template_id: "template-phishing-01",
    organization_id: "demo-org",
    created_at: "2026-03-01T09:00:00Z",
    scheduled_at: null,
  },
  {
    id: "demo-2",
    title: "Finance Invoice Simulation",
    status: "scheduled",
    type: "social_engineering",
    template_id: "template-finance-02",
    organization_id: "demo-org",
    created_at: "2026-03-03T07:30:00Z",
    scheduled_at: "2026-03-15T10:00:00Z",
  },
  {
    id: "demo-3",
    title: "SecureLink Password Rotation",
    status: "completed",
    type: "credential_harvesting",
    template_id: "template-password-03",
    organization_id: "demo-org",
    created_at: "2026-02-18T13:20:00Z",
    scheduled_at: null,
  },
  {
    id: "demo-4",
    title: "Executive Device Compliance",
    status: "draft",
    type: "social_engineering",
    template_id: "template-exec-04",
    organization_id: "demo-org",
    created_at: "2026-03-06T11:10:00Z",
    scheduled_at: null,
  },
];

export function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://127.0.0.1:8000";
}

export async function fetchSafe(pathname, cacheSeconds = 20, init = {}) {
  const url = `${getBackendBaseUrl()}${pathname}`;

  try {
    const response = await fetch(url, {
      ...init,
      next: { revalidate: cacheSeconds },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    return null;
  }
}

export function pickHighlightedCampaign(campaigns) {
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    return null;
  }

  return campaigns.find((campaign) => campaign.status === "running") || campaigns[0];
}

export async function loadOrgSnapshot(orgId) {
  const [summary, campaigns] = await Promise.all([
    fetchSafe(`/api/v1/analytics/summary/${orgId}`),
    fetchSafe(`/api/v1/campaigns?org_id=${orgId}`),
  ]);

  const safeCampaigns = Array.isArray(campaigns) && campaigns.length ? campaigns : FALLBACK_CAMPAIGNS;
  const highlightedCampaign = pickHighlightedCampaign(safeCampaigns);
  const campaignAnalytics = highlightedCampaign?.id
    ? await fetchSafe(`/api/v1/analytics/campaign/${highlightedCampaign.id}`)
    : null;

  const safeSummary = summary || {
    total_campaigns: safeCampaigns.length,
    total_targets: 76,
    risk_score: 34,
    trend: "decreasing",
    click_rate: campaignAnalytics?.click_rate ?? 27,
    compromise_rate: campaignAnalytics?.compromise_rate ?? 14,
  };

  return {
    summary: safeSummary,
    campaigns: safeCampaigns,
    highlightedCampaign,
    highlightedAnalytics: campaignAnalytics,
  };
}

export async function loadCampaignDetail(campaignId, orgId = "demo-org") {
  const [campaigns, analytics] = await Promise.all([
    fetchSafe(`/api/v1/campaigns?org_id=${orgId}`),
    fetchSafe(`/api/v1/analytics/campaign/${campaignId}`),
  ]);

  const safeCampaigns = Array.isArray(campaigns) && campaigns.length ? campaigns : FALLBACK_CAMPAIGNS;
  const campaign = safeCampaigns.find((entry) => entry.id === campaignId) || safeCampaigns[0] || null;

  const safeAnalytics = analytics || {
    total_sent: 54,
    total_clicks: 16,
    total_submissions: 8,
    click_rate: 29.6,
    compromise_rate: 14.8,
  };

  return {
    campaign,
    analytics: safeAnalytics,
    campaigns: safeCampaigns,
  };
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
  return params?.org_id || params?.orgId || "demo-org";
}
