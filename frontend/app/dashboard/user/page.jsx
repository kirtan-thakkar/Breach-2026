"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Bot, FileText, MessageSquare, UploadCloud } from "lucide-react";

import OpsLayout from "@/components/ops/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const INITIAL_SUMMARIES = [
  {
    id: "summary-1",
    title: "Q1 Expense Statement",
    confidence: 94,
    summary:
      "AI flagged two recurring subscription charges and categorized your top spending trend as software tooling.",
  },
  {
    id: "summary-2",
    title: "Portfolio Snapshot",
    confidence: 89,
    summary:
      "Risk exposure is moderate. Allocation is concentrated in two sectors and may need diversification.",
  },
];

export default function UserDashboardPage() {
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    "What changed in my spending patterns this month?",
    "Are there any unusual transactions?",
  ]);

  const docCount = uploadedDocs.length;
  const summaries = useMemo(() => INITIAL_SUMMARIES, []);

  function handleMockUpload(event) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) return;

    setUploadedDocs((previous) => [
      ...previous,
      ...files.map((file) => file.name),
    ]);

    event.target.value = "";
  }

  function handleSendMessage(event) {
    event.preventDefault();

    const message = chatInput.trim();

    if (!message) return;

    setChatHistory((previous) => [...previous, message]);
    setChatInput("");
  }

  return (
    <OpsLayout
      activeSection="dashboard"
      title="User Finance Workspace"
      subtitle="Upload documents, review AI summaries, and chat with your assistant."
      orgId="personal"
      generatedAt={new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
      actions={<Badge variant="muted">{docCount} docs uploaded</Badge>}
    >
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-slate-800 bg-slate-950/75 p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <UploadCloud className="size-4 text-cyan-300" />
            <h2 className="text-lg font-semibold text-slate-100">
              Upload Financial Documents
            </h2>
          </div>

          <label className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-10 text-center transition hover:border-cyan-400/45 hover:bg-slate-900">
            <input type="file" multiple className="hidden" onChange={handleMockUpload} />
            <span className="inline-flex size-11 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-500/10 text-cyan-200">
              <UploadCloud className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-100">
                Drop files or click to upload
              </p>
              <p className="mt-1 text-xs text-slate-400">
                PDF, CSV, XLSX supported for AI summarization
              </p>
            </div>
          </label>

          {uploadedDocs.length > 0 && (
            <ul className="mt-4 space-y-2">
              {uploadedDocs.map((docName, index) => (
                <li
                  key={`${docName}-${index}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-300"
                >
                  <FileText className="size-4 text-emerald-300" />
                  {docName}
                </li>
              ))}
            </ul>
          )}
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.06 }}
          className="rounded-2xl border border-slate-800 bg-slate-950/75 p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Bot className="size-4 text-violet-300" />
            <h2 className="text-lg font-semibold text-slate-100">
              AI Summaries
            </h2>
          </div>

          <div className="space-y-3">
            {summaries.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">
                    {item.title}
                  </p>
                  <Badge variant="muted">{item.confidence}% confidence</Badge>
                </div>

                <p className="mt-2 text-sm text-slate-300">{item.summary}</p>
              </article>
            ))}
          </div>
        </motion.article>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.1 }}
        className="rounded-2xl border border-slate-800 bg-slate-950/75 p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="size-4 text-amber-300" />
          <h2 className="text-lg font-semibold text-slate-100">
            Assistant Chat
          </h2>
        </div>

        <div className="mb-4 max-h-64 space-y-2 overflow-auto rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          {chatHistory.map((message, index) => (
            <p
              key={`${message}-${index}`}
              className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-200"
            >
              {message}
            </p>
          ))}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
            placeholder="Ask about your reports, trends, or anomalies..."
          />

          <Button
            type="submit"
            className="h-11 rounded-xl bg-cyan-400 text-slate-950 hover:bg-cyan-300"
          >
            Send
          </Button>
        </form>
      </motion.section>
    </OpsLayout>
  );
}