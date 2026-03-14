"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertTriangle,
    Brain,
    Link2,
    Lock,
    Milestone,
    Sparkles,
    ShieldAlert,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

const insightPillars = [
    {
        title: "Clicked Phishing Links",
        description:
            "AI will explain why each clicked link looked convincing and which red flags were missed.",
        icon: Link2,
    },
    {
        title: "Credential Entry Attempts",
        description:
            "AI will break down what triggered trust, then suggest safer verification habits for next time.",
        icon: Lock,
    },
    {
        title: "Risk Pattern Coaching",
        description:
            "AI will summarize repeated mistakes and give a personal prevention plan in plain language.",
        icon: Brain,
    },
];

const questionStarters = [
    "Why did I click this phishing link?",
    "What should I check before entering credentials?",
    "Show me my repeated security mistakes.",
    "How can I avoid this attack pattern next time?",
];

const featureItems = [
    {
        title: "Behavior Trace Mapping",
        detail:
            "AI connects clicked links, credential attempts, and timeline events into one clear behavior story.",
        icon: Milestone,
        tone: "success",
    },
    {
        title: "Failure Pattern Detection",
        detail:
            "AI identifies repeated risky actions and highlights where users are most vulnerable.",
        icon: ShieldAlert,
        tone: "warning",
    },
    {
        title: "Contextual Coaching",
        detail:
            "AI delivers practical, user-specific prevention steps instead of generic awareness advice.",
        icon: Sparkles,
        tone: "default",
    },
];

const badgeToneClass = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    default: "border-breach-accent-2/30 bg-breach-accent-2/10 text-indigo-200",
};

