import Dashboard from "@/components/dashboard";
import { getOrgIdFromParams, loadOrgSnapshot } from "@/lib/backend";

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;
  const orgId = getOrgIdFromParams(params);
  const { summary, campaigns, highlightedCampaign, highlightedAnalytics } = await loadOrgSnapshot(orgId);

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
