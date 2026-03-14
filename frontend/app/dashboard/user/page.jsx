"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, Mail, MousePointer2, AlertTriangle, History } from "lucide-react";
import OpsLayout from "@/components/ops/layout";
import { Badge } from "@/components/ui/badge";
import { loadUserSnapshot, formatDate } from "@/lib/backend";

export default function UserDashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Get token from cookie
      const cookies = document.cookie.split("; ");
      const authCookie = cookies.find(c => c.startsWith("auth_session="));
      const token = authCookie ? authCookie.split("=")[1] : null;
      
      if (token) {
        const data = await loadUserSnapshot(token);
        setStats(data);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const riskLevel = stats?.risk_score > 0.7 ? "High" : stats?.risk_score > 0.4 ? "Medium" : "Low";
  const riskColor = riskLevel === "High" ? "text-red-400" : riskLevel === "Medium" ? "text-amber-400" : "text-emerald-400";

  return (
    <OpsLayout
      activeSection="dashboard"
      title="Security Posture"
      subtitle="Monitor your simulation history and security awareness metrics."
      role="user"
      orgId="personal"
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<ShieldCheck className="size-5 text-cyan-400" />}
          label="Risk Profile" 
          value={isLoading ? "..." : riskLevel}
          subValue="Real-time score"
          highlight={riskColor}
        />
        <StatCard 
          icon={<Mail className="size-5 text-violet-400" />}
          label="Simulations" 
          value={isLoading ? "..." : stats?.total_simulations ?? 0}
          subValue="Total emails received"
        />
        <StatCard 
          icon={<MousePointer2 className="size-5 text-amber-400" />}
          label="Link Clicks" 
          value={isLoading ? "..." : stats?.clicks ?? 0}
          subValue="Mock phishing interactions"
        />
        <StatCard 
          icon={<AlertTriangle className="size-5 text-red-400" />}
          label="Compromises" 
          value={isLoading ? "..." : stats?.credential_submissions ?? 0}
          subValue="Credential submissions"
        />
      </div>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/75 p-6"
      >
        <div className="mb-6 flex items-center gap-2">
          <History className="size-5 text-slate-400" />
          <h2 className="text-xl font-bold text-slate-100">Recent Activity</h2>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading activity logs...</div>
        ) : !stats?.recent_events?.length ? (
          <div className="py-12 text-center text-slate-500 text-sm italic">
            No recent security simulation events recorded.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {stats.recent_events.map((event, idx) => (
                  <tr key={idx} className="transition hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-slate-200">Simulation Response</td>
                    <td className="px-4 py-3">
                      <code className="rounded-md bg-slate-800 px-1.5 py-0.5 text-xs text-cyan-300">
                        {event.event_type.replace('_', ' ')}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(event.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="muted">Logged</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
    </OpsLayout>
  );
}

function StatCard({ icon, label, value, subValue, highlight = "text-slate-100" }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-slate-800 bg-slate-950/75 p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className={`text-3xl font-bold tracking-tight ${highlight}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {subValue}
      </div>
    </motion.div>
  );
}