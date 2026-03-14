import { CheckCircle2 } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import CampaignForm from "@/components/campaign/form";
import OpsLayout from "@/components/ops/layout";
import { Button } from "@/components/ui/button";
import { getOrgIdFromParams } from "@/lib/backend";
import { getDashboardRouteForRole, resolveRoleFromCookieStore } from "@/lib/auth";

export default async function CreateCampaignPage({ searchParams }) {
  const params = await searchParams;
  const orgId = getOrgIdFromParams(params);
  const cookieStore = await cookies();
  const role = resolveRoleFromCookieStore(cookieStore);
  const token = cookieStore.get("auth_session")?.value;

  if (role !== "admin") {
    redirect(getDashboardRouteForRole(role) || "/login");
  }

  return (
    <OpsLayout
      activeSection="create-campaign"
      title="Create Campaign"
      subtitle="Configure and launch a backend-compatible simulation payload"
      orgId={orgId}
      generatedAt={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      actions={
        <Button className="h-10 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
          <CheckCircle2 className="size-4" />
          Ready to Launch
        </Button>
      }
      searchPlaceholder="Search templates, campaign history..."
    >
      <CampaignForm orgId={orgId} token={token} />
    </OpsLayout>
  );
}
