"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  Building2,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Gauge,
  LoaderCircle,
  ShieldAlert,
  Target,
  Upload,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";

import OpsLayout from "@/components/ops/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCampaignType, getBackendBaseUrl } from "@/lib/backend";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const STATUS_VARIANT = {
  running: "warning",
  scheduled: "muted",
  draft: "default",
  completed: "success",
  cancelled: "danger",
};

const ATTACK_OPTIONS = [
  { value: "email_link", label: "Test with email link" },
  { value: "whatsapp", label: "Test with WhatsApp" },
  { value: "qr_in_email", label: "Test with QR in email" },
  { value: "meeting_mail", label: "Test via meeting mail" },
  { value: "telegram", label: "Test via Telegram" },
];

function clampPercent(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
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

function TrendChart({ labels, values }) {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Tests sent",
          data: values,
          borderColor: "rgba(16, 185, 129, 0.95)",
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.42,
          fill: true,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return "rgba(16,185,129,0.14)";

            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, "rgba(16,185,129,0.36)");
            gradient.addColorStop(1, "rgba(16,185,129,0.02)");
            return gradient;
          },
        },
      ],
    }),
    [labels, values]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 650 },
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
          beginAtZero: true,
          grid: { color: "rgba(30,41,59,0.4)" },
          border: { display: false },
          ticks: { color: "#64748b", precision: 0 },
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

