import { cookies } from "next/headers";
import Dashboard from "@/components/dashboard";
import { getOrgIdFromParams, loadOrgSnapshot } from "@/lib/backend";

export default async function AdvisorDashboardPage({ searchParams }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_session")?.value;
  const orgId = getOrgIdFromParams(params) || cookieStore.get("org_id")?.value || "";
  const { summary, campaigns, highlightedCampaign, highlightedAnalytics } = await loadOrgSnapshot(orgId, token);

  return (
    <Dashboard
      orgId={orgId}
      summary={summary}
      campaigns={campaigns}
      campaignAnalytics={highlightedAnalytics}
      highlightedCampaign={highlightedCampaign}
      generatedAt={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    />
  );
}
