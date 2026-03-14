import Analytics from "@/components/analytics";
import { cookies } from "next/headers";
import { getOrgIdFromParams, loadOrgSnapshot } from "@/lib/backend";

export default async function AnalyticsPage({ searchParams }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_session")?.value;
  const orgId = getOrgIdFromParams(params) || cookieStore.get("org_id")?.value || "";
  const { summary, campaigns, overview, employees, highlightedCampaign, highlightedAnalytics } = await loadOrgSnapshot(orgId, token);

  return (
    <Analytics
      orgId={orgId}
      generatedAt={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      summary={summary}
      campaigns={campaigns}
      overview={overview}
      employees={employees}
      highlightedCampaign={highlightedCampaign}
      highlightedAnalytics={highlightedAnalytics}
    />
  );
}