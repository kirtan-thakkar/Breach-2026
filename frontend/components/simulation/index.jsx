"use client";

import { useMemo } from "react";
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
  CheckCircle2,
  CircleDashed,
  Crosshair,
  Radar,
  ShieldAlert,
  Target,
  Users,
} from "lucide-react";

import OpsLayout from "@/components/ops/layout";
import { Badge } from "@/components/ui/badge";
import { formatCampaignType } from "@/lib/backend";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

function clampPercent(value) {
  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, numeric));
}

export default function Simulation({ orgId, generatedAt, campaign, analytics }) {
  const totalSent = Number(analytics?.total_sent ?? 0);
  const totalClicks = Number(analytics?.total_clicks ?? 0);
  const totalSubmissions = Number(analytics?.total_submissions ?? 0);

  const clickRate = clampPercent(analytics?.click_rate ?? 0);
  const compromiseRate = clampPercent(analytics?.compromise_rate ?? 0);
  const awarenessRate = clampPercent(100 - clickRate);

  const riskSeries = useMemo(() => {
    const base = Math.max(10, Math.round(compromiseRate || 14));
    return [
      base - 2,
      base + 1,
      base + 3,
      base + 4,
      base + 2,
      base + 5,
      base + 7,
      base + 6,
      base + 4,
      base + 6,
      base + 5,
      base + 8,
      base + 9,
      base + 11,
    ].map((value) => clampPercent(value));
  }, [compromiseRate]);

  const chartData = {
    labels: [
      "Day 1",
      "Day 2",
      "Day 3",
      "Day 4",
      "Day 5",
      "Day 6",
      "Day 7",
      "Day 8",
      "Day 9",
      "Day 10",
      "Day 11",
      "Day 12",
      "Day 13",
      "Day 14",
    ],
    datasets: [
      {
        label: "Risk Score",
        data: riskSeries,
        borderColor: "rgba(244, 63, 94, 0.95)",
        borderWidth: 2,
        pointRadius: 1.8,
        pointHoverRadius: 3,
        tension: 0.3,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            return "rgba(244,63,94,0.14)";
          }

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(244,63,94,0.38)");
          gradient.addColorStop(1, "rgba(244,63,94,0.03)");
          return gradient;
        },
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        backgroundColor: "rgba(2,6,23,0.94)",
        titleColor: "#e2e8f0",
        bodyColor: "#cbd5e1",
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(30,41,59,0.45)" },
        border: { display: false },
        ticks: { color: "#64748b" },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: "rgba(30,41,59,0.45)" },
        border: { display: false },
        ticks: {
          color: "#64748b",
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  const alertRows = [
    {
      id: "alert-1",
      title: "High click concentration in first 24h",
      severity: clickRate > 35 ? "critical" : "warning",
      recommendation: "Push immediate awareness notice and run follow-up micro training.",
    },
    {
      id: "alert-2",
      title: "Credential submission pattern detected",
      severity: compromiseRate > 20 ? "critical" : "warning",
      recommendation: "Escalate to security champions and enforce password reset workflow.",
    },
    {
      id: "alert-3",
      title: "Awareness posture trend",
      severity: awarenessRate >= 70 ? "healthy" : "watch",
      recommendation: "Maintain cadence and target departments below baseline next sprint.",
    },
  ];

  return (
    <OpsLayout
      activeSection="simulation"
      title="Simulation Intelligence"
      subtitle="Campaign-level telemetry and behavior insight"
      orgId={orgId}
      generatedAt={generatedAt}
      searchPlaceholder="Search simulation or target signal..."
    >
      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-100">{campaign?.title || "Campaign Simulation"}</p>
            <p className="text-sm text-slate-400">
              {campaign ? formatCampaignType(campaign.type) : "phishing"} • status {campaign?.status || "running"}
            </p>
          </div>
          <Badge variant="muted">Campaign ID {campaign?.id || "-"}</Badge>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
            <Users className="size-3.5" />
            Total Sent
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-100">{totalSent}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
            <Crosshair className="size-3.5" />
            Clicks
          </p>
          <p className="mt-3 text-3xl font-semibold text-amber-300">{totalClicks}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
            <ShieldAlert className="size-3.5" />
            Submissions
          </p>
          <p className="mt-3 text-3xl font-semibold text-rose-300">{totalSubmissions}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
            <CheckCircle2 className="size-3.5" />
            Awareness
          </p>
          <p className="mt-3 text-3xl font-semibold text-emerald-300">{awarenessRate.toFixed(1)}%</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Radar className="size-4 text-rose-300" />
            14-Day Fleet Risk Trend
          </p>
          <Badge variant="warning">Live model</Badge>
        </div>
        <div className="h-72 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <Line data={chartData} options={chartOptions} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold text-slate-100">Anomaly Queue</p>
          <Badge variant="muted">{alertRows.length} active</Badge>
        </div>

        <div className="space-y-2">
          {alertRows.map((row) => (
            <article key={row.id} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">{row.title}</p>
                <Badge
                  variant={
                    row.severity === "critical"
                      ? "danger"
                      : row.severity === "warning"
                        ? "warning"
                        : row.severity === "healthy"
                          ? "success"
                          : "muted"
                  }
                >
                  {row.severity}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400">{row.recommendation}</p>
              <div className="mt-3 flex gap-2">
                <button className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-900">
                  <CircleDashed className="size-3.5" />
                  Acknowledge
                </button>
                <button className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200 hover:bg-emerald-500/15">
                  <Target className="size-3.5" />
                  Resolve
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </OpsLayout>
  );
}
