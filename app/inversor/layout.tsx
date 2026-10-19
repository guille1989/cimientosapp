import type { ReactNode } from "react";
import { RoleGate } from "@/components/ui";
import { requireRole } from "@/lib/require-role";
import "@/components/investor.css";

export default async function InvestorLayout({ children }: { children: ReactNode }) {
  await requireRole("INVESTOR");
  return <RoleGate role="INVESTOR"><div className="investor-content">{children}</div></RoleGate>;
}