function formatDay(isoDate) {
  if (!isoDate) return "-";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard({
  orgId,
  token,
  summary,
  campaigns,
  targets,
  employees,
  overview,
  campaignAnalytics,
  highlightedCampaign,
  generatedAt,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  const safeTargets = Array.isArray(targets) ? targets : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const [dispatchState, setDispatchState] = useState({});
  const csvRef = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", department: "", whatsapp_number: "" });
  const [addFormState, setAddFormState] = useState({ state: "idle", message: "" });
  const [csvUploadState, setCsvUploadState] = useState({ state: "idle", message: "" });
  const [orgInput, setOrgInput] = useState(orgId || "");
  const [orgState, setOrgState] = useState({ state: "idle", message: "" });

  // Auto-resolve org id on mount when it is missing from server props.
  useEffect(() => {
    if (orgInput || !token) return;
    fetch(`${getBackendBaseUrl()}/api/v1/organizations/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .catch(() => null)
      .then((data) => {
        const fetchedId = data?.id;
        if (!fetchedId) return;
        setOrgInput(fetchedId);
        // Persist to cookie and reload with org_id in URL.
        document.cookie = `org_id=${encodeURIComponent(fetchedId)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        router.replace(`${pathname}?org_id=${encodeURIComponent(fetchedId)}`);
        router.refresh();
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCampaigns = Number(summary?.total_campaigns ?? safeCampaigns.length ?? 0);
  const totalTargets = Number(summary?.total_targets ?? safeTargets.length ?? 0);
  const totalTestsSent = Number(summary?.total_tests_sent ?? overview?.totals?.total_sent ?? 0);

  const runningCount = safeCampaigns.filter((campaign) => campaign.status === "running").length;
  const highRiskEmployees = safeEmployees.filter((entry) => Number(entry?.risk_score ?? 0) >= 60).length;

  const riskScore = clampPercent(summary?.risk_score ?? 0);
  const clickRate = clampPercent(overview?.totals?.click_rate ?? campaignAnalytics?.click_rate ?? summary?.click_rate ?? 0);
  const compromiseRate = clampPercent(
    overview?.totals?.compromise_rate ?? campaignAnalytics?.compromise_rate ?? summary?.compromise_rate ?? 0
  );

  const healthScore = clampPercent(100 - Math.max(clickRate, compromiseRate));
  const warningCount = Math.max(0, Math.round((clickRate + compromiseRate) / 20));
  const criticalCount = Math.max(highRiskEmployees, riskScore >= 60 ? 1 : 0);

  const trendLabels = (overview?.daily || []).map((entry) => formatDay(entry.date));
  const trendValues = (overview?.daily || []).map((entry) => Number(entry.tests_sent ?? 0));

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
      hint: "Derived from org click and compromise rates",
      icon: CheckCircle2,
      tone: "good",
    },
    {
      label: "Warnings",
      value: String(warningCount),
      hint: "Behavior needing follow-up",
      icon: AlertTriangle,
      tone: "warn",
    },
    {
      label: "Critical Risk",
      value: String(criticalCount),
      hint: "Employees with elevated risk",
      icon: ShieldAlert,
      tone: "risk",
    },
  ];

  const featuredCampaign = highlightedCampaign || safeCampaigns[0] || null;

  function saveOrganizationId() {
    const nextOrg = String(orgInput || "").trim();
    if (!nextOrg) {
      setOrgState({ state: "error", message: "Organization ID is required" });
      return;
    }

    document.cookie = `org_id=${encodeURIComponent(nextOrg)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    const nextPath = `${pathname}?org_id=${encodeURIComponent(nextOrg)}`;
    setOrgState({ state: "success", message: "Organization saved" });
    router.replace(nextPath);
    router.refresh();
  }

  const aiInsights = [
    {
      id: "insight-1",
      text: `Org click exposure is ${clickRate.toFixed(1)}% across all tests.`,
    },
    {
      id: "insight-2",
      text: `${runningCount} campaigns are currently running and ${totalTestsSent} total tests were dispatched.`,
    },
    {
      id: "insight-3",
      text: `${highRiskEmployees} employees currently score at high risk and should be prioritized for retraining.`,
    },
  ];

  async function addEmployee(e) {
    e.preventDefault();
    if (!token) return;

    const activeOrgId = String(orgInput || orgId || "").trim();
    if (!activeOrgId) {
      setAddFormState({ state: "error", message: "Set Organization ID first" });
      return;
    }

    setAddFormState({ state: "loading", message: "Adding..." });
    try {
      const body = { ...addForm, organization_id: activeOrgId };

      const res = await fetch(`${getBackendBaseUrl()}/api/v1/targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddFormState({ state: "error", message: data?.detail || "Failed to add employee" });
        return;
      }
      setAddFormState({ state: "success", message: "Employee added!" });
      setTimeout(() => {
        setShowAddModal(false);
        setAddForm({ name: "", email: "", department: "", whatsapp_number: "" });
        setAddFormState({ state: "idle", message: "" });
        router.refresh();
      }, 900);
    } catch {
      setAddFormState({ state: "error", message: "Unable to reach backend" });
    }
  }

  async function uploadCSV(e) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const activeOrgId = String(orgInput || orgId || "").trim();
    if (!activeOrgId) {
      setCsvUploadState({ state: "error", message: "Set Organization ID first" });
      if (csvRef.current) csvRef.current.value = "";
      return;
    }

    setCsvUploadState({ state: "loading", message: "Uploading..." });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(
        `${getBackendBaseUrl()}/api/v1/targets/batch-upload?org_id=${encodeURIComponent(activeOrgId)}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCsvUploadState({ state: "error", message: data?.detail || "Upload failed" });
      } else {
        setCsvUploadState({ state: "success", message: `${data.count ?? "?"} employees imported` });
        router.refresh();
      }
    } catch {
      setCsvUploadState({ state: "error", message: "Unable to reach backend" });
    }
    if (csvRef.current) csvRef.current.value = "";
  }

  async function triggerEmployeeAttack(targetId, attackType) {
    if (!token || !targetId) return;

    const key = `${targetId}:${attackType}`;
    setDispatchState((prev) => ({ ...prev, [key]: { state: "loading", message: "Dispatching..." } }));

    try {
      const response = await fetch(`${getBackendBaseUrl()}/api/v1/targets/${targetId}/test-attack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attack_type: attackType }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setDispatchState((prev) => ({
          ...prev,
          [key]: { state: "error", message: data?.detail || "Dispatch failed" },
        }));
        return;
      }

      if (data?.dispatch_uri && (attackType === "whatsapp" || attackType === "telegram")) {
        window.open(data.dispatch_uri, "_blank", "noopener,noreferrer");
      }

      setDispatchState((prev) => ({
        ...prev,
        [key]: { state: "success", message: data?.message || "Test attack dispatched" },
      }));

      router.refresh();
    } catch {
      setDispatchState((prev) => ({
        ...prev,
        [key]: { state: "error", message: "Unable to reach backend" },
      }));
    }
  }

  return (
    <OpsLayout
      activeSection="dashboard"
      title="System Overview"
      subtitle="Monitor campaign health, employee behavior, and targeted simulation tests."
      role="admin"
      orgId={orgId}
      generatedAt={generatedAt}
      actions={
        <Button className="h-10 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
          <Zap className="size-4" />
          Launch Drill
        </Button>
      }
    >
      <section className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-lg font-semibold text-slate-100">
              <Building2 className="size-4 text-cyan-300" />
              Organization Context
            </p>
            <p className="text-sm text-slate-400">
              {orgInput
                ? `Active: ${orgInput}`
                : "No organization detected — enter your org UUID below"}
            </p>
          </div>
          <div className="flex w-full max-w-2xl flex-wrap items-center gap-2">
            <input
              value={orgInput}
              onChange={(e) => {
                setOrgInput(e.target.value);
                if (orgState.message) setOrgState({ state: "idle", message: "" });
              }}
              placeholder="Paste organization UUID here"
              className="h-10 flex-1 min-w-0 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-slate-500"
            />
            <button
              type="button"
              onClick={saveOrganizationId}
              className="h-10 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 text-sm text-cyan-300 hover:bg-cyan-500/20 whitespace-nowrap"
            >
              Save &amp; Apply
            </button>
          </div>
        </div>
        {orgState.message ? (
          <p className={`mt-2 text-xs ${orgState.state === "error" ? "text-rose-300" : "text-emerald-300"}`}>
            {orgState.message}
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.85fr_1fr]">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-100">Tests Sent (7 Days)</p>
              <p className="text-sm text-slate-400">Real telemetry from organization-level simulation dispatches</p>
            </div>
            <Badge variant="muted">7D</Badge>
          </div>
          <TrendChart labels={trendLabels.length ? trendLabels : ["No Data"]} values={trendValues.length ? trendValues : [0]} />
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-lg font-semibold text-slate-100">
              <Bot className="size-4 text-violet-300" />
              AI-Generated Insights
            </p>
            <Badge variant="success">{aiInsights.length} insights</Badge>
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
        </article>
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
                  <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-slate-500">{formatCampaignType(campaign.type)}</p>
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

      <section className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-100">Employees</p>
            <p className="text-sm text-slate-400">Saved employee records with per-user attack test actions</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{safeEmployees.length} employees</Badge>
            <button
              type="button"
              onClick={() => { setAddFormState({ state: "idle", message: "" }); setShowAddModal(true); }}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20"
            >
              <UserPlus className="size-3.5" />
              Add Employee
            </button>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900">
              {csvUploadState.state === "loading" ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              Upload CSV
              <input ref={csvRef} type="file" accept=".csv" className="sr-only" onChange={uploadCSV} />
            </label>
            {csvUploadState.message ? (
              <span className={`text-xs ${csvUploadState.state === "error" ? "text-rose-300" : "text-emerald-300"}`}>
                {csvUploadState.message}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Tests</th>
                <th className="px-3 py-2">Clicks</th>
                <th className="px-3 py-2">Submissions</th>
                <th className="px-3 py-2">Risk</th>
                <th className="px-3 py-2">Last Tested</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeEmployees.map((employee) => (
                <tr key={employee.id} className="border-b border-slate-900/70 text-slate-300">
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-100">{employee.name || "Unknown"}</p>
                    <p className="text-xs text-slate-500">{employee.email}</p>
                  </td>
                  <td className="px-3 py-3">{employee.department || "-"}</td>
                  <td className="px-3 py-3">{employee.tests_sent ?? 0}</td>
                  <td className="px-3 py-3">{employee.link_clicked ?? 0}</td>
                  <td className="px-3 py-3">{employee.credential_submitted ?? 0}</td>
                  <td className="px-3 py-3">
                    <Badge variant={Number(employee.risk_score ?? 0) >= 60 ? "danger" : "muted"}>
                      {Number(employee.risk_score ?? 0).toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-400">{formatDateTime(employee.last_tested_at)}</td>
                  <td className="px-3 py-3">
                    <details className="group relative inline-block">
                      <summary className="cursor-pointer list-none rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900">
                        Test Employee
                      </summary>
                      <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-950 p-1 shadow-xl">
                        {ATTACK_OPTIONS.map((option) => {
                          const key = `${employee.id}:${option.value}`;
                          const isLoading = dispatchState[key]?.state === "loading";
                          return (
                            <button
                              key={option.value}
                              type="button"
                              disabled={isLoading}
                              onClick={() => triggerEmployeeAttack(employee.id, option.value)}
                              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-900 disabled:opacity-60"
                            >
                              <span>{option.label}</span>
                              {isLoading ? <LoaderCircle className="size-3 animate-spin" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </details>
                    {ATTACK_OPTIONS.map((option) => {
                      const key = `${employee.id}:${option.value}`;
                      const state = dispatchState[key];
                      if (!state || state.state === "loading") return null;
                      return (
                        <p
                          key={key}
                          className={`mt-1 text-[11px] ${
                            state.state === "success" ? "text-emerald-300" : "text-rose-300"
                          }`}
                        >
                          {state.message}
                        </p>
                      );
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!safeEmployees.length ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/65 px-4 py-6 text-sm text-slate-400">
              No employee records found yet. Upload targets and they will appear here.
            </div>
          ) : null}
        </div>
      </section>
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-100">Add Employee</p>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={addEmployee} className="space-y-3">
              <input
                required
                placeholder="Full name *"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-slate-500"
              />
              <input
                required
                type="email"
                placeholder="Email address *"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-slate-500"
              />
              <input
                placeholder="Department (optional)"
                value={addForm.department}
                onChange={(e) => setAddForm((f) => ({ ...f, department: e.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-slate-500"
              />
              <input
                placeholder="WhatsApp number (optional)"
                value={addForm.whatsapp_number}
                onChange={(e) => setAddForm((f) => ({ ...f, whatsapp_number: e.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-slate-500"
              />
              {addFormState.message ? (
                <p className={`text-sm ${addFormState.state === "error" ? "text-rose-300" : "text-emerald-300"}`}>
                  {addFormState.message}
                </p>
              ) : null}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addFormState.state === "loading"}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {addFormState.state === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </OpsLayout>
  );
}