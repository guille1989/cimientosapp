import { requireRole } from "@/lib/require-role";
export default async function PromoterLayout({ children }: { children: React.ReactNode }) { await requireRole("PROMOTER"); return children; }
