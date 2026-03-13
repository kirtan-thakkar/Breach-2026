"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CalendarClock, CheckCircle2, LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getBackendBaseUrl } from "@/lib/backend";

const CAMPAIGN_TYPES = [
  { value: "phishing", label: "Phishing" },
  { value: "credential_harvesting", label: "Credential Harvesting" },
  { value: "malware_deception", label: "Malware Deception" },
  { value: "social_engineering", label: "Social Engineering" },
];

export default function CreateCampaignForm({ orgId }) {
  const router = useRouter();

  const [formState, setFormState] = useState({
    title: "",
    description: "",
    type: "phishing",
    template_id: "template-phishing-01",
    scheduled_at: "",
  });
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const payloadPreview = useMemo(() => {
    return {
      title: formState.title,
      description: formState.description || null,
      type: formState.type,
      template_id: formState.template_id,
      organization_id: orgId,
      scheduled_at: formState.scheduled_at ? new Date(formState.scheduled_at).toISOString() : null,
    };
  }, [formState, orgId]);

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setStatus({ state: "loading", message: "Creating campaign..." });

    try {
      const response = await fetch(`${getBackendBaseUrl()}/api/v1/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadPreview),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        setStatus({
          state: "error",
          message: errorBody?.detail || "Campaign creation failed. Verify backend and payload fields.",
        });
        return;
      }

      setStatus({ state: "success", message: "Campaign created successfully. Redirecting to campaign registry..." });

      setTimeout(() => {
        router.push(`/campaign?org_id=${orgId}`);
      }, 800);
    } catch (error) {
      setStatus({ state: "error", message: "Unable to reach backend API. Check backend URL and CORS setup." });
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
        <div>
          <p className="text-lg font-semibold text-slate-100">Campaign Configuration</p>
          <p className="text-sm text-slate-400">Create payloads that match the backend CampaignCreate schema.</p>
        </div>

        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Title</span>
          <input
            name="title"
            value={formState.title}
            onChange={handleInputChange}
            required
            placeholder="Q2 Credential Simulation"
            className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400/50"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Description</span>
          <textarea
            name="description"
            value={formState.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Simulate payroll urgency with secure remediation flow"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400/50"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Campaign Type</span>
            <select
              name="type"
              value={formState.type}
              onChange={handleInputChange}
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400/50"
            >
              {CAMPAIGN_TYPES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Template ID</span>
            <input
              name="template_id"
              value={formState.template_id}
              onChange={handleInputChange}
              required
              placeholder="template-phishing-01"
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400/50"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Schedule (optional)</span>
          <div className="relative">
            <input
              type="datetime-local"
              name="scheduled_at"
              value={formState.scheduled_at}
              onChange={handleInputChange}
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400/50"
            />
            <CalendarClock className="pointer-events-none absolute right-3 top-3.5 size-4 text-slate-500" />
          </div>
        </label>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button type="submit" className="h-10 bg-emerald-500 text-slate-950 hover:bg-emerald-400" disabled={status.state === "loading"}>
            {status.state === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
            Create Campaign
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900"
            onClick={() => router.push(`/campaign?org_id=${orgId}`)}
          >
            Cancel
          </Button>
        </div>

        {status.state !== "idle" ? (
          <div
            className={`mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
              status.state === "error"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                : status.state === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            {status.state === "error" ? (
              <AlertCircle className="size-4" />
            ) : status.state === "success" ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            {status.message}
          </div>
        ) : null}
      </form>

      <aside className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
        <p className="text-lg font-semibold text-slate-100">Payload Preview</p>
        <p className="mt-1 text-sm text-slate-400">This JSON is sent to POST /api/v1/campaigns.</p>

        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-xs leading-5 text-slate-300">
{JSON.stringify(payloadPreview, null, 2)}
        </pre>
      </aside>
    </section>
  );
}
