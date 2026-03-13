import SimulationScreen from "@/components/simulation/simulation-screen";
import { getOrgIdFromParams, loadCampaignDetail } from "@/lib/backend";

export default async function SimulationPage({ params, searchParams }) {
  const routeParams = await params;
  const queryParams = await searchParams;

  const orgId = getOrgIdFromParams(queryParams);
  const campaignId = routeParams?.campaignId;
  const { campaign, analytics } = await loadCampaignDetail(campaignId, orgId);

  return (
    <SimulationScreen
      orgId={orgId}
      generatedAt={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      campaign={campaign}
      analytics={analytics}
    />
  );
}