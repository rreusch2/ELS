import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOC_PATH_RE = /^[0-9a-f-]{36}\/[\w.\- ]{1,200}$/i;
const MAX_DATA_BYTES = 60_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

class BadRequest extends Error {}

function requireString(value: unknown, field: string, max = 200): string {
  if (typeof value !== "string" || !value.trim()) throw new BadRequest(`${field} is required`);
  if (value.length > max) throw new BadRequest(`${field} is too long`);
  return value.trim();
}

function getStripe() {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

function siteUrl(req: Request) {
  const configured = Deno.env.get("SITE_URL");
  if (configured) return configured.replace(/\/$/, "");
  const origin = req.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  throw new Error("SITE_URL is not configured");
}

/** App deep link (Expo Go or the installed iOS app) that Stripe should bounce back to. */
function mobileReturnBase(body: Record<string, unknown>): string | null {
  const value = typeof body.return_base_url === "string" ? body.return_base_url.trim() : "";
  if (!value) return null;
  if (!/^(elsproperties|exp|exps):\/\/[^\s]{1,400}$/i.test(value)) {
    throw new BadRequest("Invalid return URL");
  }
  return value.replace(/\/$/, "");
}

function checkoutRedirects(req: Request, applicationId: string, returnBase: string | null) {
  if (returnBase) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
    const bounce = (status: "success" | "canceled") => {
      const next = `${returnBase}?status=${status}&application=${applicationId}`;
      return `${supabaseUrl}/functions/v1/checkout-return?next=${encodeURIComponent(next)}`;
    };
    return { success_url: bounce("success"), cancel_url: bounce("canceled") };
  }
  const base = siteUrl(req);
  return {
    success_url: `${base}/apply/success?application=${applicationId}`,
    cancel_url: `${base}/apply/canceled?application=${applicationId}`,
  };
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

type Listing = { id: string; title: string; address_line1: string; city: string; state: string };

async function createCheckoutSession(
  req: Request,
  application: { id: string; email: string; adult_count: number; fee_per_applicant_cents: number },
  listing: Listing | null,
  returnBase: string | null,
) {
  const stripe = getStripe();
  const where = listing ? `${listing.address_line1}, ${listing.city}, ${listing.state}` : "ELS Properties";
  const redirects = checkoutRedirects(req, application.id, returnBase);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: application.email,
    client_reference_id: application.id,
    metadata: { application_id: application.id },
    payment_intent_data: {
      metadata: { application_id: application.id },
      description: `Rental application fee – ${where}`,
    },
    line_items: [
      {
        quantity: application.adult_count,
        price_data: {
          currency: "usd",
          unit_amount: application.fee_per_applicant_cents,
          product_data: {
            name: "Rental Application Fee",
            description: `${where} (per adult applicant)`,
          },
        },
      },
    ],
    success_url: redirects.success_url,
    cancel_url: redirects.cancel_url,
  });

  const { error } = await supabase
    .from("applications")
    .update({ stripe_session_id: session.id })
    .eq("id", application.id);
  if (error) throw error;

  return session.url;
}

async function handleSubmit(req: Request, body: Record<string, unknown>) {
  const returnBase = mobileReturnBase(body);
  const listingId = requireString(body.listing_id, "listing_id", 36);
  const applicant = (body.applicant ?? {}) as Record<string, unknown>;
  const firstName = requireString(applicant.first_name, "First name", 100);
  const lastName = requireString(applicant.last_name, "Last name", 100);
  const email = requireString(applicant.email, "Email", 320).toLowerCase();
  const phone = requireString(applicant.phone, "Phone", 50);
  if (!EMAIL_RE.test(email)) throw new BadRequest("Email address is invalid");

  const adultCount = Number(body.adult_count);
  if (!Number.isInteger(adultCount) || adultCount < 1 || adultCount > 10) {
    throw new BadRequest("Number of adult applicants must be between 1 and 10");
  }

  const desiredMoveIn = typeof body.desired_move_in === "string" && body.desired_move_in
    ? body.desired_move_in
    : null;
  if (desiredMoveIn && Number.isNaN(Date.parse(desiredMoveIn))) {
    throw new BadRequest("Desired move-in date is invalid");
  }

  const data = body.data && typeof body.data === "object" ? body.data : {};
  if (JSON.stringify(data).length > MAX_DATA_BYTES) throw new BadRequest("Application is too large");

  const documentPaths = Array.isArray(body.document_paths) ? body.document_paths : [];
  if (documentPaths.length > 10 || !documentPaths.every((p) => typeof p === "string" && DOC_PATH_RE.test(p))) {
    throw new BadRequest("Invalid document uploads");
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, title, address_line1, city, state, status")
    .eq("id", listingId)
    .maybeSingle();
  if (listingError) throw listingError;
  if (!listing || !["available", "pending"].includes(listing.status)) {
    throw new BadRequest("This property is not currently accepting applications");
  }

  const { data: settings, error: settingsError } = await supabase
    .from("site_settings")
    .select("application_fee_cents")
    .eq("id", 1)
    .single();
  if (settingsError) throw settingsError;

  const fee = settings.application_fee_cents;

  const { data: application, error: insertError } = await supabase
    .from("applications")
    .insert({
      listing_id: listing.id,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      desired_move_in: desiredMoveIn,
      adult_count: adultCount,
      fee_per_applicant_cents: fee,
      fee_total_cents: fee * adultCount,
      data,
      document_paths: documentPaths,
    })
    .select("id, email, adult_count, fee_per_applicant_cents")
    .single();
  if (insertError) throw insertError;

  const url = await createCheckoutSession(req, application, listing, returnBase);
  return json({ application_id: application.id, checkout_url: url });
}

async function handleRetry(req: Request, body: Record<string, unknown>) {
  const returnBase = mobileReturnBase(body);
  const applicationId = requireString(body.application_id, "application_id", 36);

  const { data: application, error } = await supabase
    .from("applications")
    .select("id, email, adult_count, fee_per_applicant_cents, status, listing:listings(id, title, address_line1, city, state)")
    .eq("id", applicationId)
    .maybeSingle();
  if (error) throw error;
  if (!application) throw new BadRequest("Application not found");
  if (application.status !== "pending_payment") {
    throw new BadRequest("This application has already been paid for");
  }

  const url = await createCheckoutSession(req, application, application.listing as Listing | null, returnBase);
  return json({ application_id: application.id, checkout_url: url });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    if (body?.action === "retry") return await handleRetry(req, body);
    return await handleSubmit(req, body ?? {});
  } catch (err) {
    if (err instanceof BadRequest) return json({ error: err.message }, 400);
    console.error("submit-application failed", err);
    return json({ error: "Something went wrong submitting your application. Please try again." }, 500);
  }
});
