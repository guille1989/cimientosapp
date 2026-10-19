import { Suspense } from "react";
import { PromoterPortal } from "@/components/promoter";
import { LoadingState } from "@/components/ui";
export default function Page() { return <Suspense fallback={<LoadingState />}><PromoterPortal /></Suspense>; }