const AiPanel = ({ highlightedCampaignTitle, clickRate, compromiseRate }) => {
    const [question, setQuestion] = useState("");
    const [reply, setReply] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const coachingSummary = useMemo(() => {
        const click = Number.isFinite(Number(clickRate)) ? Number(clickRate) : 0;
        const compromise = Number.isFinite(Number(compromiseRate)) ? Number(compromiseRate) : 0;

        if (click >= 40 || compromise >= 20) {
            return "High urgency: prioritize link-verification and credential-check habits this week.";
        }

        if (click >= 20 || compromise >= 10) {
            return "Moderate risk: reinforce sender checks and second-step validation before login actions.";
        }

        return "Baseline is stable: keep practicing suspicious-link triage to maintain low exposure.";
    }, [clickRate, compromiseRate]);

    function getBackendBaseUrl() {
        return process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
    }

    function buildQuestionPayload(rawQuestion) {
        const campaignLabel = highlightedCampaignTitle || "No highlighted campaign";
        const click = Number.isFinite(Number(clickRate)) ? Number(clickRate).toFixed(1) : "0.0";
        const compromise = Number.isFinite(Number(compromiseRate)) ? Number(compromiseRate).toFixed(1) : "0.0";

        return [
            `Campaign context: ${campaignLabel}`,
            `Click rate: ${click}%`,
            `Compromise rate: ${compromise}%`,
            "Please provide concise, practical coaching and prevention steps.",
            `User question: ${rawQuestion.trim()}`,
        ].join("\n");
    }

    async function askRag(questionText) {
        const trimmed = questionText.trim();
        if (!trimmed || isLoading) {
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${getBackendBaseUrl()}/api/v1/chat/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: buildQuestionPayload(trimmed),
                    session_id: `dashboard-${(highlightedCampaignTitle || "general").toLowerCase().replaceAll(" ", "-")}`,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.detail || "Failed to get AI guidance");
            }

            setReply(data?.reply || "No response from AI service.");
        } catch (requestError) {
            setError(requestError?.message || "Unable to connect to AI service right now.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative overflow-hidden rounded-2xl bg-breach-bg text-breach-text">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-breach-aura" />
                <div className="absolute -left-18 top-10 h-44 w-44 rounded-full bg-breach-accent/18 blur-3xl" />
                <div className="absolute right-0 top-14 h-56 w-56 rounded-full bg-breach-accent-2/14 blur-3xl" />
            </div>

            <div className="relative z-10 p-4 sm:p-6">
                <section className="flex w-full flex-col items-start gap-5 pb-6 text-left sm:gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                        <Badge className="border-breach-accent/35 bg-breach-accent/10 px-3 py-1 text-[11px] tracking-[0.16em] text-emerald-200 uppercase">
                            AI Security Coach
                        </Badge>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.42, delay: 0.06, ease: "easeOut" }}
                        className="max-w-3xl text-2xl leading-tight font-semibold tracking-[-0.03em] text-breach-text sm:text-3xl"
                    >
                        AI Coach
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.36, delay: 0.12 }}
                        className="max-w-3xl text-sm leading-relaxed text-breach-muted sm:text-base"
                    >
                        Ask AI why users failed a phishing simulation and get targeted prevention guidance based on link clicks, credential entry behavior, and campaign context.
                    </motion.p>

                    <div className="w-full rounded-xl border border-breach-border/80 bg-breach-panel/75 p-3 text-xs text-breach-muted sm:text-sm">
                        <p className="text-breach-text">
                            <span className="font-semibold">Highlighted campaign:</span>{" "}
                            {highlightedCampaignTitle || "No campaign selected"}
                        </p>
                        <p className="mt-1 leading-relaxed">{coachingSummary}</p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.34, delay: 0.2 }}
                        className="flex flex-wrap items-center gap-3"
                    >
                        <Button
                            onClick={() => askRag(question || questionStarters[0])}
                            disabled={isLoading}
                            className="h-10 rounded-full bg-breach-accent px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading ? "Thinking..." : "Ask AI Now"}
                        </Button>
                    </motion.div>
                </section>

                <section className="grid w-full gap-3 pb-6 sm:grid-cols-2 lg:grid-cols-3">
                    {insightPillars.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                transition={{ duration: 0.34, delay: 0.1 + index * 0.06 }}
                            >
                                <Card className="h-full border-breach-border/80 bg-breach-panel/75 shadow-(--shadow-breach-glow)">
                                    <CardHeader className="space-y-3">
                                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-breach-accent/25 bg-breach-accent/10 text-emerald-300">
                                            <Icon className="size-5" />
                                        </div>
                                        <CardTitle className="text-base text-breach-text sm:text-lg">
                                            {item.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="leading-relaxed text-breach-muted">
                                            {item.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </section>

                <section className="grid w-full gap-4 lg:grid-cols-[1.45fr_1fr]">
                    <Card className="border-breach-border bg-breach-panel/80">
                        <CardHeader>
                            <CardTitle className="text-lg text-breach-text sm:text-xl">
                                Ask AI About Your Behavior
                            </CardTitle>
                            <CardDescription className="text-breach-muted">
                                Connected to your LangChain RAG backend for campaign-aware phishing coaching.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-2xl border border-breach-border/80 bg-breach-surface/80 p-4 sm:p-5">
                                <label
                                    htmlFor="ai-question"
                                    className="mb-2 block text-sm font-medium text-breach-text"
                                >
                                    Your Question
                                </label>
                                <textarea
                                    id="ai-question"
                                    placeholder="Example: Why did I trust the last campaign email and click the link?"
                                    rows={5}
                                    value={question}
                                    onChange={(event) => setQuestion(event.target.value)}
                                    className="w-full resize-none rounded-xl border border-breach-border bg-breach-bg px-3 py-3 text-sm text-breach-text outline-none ring-0 placeholder:text-breach-muted/80 focus:border-breach-accent/50"
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {questionStarters.map((starter) => (
                                        <button
                                            type="button"
                                            key={starter}
                                            onClick={() => {
                                                setQuestion(starter);
                                                askRag(starter);
                                            }}
                                            disabled={isLoading}
                                            className="rounded-full border border-breach-border bg-breach-panel px-3 py-1.5 text-xs text-breach-muted transition hover:border-breach-accent/40 hover:text-breach-text"
                                        >
                                            {starter}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button
                                        onClick={() => askRag(question)}
                                        disabled={isLoading || !question.trim()}
                                        className="h-10 rounded-full bg-breach-accent px-5 text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isLoading ? "Thinking..." : "Get AI Guidance"}
                                    </Button>
                                </div>

                                {error ? (
                                    <p className="mt-3 text-sm text-rose-300">{error}</p>
                                ) : null}

                                {reply ? (
                                    <div className="mt-4 rounded-xl border border-breach-accent/25 bg-breach-bg p-4">
                                        <p className="text-xs uppercase tracking-[0.12em] text-breach-muted">AI Response</p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-breach-text">
                                            {reply}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-breach-border bg-breach-panel/80">
                        <CardHeader>
                            <CardTitle className="text-lg text-breach-text">AI Integration Features</CardTitle>
                            <CardDescription className="text-breach-muted">
                                What this AI module is built to do once backend endpoints are attached.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {featureItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.title}
                                        className="rounded-xl border border-breach-border/70 bg-breach-surface/65 p-3"
                                    >
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 text-sm font-medium text-breach-text">
                                                <Icon className="size-4 text-breach-accent" />
                                                <span>{item.title}</span>
                                            </div>
                                            <span
                                                className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeToneClass[item.tone]}`}
                                            >
                                                Ready
                                            </span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-breach-muted">{item.detail}</p>
                                    </div>
                                );
                            })}
                            <div className="mt-2 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-xs leading-relaxed text-amber-100">
                                <div className="flex items-center gap-2 font-medium text-amber-200">
                                    <AlertTriangle className="size-4" />
                                    Live backend dependency
                                </div>
                                <p className="mt-1 text-amber-100/85">
                                    If the RAG API is unavailable, the panel will show a recoverable error and keep the draft question.
                                </p>
                            </div>
                            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-xs leading-relaxed text-emerald-100">
                                <p className="font-medium text-emerald-200">Coverage</p>
                                <p className="mt-1">
                                    Includes clicked-link behavior, entered-credential context, and repeat-mistake coaching.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
};

export default AiPanel;