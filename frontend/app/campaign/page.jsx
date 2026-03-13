import Link from "next/link";
import { ArrowUpRight, Layers3, PlusCircle, Target } from "lucide-react";

import OpsShell from "@/components/ops/ops-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCampaignType, formatDate, getOrgIdFromParams, loadOrgSnapshot } from "@/lib/backend";

const STATUS_VARIANT = {
  running: "warning",
  scheduled: "muted",
  draft: "default",
  completed: "success",
  cancelled: "danger",
};

export default async function CampaignPage({ searchParams }) {
  const params = await searchParams;
  const orgId = getOrgIdFromParams(params);
  const { campaigns } = await loadOrgSnapshot(orgId);

  const runningCount = campaigns.filter((campaign) => campaign.status === "running").length;
  const scheduledCount = campaigns.filter((campaign) => campaign.status === "scheduled").length;

  return (
    <OpsShell
      activeSection="campaign"
      title="Campaign Operations"
      subtitle="Manage phishing simulations, schedules, and execution states"
      orgId={orgId}
      generatedAt={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      actions={
        <Link href={`/campaign/create?org_id=${orgId}`}>
          <Button className="h-10 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
            <PlusCircle className="size-4" />
            New Campaign
          </Button>
        </Link>
      }
      searchPlaceholder="Search campaign title or type..."
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total Campaigns</p>
          <p className="mt-3 text-3xl font-semibold text-slate-100">{campaigns.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Running</p>
          <p className="mt-3 text-3xl font-semibold text-amber-300">{runningCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Scheduled</p>
          <p className="mt-3 text-3xl font-semibold text-slate-100">{scheduledCount}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Layers3 className="size-4 text-emerald-300" />
            Campaign Registry
          </p>
          <Badge variant="muted">{campaigns.length} entries</Badge>
        </div>

        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 md:grid-cols-[1.4fr_auto_auto_auto_auto_auto] md:items-center"
            >
              <div>
                <p className="text-sm font-semibold text-slate-100">{campaign.title}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-slate-500">
                  {formatCampaignType(campaign.type)}
                </p>
              </div>

              <Badge variant={STATUS_VARIANT[campaign.status] || "muted"}>{campaign.status}</Badge>

              <p className="text-xs text-slate-400">
                Created
                <br />
                <span className="text-slate-300">{formatDate(campaign.created_at)}</span>
              </p>

              <p className="text-xs text-slate-400">
                Scheduled
                <br />
                <span className="text-slate-300">{formatDate(campaign.scheduled_at)}</span>
              </p>

              <p className="text-xs text-slate-400">
                Template
                <br />
                <span className="text-slate-300">{campaign.template_id || "-"}</span>
              </p>

              <div className="flex items-center gap-2">
                <Link href={`/simulation/${campaign.id}?org_id=${orgId}`}>
                  <Button size="sm" variant="outline" className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900">
                    <Target className="size-4" />
                    Open
                  </Button>
                </Link>
                <Link href={`/analytics?org_id=${orgId}`}>
                  <Button size="sm" className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                    <ArrowUpRight className="size-4" />
                    Analyze
                  </Button>
                </Link>
              </div>
            </article>
          ))}

          {!campaigns.length ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/80 px-4 py-8 text-center text-sm text-slate-400">
              No campaigns found for this organization.
            </div>
          ) : null}
        </div>
      </section>
    </OpsShell>
  );
}
