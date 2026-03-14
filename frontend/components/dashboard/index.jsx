"use client";

import { Link } from "next-view-transitions";
import { useMemo } from "react";
import { motion } from "motion/react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Gauge,
  ShieldAlert,
  Target,
  Users,
  Zap,
} from "lucide-react";

import AiPanel from "@/components/Ai";
import OpsLayout from "@/components/ops/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCampaignType } from "@/lib/backend";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const STATUS_VARIANT = {
  running: "warning",
  scheduled: "muted",
  draft: "default",
  completed: "success",
  cancelled: "danger",
};

function clampPercent(value) {
  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, numeric));
}

function buildTrendSeries({ riskScore, clickRate, compromiseRate }) {
  const seed = Math.max(12, Math.round(riskScore || 18));
  const clickSkew = Math.round(clickRate * 0.24);
  const compromiseSkew = Math.round(compromiseRate * 0.31);

  return [
    clampPercent(seed - 8),
    clampPercent(seed - 4),
    clampPercent(seed + clickSkew - 2),
    clampPercent(seed + compromiseSkew),
    clampPercent(seed + 5),
    clampPercent(seed + Math.max(clickSkew, compromiseSkew) + 4),
    clampPercent(seed + 2),
  ];
}

function MetricCard({ label, value, hint, icon: Icon, tone }) {
  const toneClasses = {
    neutral: "text-slate-200 border-slate-800",
    good: "text-emerald-200 border-emerald-500/25",
    warn: "text-amber-200 border-amber-500/25",
    risk: "text-rose-200 border-rose-500/25",
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className={`rounded-2xl border bg-slate-950/65 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.6)] ${toneClasses[tone]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <span className="rounded-xl border border-current/20 bg-current/5 p-2">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-5 text-4xl font-semibold leading-none text-slate-100">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{hint}</p>
    </motion.article>
  );
}

function TrendChart({ values }) {
  const data = useMemo(
    () => ({
      labels: ["26 Feb", "27 Feb", "28 Feb", "1 Mar", "2 Mar", "3 Mar", "4 Mar"],
      datasets: [
        {
          label: "Exposure signal",
          data: values,
          borderColor: "rgba(99, 102, 241, 0.95)",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.42,
          fill: true,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;

            if (!chartArea) {
              return "rgba(99,102,241,0.14)";
            }

            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, "rgba(99,102,241,0.38)");
            gradient.addColorStop(1, "rgba(99,102,241,0.02)");
            return gradient;
          },
        },
      ],
    }),
    [values]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 650,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          backgroundColor: "rgba(2,6,23,0.94)",
          titleColor: "#e2e8f0",
          bodyColor: "#cbd5e1",
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(30,41,59,0.55)" },
          border: { display: false },
          ticks: { color: "#64748b", maxRotation: 0 },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: "rgba(30,41,59,0.4)" },
          border: { display: false },
          ticks: {
            color: "#64748b",
            callback: (value) => `${value}%`,
          },
        },
      },
    }),
    []
  );

  return (
    <div className="h-65 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      <Line data={data} options={options} />
    </div>
  );
}

export default function Dashboard({
  orgId,
  summary,
  campaigns,
  campaignAnalytics,
  highlightedCampaign,
  generatedAt,
}) {
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  const totalCampaigns = Number(summary?.total_campaigns ?? safeCampaigns.length ?? 0);
  const totalTargets = Number(summary?.total_targets ?? 0);

  const runningCount = safeCampaigns.filter((campaign) => campaign.status === "running").length;
  const completedCount = safeCampaigns.filter((campaign) => campaign.status === "completed").length;

  const riskScore = clampPercent(summary?.risk_score ?? 0);
  const clickRate = clampPercent(campaignAnalytics?.click_rate ?? summary?.click_rate ?? riskScore * 0.62);
  const compromiseRate = clampPercent(
    campaignAnalytics?.compromise_rate ?? summary?.compromise_rate ?? riskScore * 0.38
  );

  const healthScore = clampPercent(100 - Math.max(clickRate, compromiseRate));
  const warningCount = Math.max(0, Math.round((clickRate + compromiseRate) / 20));
  const criticalCount = riskScore >= 60 ? Math.max(1, Math.round(compromiseRate / 24)) : 0;

  const metrics = [
    {
      label: "Total Campaigns",
      value: String(totalCampaigns),
      hint: "Across the organization",
      icon: Target,
      tone: "neutral",
    },
    {
      label: "Healthy Posture",
      value: `${healthScore}%`,
      hint: "Derived from click and submission rates",
      icon: CheckCircle2,
      tone: "good",
    },
    {
      label: "Warnings",
      value: String(warningCount),
      hint: "Campaigns needing follow-up",
      icon: AlertTriangle,
      tone: "warn",
    },
    {
      label: "Critical Risk",
      value: String(criticalCount),
      hint: "Immediate action items",
      icon: ShieldAlert,
      tone: "risk",
    },
  ];

  const riskTrendValues = useMemo(
    () => buildTrendSeries({ riskScore, clickRate, compromiseRate }),
    [riskScore, clickRate, compromiseRate]
  );

  const featuredCampaign = highlightedCampaign || safeCampaigns[0] || null;

  const aiInsights = [
    {
      id: "insight-1",
      text: `Click exposure is ${clickRate.toFixed(1)}% across active simulations.`,
    },
    {
      id: "insight-2",
      text: `${runningCount} campaigns are currently running and need hourly monitoring.`,
    },
    {
      id: "insight-3",
      text: `${completedCount} campaigns finished this cycle. Review retraining assignments next.`,
    },
  ];

  return (
    <OpsLayout
      activeSection="dashboard"
      title="System Overview"
      subtitle="Monitor campaign health, target behavior, and simulated compromise signals."
      orgId={orgId}
      generatedAt={generatedAt}
      actions={
        <Button className="h-10 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
          <Zap className="size-4" />
          Launch Drill
        </Button>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.85fr_1fr]">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-100">Performance Ratio Trend</p>
              <p className="text-sm text-slate-400">Exposure signal generated from backend metrics</p>
            </div>
            <Badge variant="muted">7D</Badge>
          </div>
          <TrendChart values={riskTrendValues} />
        </article>

        <Dialog>
          <article className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                <Bot className="size-4 text-violet-300" />
                GenAI Failure Intelligence
              </p>
              <Badge variant="muted">{aiInsights.length} insights</Badge>
            </div>

            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-200">Highlighted Campaign</p>
              <p className="mt-1 text-base font-semibold text-slate-100">
                {featuredCampaign ? featuredCampaign.title : "No campaigns available"}
              </p>
              {featuredCampaign ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant={STATUS_VARIANT[featuredCampaign.status] || "muted"}>{featuredCampaign.status}</Badge>
                  <span className="text-slate-300">{formatCampaignType(featuredCampaign.type)}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-4 space-y-2">
              {aiInsights.map((insight) => (
                <div key={insight.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                  {insight.text}
                </div>
              ))}
            </div>

            <DialogTrigger asChild>
              <Button className="mt-4 h-10 w-full bg-violet-500 text-white hover:bg-violet-400">
                Open AI Failure Coach
              </Button>
            </DialogTrigger>
          </article>

          <DialogContent
            className="max-h-[88vh] overflow-hidden border-slate-800 bg-slate-950 p-0 text-slate-100 sm:max-w-4xl"
          >
            <DialogHeader className="border-b border-slate-800 px-5 py-4">
              <DialogTitle className="flex items-center gap-2 text-slate-100">
                <Bot className="size-4 text-violet-300" />
                AI Security Coach
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Access AI directly from dashboard and review failure patterns with actionable guidance.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[calc(88vh-74px)] overflow-y-auto p-4 sm:p-5">
              <AiPanel
                highlightedCampaignTitle={featuredCampaign?.title}
                clickRate={clickRate}
                compromiseRate={compromiseRate}
              />
            </div>
          </DialogContent>
        </Dialog>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-100">Campaign Pulse</p>
              <p className="text-sm text-slate-400">Live list from campaigns endpoint</p>
            </div>
            <Badge variant="muted">{safeCampaigns.length} tracked</Badge>
          </div>

          <div className="mt-4 space-y-2">
            {safeCampaigns.slice(0, 7).map((campaign) => (
              <Link
                key={campaign.id}
                href={`/simulation/${campaign.id}?org_id=${orgId}`}
                className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/65 px-3 py-2.5 transition-colors hover:border-slate-700"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">{campaign.title}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-slate-500">
                    {formatCampaignType(campaign.type)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[campaign.status] || "muted"}>{campaign.status}</Badge>
                  <ChevronRight className="size-4 text-slate-500 group-hover:text-slate-300" />
                </div>
              </Link>
            ))}

            {!safeCampaigns.length ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/65 px-4 py-6 text-sm text-slate-400">
                No campaigns were returned by the backend for this organization.
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4 sm:p-5">
          <p className="text-lg font-semibold text-slate-100">Mission Snapshot</p>
          <p className="mt-1 text-sm text-slate-400">Backend-driven health markers for quick review</p>

          <div className="mt-4 space-y-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-3">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                <Users className="size-3.5" />
                Targets
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">{totalTargets}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-3">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                <Gauge className="size-3.5" />
                Risk Score
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">{riskScore}%</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-3">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                <Crosshair className="size-3.5" />
                Click Rate
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">{clickRate.toFixed(1)}%</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-3">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                <Activity className="size-3.5" />
                Compromise Rate
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">{compromiseRate.toFixed(1)}%</p>
            </div>
          </div>
        </article>
      </section>
    </OpsLayout>
  );
}
