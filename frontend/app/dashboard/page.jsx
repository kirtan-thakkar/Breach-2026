import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDashboardRouteForRole, resolveRoleFromCookieStore } from "@/lib/auth";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const role = resolveRoleFromCookieStore(cookieStore);
  const route = getDashboardRouteForRole(role);

  redirect(route || "/login");
}
