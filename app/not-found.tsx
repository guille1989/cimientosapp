import Link from "next/link";
export default function NotFound() { return <div className="access-state"><p className="eyebrow">404 · Esta página no existe</p><h1>Volvamos a los cimientos.</h1><p>La dirección no está disponible o el proyecto aún no se ha publicado.</p><Link className="button button-primary" href="/proyectos">Explorar proyectos</Link></div>; }
