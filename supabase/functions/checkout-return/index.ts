import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED = /^(elsproperties|exp|exps):\/\/[^\s]{1,500}$/i;

function page(next: string) {
  const href = next.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const js = JSON.stringify(next);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ELS Properties</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0f1a2c; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-align: center; padding: 32px; }
    a { color: #cfa75c; font-weight: 600; }
    p { max-width: 320px; line-height: 1.5; }
  </style>
</head>
<body>
  <div>
    <p>Payment updated. Returning you to the ELS Properties app…</p>
    <p><a href="${href}">Tap here if the app doesn't open</a></p>
  </div>
  <script>location.replace(${js});</script>
</body>
</html>`;
}

Deno.serve((req) => {
  const next = new URL(req.url).searchParams.get("next") ?? "";
  if (!ALLOWED.test(next)) return new Response("Invalid return URL", { status: 400 });

  return new Response(page(next), {
    headers: { "Content-Type": "text/html; charset=utf-8", Location: next },
    status: 200,
  });
});
