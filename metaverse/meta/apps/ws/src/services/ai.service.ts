import OpenAI from "openai";

let client: OpenAI | undefined;

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("AI is not configured. Set OPENAI_API_KEY on the WebSocket server.");
  }

  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function getAIResponse(prompt: string): Promise<string> {
  const response = await getClient().responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    instructions: "You are an AI assistant in MetaSpace, a 2D virtual spatial collaboration platform. Be helpful and concise.",
    input: prompt,
    max_output_tokens: 500,
    store: false,
  });

  const answer = response.output_text.trim();
  if (!answer) throw new Error("The AI service returned an empty response.");
  return answer;
}
