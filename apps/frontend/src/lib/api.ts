import { supabase } from "@/integrations/supabase/client";
import type { DailyReview, Mission, PlanBlock, ReviewInput } from "@aroha/shared";

export type { DailyReview, Mission, PlanBlock, ReviewInput };

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function askCoach(input: { data: { message: string } }): Promise<{ reply: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/coach`, {
    method: "POST",
    headers,
    body: JSON.stringify(input.data),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "AROHA AI couldn't reply. Try again in a moment.");
  }
  return { reply: body.reply };
}

export async function generateReview(input: { data: ReviewInput }): Promise<DailyReview> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/review`, {
    method: "POST",
    headers,
    body: JSON.stringify(input.data),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "AROHA AI could not build your review. Please try again.");
  }
  return body.data;
}
