import Link from "next/link";
import { ArrowRight, Radar } from "lucide-react";

import OpsLayout from "@/components/ops/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCampaignType, getOrgIdFromParams, loadOrgSnapshot } from "@/lib/backend";

const STATUS_VARIANT = {
  running: "warning",
  scheduled: "muted",
  draft: "default",
  completed: "success",
  cancelled: "danger",
};

export default async function SimulationIndexPage({ searchParams }) {
  const params = await searchParams;
  const orgId = getOrgIdFromParams(params);
  const { campaigns } = await loadOrgSnapshot(orgId);

  return (
    <OpsLayout
      activeSection="simulation"
      title="Simulation"
      subtitle="Pick a campaign to inspect telemetry and anomaly signals"
      orgId={orgId}
      generatedAt={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      searchPlaceholder="Search simulation by campaign..."
    >
      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Radar className="size-4 text-violet-300" />
            Campaign Simulations
          </p>
          <Badge variant="muted">{campaigns.length} campaigns</Badge>
        </div>

        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-100">{campaign.title}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-slate-500">
                  {formatCampaignType(campaign.type)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[campaign.status] || "muted"}>{campaign.status}</Badge>
                <Link href={`/simulation/${campaign.id}?org_id=${orgId}`}>
                  <Button size="sm" className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                    Open
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </OpsLayout>
  );
}
