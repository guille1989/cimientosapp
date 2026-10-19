"use client";
import { Button, EmptyState } from "@/components/ui";
export default function Error({ reset }: { error: Error; reset: () => void }) { return <EmptyState title="No hemos podido abrir esta pantalla" description="Puedes reintentar la carga. Las operaciones confirmadas se conservan en la base de datos."><Button onClick={reset}>Reintentar</Button></EmptyState>; }
