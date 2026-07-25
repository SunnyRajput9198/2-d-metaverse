import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://aicredits.in/v1"
});

export async function getAIResponse(prompt: string): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an AI assistant in MetaSpace, a 2D virtual spatial collaboration platform.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            max_tokens: 500
        });

        const reply = response.choices[0]?.message?.content?.trim();
        return reply ?? "No response from AI.";
    } catch (err) {
        console.error("OpenAI API Error:", err);
        return `Error: ${(err as Error).message}`;
    }
}
