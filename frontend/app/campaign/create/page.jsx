import { CheckCircle2 } from "lucide-react";

import CreateCampaignForm from "@/components/campaign/create-campaign-form";
import OpsShell from "@/components/ops/ops-shell";
import { Button } from "@/components/ui/button";
import { getOrgIdFromParams } from "@/lib/backend";

export default async function CreateCampaignPage({ searchParams }) {
  const params = await searchParams;
  const orgId = getOrgIdFromParams(params);

  return (
    <OpsShell
      activeSection="create-campaign"
      title="Create Campaign"
      subtitle="Configure and launch a backend-compatible simulation payload"
      orgId={orgId}
      generatedAt={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      actions={
        <Button className="h-10 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
          <CheckCircle2 className="size-4" />
          Ready to Launch
        </Button>
      }
      searchPlaceholder="Search templates, campaign history..."
    >
      <CreateCampaignForm orgId={orgId} />
    </OpsShell>
  );
}
