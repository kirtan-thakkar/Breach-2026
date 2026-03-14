"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, Clock3, FlaskConical, LoaderCircle, Mail, MessageCircle, Plus, Send, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getBackendBaseUrl } from "@/lib/backend";

const CAMPAIGN_TYPES = [
  { value: "phishing", label: "Phishing" },
  { value: "credential", label: "Credential" },
  { value: "training", label: "Training" },
];

function toDateInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fromDateInputValue(value) {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return undefined;
  }

  const parsedDate = new Date(year, month - 1, day);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
}

function buildScheduledIso(dateValue, timeValue) {
  const scheduledDate = fromDateInputValue(dateValue);
  if (!scheduledDate) {
    return null;
  }

  const [hoursRaw, minutesRaw] = (timeValue || "09:00").split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  scheduledDate.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);

  return scheduledDate.toISOString();
}

function formatScheduleLabel(dateValue, timeValue) {
  const scheduledDate = fromDateInputValue(dateValue);
  if (!scheduledDate) {
    return "Pick campaign launch date";
  }

  const dateLabel = scheduledDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${dateLabel} at ${timeValue || "09:00"}`;
}

export default function CampaignForm({ orgId, token }) {
  const router = useRouter();

  const [formState, setFormState] = useState({
    name: "",
    description: "",
    type: "phishing",
    template_id: "template-phishing-01",
    scheduled_date: "",
    scheduled_time: "09:00",
  });
  const [targets, setTargets] = useState([]);
  const [selectedTargetIds, setSelectedTargetIds] = useState([]);
  const [targetsState, setTargetsState] = useState({ loading: true, error: "" });
  const [manualEmailInput, setManualEmailInput] = useState("");
  const [manualEmails, setManualEmails] = useState([]);
  const [testEmailInput, setTestEmailInput] = useState("");
  const [testEmailStatus, setTestEmailStatus] = useState({ state: "idle", message: "" });
  const [testWhatsAppInput, setTestWhatsAppInput] = useState("");
  const [testWhatsAppStatus, setTestWhatsAppStatus] = useState({ state: "idle", message: "" });
  const [whatsAppRedirecting, setWhatsAppRedirecting] = useState(false);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const payloadPreview = useMemo(() => {
    return {
      name: formState.name,
      description: formState.description || null,
      type: formState.type,
      template_id: formState.template_id,
      organization_id: orgId,
      scheduled_at: buildScheduledIso(formState.scheduled_date, formState.scheduled_time),
    };
  }, [formState, orgId]);

  useEffect(() => {
    let isCancelled = false;

    async function loadTargets() {
      if (!token) {
        if (!isCancelled) {
          setTargets([]);
          setTargetsState({ loading: false, error: "Admin session missing. Please log in again." });
        }
        return;
      }

      setTargetsState({ loading: true, error: "" });

      try {
        const response = await fetch(`${getBackendBaseUrl()}/api/v1/targets?org_id=${encodeURIComponent(orgId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody?.detail || "Failed to load targets");
        }

        const data = await response.json();

        if (!isCancelled) {
          const safeTargets = Array.isArray(data) ? data : [];
          setTargets(safeTargets);
          setSelectedTargetIds(safeTargets.map((entry) => entry.id).filter(Boolean));
          setTargetsState({ loading: false, error: "" });
        }
      } catch (error) {
        if (!isCancelled) {
          setTargets([]);
          setTargetsState({ loading: false, error: error instanceof Error ? error.message : "Unable to load targets." });
        }
      }
    }

    loadTargets();

    return () => {
      isCancelled = true;
    };
  }, [orgId, token]);

  const allSelected = targets.length > 0 && selectedTargetIds.length === targets.length;

  const totalRecipients = selectedTargetIds.length + manualEmails.length;

  function addManualEmail() {
    const email = manualEmailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return;
    if (manualEmails.includes(email)) {
      setManualEmailInput("");
      return;
    }
    setManualEmails((prev) => [...prev, email]);
    setManualEmailInput("");
  }

  function removeManualEmail(email) {
    setManualEmails((prev) => prev.filter((e) => e !== email));
  }

  async function handleTestEmail() {
    const email = testEmailInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setTestEmailStatus({ state: "error", message: "Enter a valid email address to test." });
      return;
    }
    if (!token) {
      setTestEmailStatus({ state: "error", message: "Admin session missing." });
      return;
    }
    setTestEmailStatus({ state: "loading", message: "Sending test email..." });
    try {
      const res = await fetch(`${getBackendBaseUrl()}/api/v1/campaigns/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTestEmailStatus({ state: "error", message: data?.detail || "Test email failed." });
        return;
      }
      setTestEmailStatus({ state: "success", message: data.message || `Test sent to ${email}` });
    } catch {
      setTestEmailStatus({ state: "error", message: "Unable to reach backend." });
    }
  }

  async function handleTestWhatsApp() {
    const phone = testWhatsAppInput.trim();
    if (!phone || phone.length < 6) {
      setTestWhatsAppStatus({ state: "error", message: "Enter a valid phone number." });
      return;
    }
    if (!token) {
      setTestWhatsAppStatus({ state: "error", message: "Admin session missing." });
      return;
    }
    setTestWhatsAppStatus({ state: "loading", message: "Preparing WhatsApp message..." });
    setWhatsAppRedirecting(false);
    try {
      const res = await fetch(`${getBackendBaseUrl()}/api/v1/campaigns/test-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone_number: phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTestWhatsAppStatus({ state: "error", message: data?.detail || "WhatsApp test failed." });
        return;
      }
      const whatsappUri = data?.whatsapp_uri;
      if (!whatsappUri) {
        setTestWhatsAppStatus({ state: "error", message: "WhatsApp URI missing in response." });
        return;
      }

      setWhatsAppRedirecting(true);
      setTestWhatsAppStatus({ state: "success", message: data.message || `Redirecting to WhatsApp for ${phone}` });
      setTimeout(() => {
        window.location.href = whatsappUri;
      }, 1200);
    } catch {
      setTestWhatsAppStatus({ state: "error", message: "Unable to reach backend." });
      setWhatsAppRedirecting(false);
    }
  }

  function toggleSelectAllTargets() {
    if (allSelected) {
      setSelectedTargetIds([]);
      return;
    }

    setSelectedTargetIds(targets.map((entry) => entry.id).filter(Boolean));
  }

  function toggleTargetSelection(targetId) {
    setSelectedTargetIds((previous) => {
      if (previous.includes(targetId)) {
        return previous.filter((id) => id !== targetId);
      }

      return [...previous, targetId];
    });
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  }

  function handleDateSelect(nextDate) {
    setFormState((previous) => ({
      ...previous,
      scheduled_date: nextDate ? toDateInputValue(nextDate) : "",
    }));
  }

  async function handleSubmit(event, launchNow = false) {
    event.preventDefault();

    if (!token) {
      setStatus({ state: "error", message: "Admin session missing. Please log in again." });
      return;
    }

    if (!formState.name.trim()) {
      setStatus({ state: "error", message: "Campaign name is required." });
      return;
    }

    setStatus({
      state: "loading",
      message: launchNow ? "Creating and launching campaign..." : "Creating campaign...",
    });

    try {
      const response = await fetch(`${getBackendBaseUrl()}/api/v1/campaigns/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

      const createdCampaign = await response.json();

      if (launchNow) {
        const launchResponse = await fetch(`${getBackendBaseUrl()}/api/v1/campaigns/${createdCampaign.id}/launch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ target_ids: selectedTargetIds, ad_hoc_emails: manualEmails }),
        });

        if (!launchResponse.ok) {
          const launchError = await launchResponse.json().catch(() => ({}));
          setStatus({
            state: "error",
            message: launchError?.detail || "Campaign created but launch failed.",
          });
          return;
        }

        const launchData = await launchResponse.json();
        setStatus({
          state: "success",
          message: launchData?.message || "Campaign launched. Simulation emails are being sent.",
        });
      } else {
        setStatus({ state: "success", message: "Campaign created successfully. Redirecting to campaign registry..." });
      }

      setTimeout(() => {
        router.push(`/campaign?org_id=${orgId}`);
      }, 800);
    } catch (error) {
      setStatus({ state: "error", message: "Unable to reach backend API. Check backend URL and CORS setup." });
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <form onSubmit={(event) => handleSubmit(event, false)} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
        <div>
          <p className="text-lg font-semibold text-slate-100">Campaign Configuration</p>
          <p className="text-sm text-slate-400">Create payloads that match the backend CampaignCreate schema.</p>
        </div>

        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Title</span>
          <input
            name="name"
            value={formState.name}
            onChange={handleInputChange}
            required
            placeholder="Q2 Finance Credential Exposure Drill"
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
            placeholder="Simulate a payroll-change request and route users to a remediation training page."
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
              placeholder="template-phishing-payroll-v2"
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400/50"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Schedule (optional)</span>
          <div className="grid gap-3 sm:grid-cols-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={`h-11 w-full justify-start border-slate-700 bg-slate-950 text-left text-sm  ${
                    formState.scheduled_date ? "text-slate-100" : "text-slate-400"
                  }`}
                >
                  <CalendarDays className="size-4" />
                  {formatScheduleLabel(formState.scheduled_date, formState.scheduled_time)}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-auto border-slate-700 bg-slate-950 p-0 text-slate-100"
              >
                <Calendar
                  mode="single"
                  selected={fromDateInputValue(formState.scheduled_date)}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="relative">
              <input
                type="time"
                name="scheduled_time"
                value={formState.scheduled_time}
                onChange={handleInputChange}
                disabled={!formState.scheduled_date}
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 pr-10 text-sm text-slate-100 outline-none transition focus:border-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Clock3 className="pointer-events-none absolute right-3 top-3.5 size-4 text-slate-500" />
            </div>
          </div>

          {formState.scheduled_date ? (
            <button
              type="button"
              onClick={() => setFormState((previous) => ({ ...previous, scheduled_date: "" }))}
              className="pt-1 text-left text-xs text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
            >
              Clear schedule
            </button>
          ) : null}
        </label>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button type="submit" className="h-10 bg-emerald-500 text-slate-950 hover:bg-emerald-400" disabled={status.state === "loading"}>
            {status.state === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
            Create Campaign
          </Button>
          <Button
            type="button"
            className="h-10 bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            disabled={status.state === "loading" || totalRecipients === 0}
            onClick={(event) => handleSubmit(event, true)}
          >
            {status.state === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : <Mail className="size-4" />}
            Create and Launch
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
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Users className="size-4 text-emerald-300" />
            Target Users ({selectedTargetIds.length}/{targets.length})
          </p>
          <p className="mt-1 text-xs text-slate-400">Create and Launch sends simulation emails to selected users only.</p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className="text-xs text-cyan-300 underline-offset-4 hover:underline"
              onClick={toggleSelectAllTargets}
              disabled={!targets.length || targetsState.loading}
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
            <p className="text-[11px] text-slate-500">Recipients: {selectedTargetIds.length}</p>
          </div>

          <div className="mt-2 max-h-36 overflow-auto rounded-lg border border-slate-800 bg-slate-950/80 p-2">
            {targetsState.loading ? <p className="text-xs text-slate-400">Loading target users...</p> : null}
            {!targetsState.loading && targetsState.error ? <p className="text-xs text-rose-300">{targetsState.error}</p> : null}
            {!targetsState.loading && !targetsState.error && !targets.length ? (
              <p className="text-xs text-slate-400">No targets found for this organization.</p>
            ) : null}
            {!targetsState.loading && !targetsState.error && targets.length
              ? targets.slice(0, 12).map((target) => (
                  <div key={target.id || target.email} className="border-b border-slate-800/80 py-1 last:border-0">
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 rounded border-slate-700 bg-slate-900 text-emerald-400"
                        checked={selectedTargetIds.includes(target.id)}
                        onChange={() => toggleTargetSelection(target.id)}
                      />
                      <span>
                        <p className="text-xs font-medium text-slate-200">{target.name || "Team Member"}</p>
                        <p className="text-[11px] text-slate-400">{target.email}{target.department ? ` · ${target.department}` : ""}</p>
                        {target.whatsapp_number ? <p className="text-[10px] text-emerald-400/70">📱 {target.whatsapp_number}</p> : null}
                      </span>
                    </label>
                  </div>
                ))
              : null}
          </div>
        </div>

        {/* Manual email entry */}
        <div className="rounded-xl border border-slate-700 bg-slate-950/90 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Mail className="size-4 text-cyan-300" />
            Add Recipients Manually
          </p>
          <p className="mt-1 text-xs text-slate-400">Enter any email address to include in this campaign launch.</p>
          <div className="mt-2 flex gap-2">
            <input
              type="email"
              value={manualEmailInput}
              onChange={(e) => setManualEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManualEmail())}
              placeholder="user@company.com"
              className="h-9 flex-1 rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-xs text-slate-100 outline-none transition focus:border-cyan-400/50"
            />
            <button
              type="button"
              onClick={addManualEmail}
              className="flex h-9 items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>
          {manualEmails.length > 0 ? (
            <div className="mt-2 max-h-28 overflow-auto rounded-lg border border-slate-800 bg-slate-950/80 p-1.5 space-y-1">
              {manualEmails.map((email) => (
                <div key={email} className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-slate-800/60">
                  <span className="text-xs text-slate-200">{email}</span>
                  <button type="button" onClick={() => removeManualEmail(email)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-[11px] text-slate-500">Total recipients: {totalRecipients} ({selectedTargetIds.length} from org + {manualEmails.length} manual)</p>
        </div>

        {/* Test email */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <FlaskConical className="size-4 text-amber-300" />
            Test Email Service
          </p>
          <p className="mt-1 text-xs text-slate-400">Send a test email to verify SMTP is configured correctly before launching.</p>
          <div className="mt-2 flex gap-2">
            <input
              type="email"
              value={testEmailInput}
              onChange={(e) => setTestEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleTestEmail())}
              placeholder="your@email.com"
              className="h-9 flex-1 rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-xs text-slate-100 outline-none transition focus:border-amber-400/50"
            />
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testEmailStatus.state === "loading"}
              className="flex h-9 items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
            >
              {testEmailStatus.state === "loading" ? <LoaderCircle className="size-3.5 animate-spin" /> : <FlaskConical className="size-3.5" />}
              Test
            </button>
          </div>
          {testEmailStatus.state !== "idle" ? (
            <p className={`mt-1.5 text-xs ${testEmailStatus.state === "error" ? "text-rose-300" : testEmailStatus.state === "success" ? "text-emerald-300" : "text-slate-400"}`}>
              {testEmailStatus.message}
            </p>
          ) : null}
        </div>

        {/* Test WhatsApp */}
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Send className="size-4 text-green-300" />
            Test WhatsApp Service (Demo)
          </p>
          <p className="mt-1 text-xs text-slate-400">Enter number and we will open WhatsApp directly with a random message.</p>

          {whatsAppRedirecting ? (
            <div className="mt-3 rounded-lg border border-green-300/20 bg-green-50/5 p-4 text-center">
              <div className="mb-3 flex items-center justify-center gap-2">
                <MessageCircle className="size-8 text-green-400" />
                <ArrowRight className="size-5 animate-bounce text-green-400" />
                <div className="flex size-8 items-center justify-center rounded-full bg-green-200 text-base">W</div>
              </div>
              <h3 className="text-base font-bold text-green-200">Redirecting to WhatsApp...</h3>
              <p className="mt-1 text-xs text-green-300">Your request is being prepared and WhatsApp will open automatically.</p>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <div className="size-1.5 animate-bounce rounded-full bg-green-400"></div>
                <div className="size-1.5 animate-bounce rounded-full bg-green-400" style={{ animationDelay: "0.1s" }}></div>
                <div className="size-1.5 animate-bounce rounded-full bg-green-400" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex gap-2">
              <input
                type="tel"
                value={testWhatsAppInput}
                onChange={(e) => setTestWhatsAppInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleTestWhatsApp())}
                placeholder="+91 9876543210"
                className="h-9 flex-1 rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-xs text-slate-100 outline-none transition focus:border-green-400/50"
              />
              <button
                type="button"
                onClick={handleTestWhatsApp}
                disabled={testWhatsAppStatus.state === "loading"}
                className="flex h-9 items-center gap-1 rounded-lg border border-green-500/40 bg-green-500/10 px-3 text-xs font-medium text-green-200 transition hover:bg-green-500/20 disabled:opacity-50"
              >
                {testWhatsAppStatus.state === "loading" ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                Send
              </button>
            </div>
          )}

          {testWhatsAppStatus.state !== "idle" ? (
            <p className={`mt-1.5 text-xs ${testWhatsAppStatus.state === "error" ? "text-rose-300" : testWhatsAppStatus.state === "success" ? "text-emerald-300" : "text-slate-400"}`}>
              {testWhatsAppStatus.message}
            </p>
          ) : null}
        </div>

        <p className="text-lg font-semibold text-slate-100">Payload Preview</p>
        <p className="mt-1 text-sm text-slate-400">This JSON is sent to POST /api/v1/campaigns.</p>

        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-xs leading-5 text-slate-300">
{JSON.stringify(payloadPreview, null, 2)}
        </pre>
      </aside>
    </section>
  );
}
