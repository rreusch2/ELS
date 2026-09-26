import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

function formatUsd(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");
  if (!apiKey || !from) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) console.error("Resend error", res.status, await res.text());
}

async function notifyPaid(applicationId: string) {
  const { data: app } = await supabase
    .from("applications")
    .select("id, first_name, last_name, email, adult_count, fee_total_cents, listing:listings(title, address_line1)")
    .eq("id", applicationId)
    .single();
  const { data: settings } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  if (!app || !settings) return;

  const listing = app.listing as { title: string; address_line1: string } | null;
  const property = listing ? `${escapeHtml(listing.title)} (${escapeHtml(listing.address_line1)})` : "your selected property";
  const name = escapeHtml(app.first_name);

  await sendEmail(
    app.email,
    `We received your application – ${settings.company_name}`,
    `<p>Hi ${name},</p>
     <p>Thank you for applying for ${property}. Your application fee of ${formatUsd(app.fee_total_cents)} was received and your application is now in our review queue.</p>
     <p>Most applications are reviewed within 2–3 business days. We'll reach out by email or phone if we need anything else.</p>
     <p>Questions? Call us at ${escapeHtml(settings.phone)} or reply to this email.</p>
     <p>— ${escapeHtml(settings.company_name)}</p>`,
  );

  const officeEmail = Deno.env.get("OFFICE_EMAIL") ?? settings.email;
  await sendEmail(
    officeEmail,
    `New rental application: ${app.first_name} ${app.last_name}`,
    `<p>A new paid application was submitted for ${property}.</p>
     <p><strong>Applicant:</strong> ${escapeHtml(app.first_name)} ${escapeHtml(app.last_name)} (${escapeHtml(app.email)})<br/>
     <strong>Adults:</strong> ${app.adult_count}<br/>
     <strong>Fee paid:</strong> ${formatUsd(app.fee_total_cents)}</p>
     <p>Review it in the admin dashboard.</p>`,
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const apiKey = Deno.env.get("STRIPE_SECRET_KEY");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!apiKey || !secret) {
    console.error("STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not configured");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const stripe = new Stripe(apiKey, { httpClient: Stripe.createFetchHttpClient() });
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secret, undefined, cryptoProvider);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const applicationId = session.metadata?.application_id ?? session.client_reference_id;

      if (session.payment_status === "paid" && applicationId) {
        const { data: updated, error } = await supabase
          .from("applications")
          .update({
            status: "submitted",
            paid_at: new Date().toISOString(),
            stripe_session_id: session.id,
            stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          })
          .eq("id", applicationId)
          .eq("status", "pending_payment")
          .select("id");
        if (error) throw error;

        if (updated && updated.length > 0) await notifyPaid(applicationId);
      }
    }
  } catch (err) {
    console.error("Webhook handling failed", err);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
