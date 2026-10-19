import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";
import type { Role } from "./types";
export async function requireRole(role: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/acceso");
  if (user.role !== role) redirect(user.role === "ADMIN" ? "/admin" : user.role === "PROMOTER" ? "/promotor" : "/inversor");
  return user;
}
