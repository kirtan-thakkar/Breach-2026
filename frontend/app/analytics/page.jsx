import Analytics from "@/components/analytics";
import { getOrgIdFromParams, loadOrgSnapshot } from "@/lib/backend";

export default async function AnalyticsPage({ searchParams }) {
  const params = await searchParams;
  const orgId = getOrgIdFromParams(params);
  const { summary, campaigns, highlightedCampaign, highlightedAnalytics } = await loadOrgSnapshot(orgId);

  return (
    <Analytics
      orgId={orgId}
      generatedAt={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      summary={summary}
      campaigns={campaigns}
      highlightedCampaign={highlightedCampaign}
      highlightedAnalytics={highlightedAnalytics}
    />
  );
}
