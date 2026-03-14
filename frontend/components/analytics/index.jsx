analytics.jsx 
"use client";

import { useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { ArrowUpRight, Bot, ShieldAlert, Target, Users, Zap } from "lucide-react";

import OpsLayout from "@/components/ops/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

function clampPercent(value) {
  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, numeric));
}

export default function Analytics({
  orgId,
  generatedAt,
  summary,
  campaigns,
  overview,
  employees,
  highlightedCampaign,
  highlightedAnalytics,
}) {
  const [metricFilter, setMetricFilter] = useState("email-opened");
  const safeCampaigns = useMemo(() => (Array.isArray(campaigns) ? campaigns : []), [campaigns]);
  const safeEmployees = useMemo(() => (Array.isArray(employees) ? employees : []), [employees]);

  const totalTargets = Number(summary?.total_targets ?? 0);
  const riskScore = clampPercent(summary?.risk_score ?? 0);
  const clickRate = clampPercent(
    overview?.totals?.click_rate ?? highlightedAnalytics?.click_rate ?? summary?.click_rate ?? 0
  );
  const compromiseRate = clampPercent(
    overview?.totals?.compromise_rate ?? highlightedAnalytics?.compromise_rate ?? summary?.compromise_rate ?? 0
  );

  const engagementSeries = useMemo(() => {
    const daily = Array.isArray(overview?.daily) ? overview.daily : [];
    const labels = daily.length
      ? daily.map((entry) =>
          new Date(entry.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        )
      : ["No data"];

    const sentSeries = daily.length ? daily.map((entry) => Number(entry.tests_sent ?? 0)) : [0];
    const opensSeries = sentSeries.map((count) => Math.round((count * Math.max(clickRate, 12)) / 100));
    const clicksSeries = sentSeries.map((count) => Math.round((count * clickRate) / 100));
    const submissionsSeries = sentSeries.map((count) => Math.round((count * compromiseRate) / 100));

    return {
      labels,
      opened: opensSeries,
      clicked: clicksSeries,
      submitted: submissionsSeries,
    };
  }, [overview, clickRate, compromiseRate]);

  const typeBreakdown = useMemo(() => {
    const buckets = {
      phishing: 0,
      credential_harvesting: 0,
      social_engineering: 0,
      malware_deception: 0,
    };

    safeCampaigns.forEach((campaign) => {
      const key = campaign.type || "phishing";
      buckets[key] = (buckets[key] || 0) + 1;
    });

    return {
      labels: ["Phishing", "Credential", "Social", "Malware"],
      values: [
        buckets.phishing,
        buckets.credential_harvesting,
        buckets.social_engineering,
        buckets.malware_deception,
      ],
    };
  }, [safeCampaigns]);

  const statusBreakdown = useMemo(() => {
    const status = { running: 0, scheduled: 0, draft: 0, completed: 0, cancelled: 0 };

    safeCampaigns.forEach((campaign) => {
      status[campaign.status] = (status[campaign.status] || 0) + 1;
    });

    return status;
  }, [safeCampaigns]);

  const lineData = useMemo(
    () => {
      const allDatasets = [
        {
          label: "Email Opened",
          data: engagementSeries.opened,
          borderColor: "rgba(52, 211, 153, 0.95)",
          backgroundColor: "rgba(52, 211, 153, 0.25)",
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.38,
          fill: true,
        },
        {
          label: "Link Clicked",
          data: engagementSeries.clicked,
          borderColor: "rgba(96, 165, 250, 0.95)",
          backgroundColor: "rgba(96, 165, 250, 0.16)",
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.38,
        },
        {
          label: "Form Submitted",
          data: engagementSeries.submitted,
          borderColor: "rgba(244, 114, 182, 0.95)",
          backgroundColor: "rgba(244, 114, 182, 0.1)",
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.38,
        },
      ];

      const filteredDatasets =
        metricFilter === "email-opened"
          ? [allDatasets[0]]
          : metricFilter === "link-clicked"
            ? [allDatasets[1]]
            : [allDatasets[2]];

      return {
        labels: engagementSeries.labels,
        datasets: filteredDatasets,
      };
    },
    [engagementSeries, metricFilter]
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#cbd5e1",
          usePointStyle: true,
          boxWidth: 7,
        },
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
        grid: { color: "rgba(30,41,59,0.55)" },
        border: { display: false },
        ticks: { color: "#64748b" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(30,41,59,0.45)" },
        border: { display: false },
        ticks: { color: "#64748b" },
      },
    },
  };

  const typeData = {
    labels: typeBreakdown.labels,
    datasets: [
      {
        label: "Campaign count",
        data: typeBreakdown.values,
        backgroundColor: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const doughnutData = {
    labels: ["Running", "Scheduled", "Draft", "Completed", "Cancelled"],
    datasets: [
      {
        data: [
          statusBreakdown.running,
          statusBreakdown.scheduled,
          statusBreakdown.draft,
          statusBreakdown.completed,
          statusBreakdown.cancelled,
        ],
        backgroundColor: ["#f59e0b", "#94a3b8", "#0ea5e9", "#10b981", "#fb7185"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <OpsLayout
      activeSection="analytics"
      title="Analytics"
      subtitle="Deep campaign performance analysis across your simulation fleet"
      orgId={orgId}
      generatedAt={generatedAt}
      actions={
        <Button className="h-10 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
          <ArrowUpRight className="size-4" />
          Export CSV
        </Button>
      }
      searchPlaceholder="Search campaign analytics or metrics..."
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Tracked Campaigns</p>
          <p className="mt-3 text-3xl font-semibold text-slate-100">{safeCampaigns.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Click Rate</p>
          <p className="mt-3 text-3xl font-semibold text-amber-300">{clickRate.toFixed(1)}%</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Compromise Rate</p>
          <p className="mt-3 text-3xl font-semibold text-rose-300">{compromiseRate.toFixed(1)}%</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Risk Score</p>
          <p className="mt-3 text-3xl font-semibold text-slate-100">{riskScore}%</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <p className="text-lg font-semibold text-slate-100">Engagement vs Compromise (7 Days)</p>
            <p className="text-sm text-slate-400">
              Highlighting {highlightedCampaign?.name || highlightedCampaign?.title || "active campaign"} behavior
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Filter Metric</span>
              <RadioGroup value={metricFilter} onValueChange={setMetricFilter} className="flex flex-row gap-3">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="email-opened" id="email-opened" />
                  <label htmlFor="email-opened" className="text-sm text-slate-300 cursor-pointer">
                    Email Opened
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="link-clicked" id="link-clicked" />
                  <label htmlFor="link-clicked" className="text-sm text-slate-300 cursor-pointer">
                    Link Clicked
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="form-submitted" id="form-submitted" />
                  <label htmlFor="form-submitted" className="text-sm text-slate-300 cursor-pointer">
                    Form Submitted
                  </label>
                </div>
              </RadioGroup>
            </div>
            <Badge variant="muted">7D</Badge>
          </div>
        </div>
        <div className="mt-4 h-80 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <Line data={lineData} options={chartOptions} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-lg font-semibold text-slate-100">
              <Target className="size-4 text-emerald-300" />
              Campaign Type Distribution
            </p>
            <Badge variant="muted">Org mix</Badge>
          </div>
          <div className="mt-4 h-64 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <Bar
              data={typeData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false },
                },
              }}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
          <p className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Bot className="size-4 text-violet-300" />
            Status Mix
          </p>
          <div className="mt-4 h-64 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: "#94a3b8",
                      usePointStyle: true,
                      boxWidth: 8,
                    },
                  },
                },
                cutout: "68%",
              }}
            />
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-100">
            <Users className="size-4 text-emerald-300" />
            Total Targets
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-100">{totalTargets}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-100">
            <ShieldAlert className="size-4 text-rose-300" />
            High Risk Employees
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-100">
            {safeEmployees.filter((entry) => Number(entry?.risk_score ?? 0) >= 60).length}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-100">
            <Zap className="size-4 text-amber-300" />
            Priority Action
          </p>
          <p className="mt-4 text-sm text-slate-300">
            Focus retraining on employees with repeated click and submission behavior before launching the next drill.
          </p>
        </article>
      </section>
    </OpsLayout>
  );
}