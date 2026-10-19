export function expectedRequestOrigin(request: Request, env: { APP_ORIGIN?: string; VERCEL?: string } = { APP_ORIGIN: process.env.APP_ORIGIN, VERCEL: process.env.VERCEL }): string {
  if (env.APP_ORIGIN) return env.APP_ORIGIN;
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  // Vercel terminates HTTPS at its proxy; the internal request can use HTTP.
  return `${env.VERCEL === "1" ? "https:" : url.protocol}//${host}`;
}
