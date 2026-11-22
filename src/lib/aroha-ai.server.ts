import { GatewayError, streamResponse, type ResponsesInputItem } from "@lovable.dev/ai-gateway";

export async function arohaText(instructions: string, input: string | ResponsesInputItem[], json = false): Promise<string> {
  try {
    const stream = await streamResponse({
      model: "openai/gpt-6-astra",
      instructions,
      input,
      reasoning: { effort: "low" },
      ...(json ? { text: { format: { type: "json_object" as const } } } : {}),
    });
    let text = "";
    let complete = false;
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") text += event.delta;
      if (event.type === "response.refusal.done") throw new Error("AROHA AI cannot help with that request.");
      if (event.type === "response.completed") complete = true;
      if (event.type === "response.incomplete") throw new Error("AROHA AI could not finish. Please try again.");
    }
    if (!complete || !text.trim()) throw new Error("AROHA AI returned no answer. Please try again.");
    return text.trim();
  } catch (error) {
    if (error instanceof GatewayError) {
      console.error("[aroha-ai]", { code: error.code, status: error.httpStatus, ids: error.ids, recovery: error.recovery, remote: error.remote });
      if (error.code === "payment_required") throw new Error("AI credits are used up. Add credits to continue.");
      if (error.code === "permission_denied") throw new Error("The selected AI model is blocked by workspace settings. An owner must allow it before AI can respond.");
      if (error.code === "rate_limited") throw new Error("AROHA AI is busy. Please wait a minute before trying again.");
      throw new Error("AROHA AI is unavailable right now. Your input is kept; please try again later.");
    }
    throw error;
  }
}