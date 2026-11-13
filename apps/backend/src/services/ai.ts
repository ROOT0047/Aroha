import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { env } from "../config/env";

export function getAiApiKey(): string {
  const key = env.GEMINI_API_KEY || env.OPENAI_API_KEY || env.AI_API_KEY;
  if (!key) {
    throw new Error(
      "Missing AI API key. Please set GEMINI_API_KEY or OPENAI_API_KEY in your environment.",
    );
  }
  return key;
}

export function createAiProvider(apiKey: string) {
  const isGoogleKey = apiKey.startsWith("AIza") || !!env.GEMINI_API_KEY;

  if (isGoogleKey) {
    return createOpenAICompatible({
      name: "google",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey,
    });
  }

  return createOpenAICompatible({
    name: "openai",
    baseURL: env.AI_BASE_URL || "https://api.openai.com/v1",
    apiKey,
  });
}
