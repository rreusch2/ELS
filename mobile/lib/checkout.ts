import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export function appReturnUrl() {
  return Linking.createURL("apply/return");
}

export async function openCheckout(checkoutUrl: string): Promise<"success" | "canceled" | "dismissed"> {
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, appReturnUrl());
  if (result.type !== "success") return "dismissed";
  const status = Linking.parse(result.url).queryParams?.status;
  return status === "canceled" ? "canceled" : "success";
}

export async function invokeApplication(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("submit-application", {
    body: { ...body, return_base_url: appReturnUrl() },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? "We couldn't submit your application.");
    }
    throw error;
  }
  return data as { application_id: string; checkout_url: string };
}
