import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Redline AI, the official assistant for Redline Markets — an F1 play-money prediction market for the 2026 Formula 1 season.

You help users with:
- How the platform works (buying/selling YES or NO shares, GP Coins, leaderboard, markets)
- Formula 1 knowledge: teams, drivers, race formats, rules, tyre compounds, DRS, safety car, pitstops, qualifying format
- 2026 F1 season calendar and races
- Market strategy tips (how prediction markets work, probability, reading the YES/NO bars)
- General F1 trivia and history

Platform rules you know:
- New users get 1,000 GP Coins for free on sign-up
- Users buy YES or NO shares on race outcomes (Quali Winner, Race Winner, Safety Car, Fastest Lap, Driver of the Day, DNF/Retirement, Pit Stop Strategy, Other)
- Share prices reflect market probability (e.g. 60% YES means the market thinks there is a 60% chance of YES)
- Price is calculated as: yesShares / (yesShares + noShares)
- Cost of shares = price × 100 × quantity (in GP Coins)
- Users can also create their own markets — submitted for admin approval before going live
- The leaderboard ranks users by GP Coin balance
- Live telemetry is powered by the OpenF1 API during race weekends
- This is play-money only — no real money involved

Keep answers concise, enthusiastic about F1, and helpful. Use F1 terminology naturally. If asked something outside F1 or the platform, politely redirect.`;

const memoryRateLimit = new Map<string, { count: number; timestamp: number }>();

function rateLimit(ip: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const entry = memoryRateLimit.get(ip);
  if (!entry || now - entry.timestamp > windowMs) {
    memoryRateLimit.set(ip, { count: 1, timestamp: now });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

type Message = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return NextResponse.json(
      { error: "AI service is not configured yet." },
      { status: 503 }
    );
  }

  let messages: Message[];
  try {
    const body = await request.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Keep last 10 messages, map to Gemini format (assistant → model)
  const contents = messages.slice(-10).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-latest",
  ];

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { maxOutputTokens: 512, temperature: 0.75 },
  });

  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body }
      );

      const data = await res.json();

      if (!res.ok) {
        const code = data?.error?.status;
        // If quota exhausted or not found, try next model
        if (code === "RESOURCE_EXHAUSTED" || code === "NOT_FOUND") {
          console.warn(`[chat] ${model} unavailable (${code}), trying next…`);
          continue;
        }
        // Invalid key or other hard error — no point retrying
        console.error(`[chat/gemini] ${res.status}`, data?.error?.message);
        const userMsg =
          code === "INVALID_ARGUMENT"
            ? "Invalid API key. Please check your GEMINI_API_KEY in .env.local."
            : "AI service error. Please try again.";
        return NextResponse.json({ error: userMsg }, { status: 502 });
      }

      const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!text) continue;

      return NextResponse.json({ reply: text, model });
    } catch (err) {
      console.error(`[chat] ${model} fetch error`, err);
      continue;
    }
  }

  return NextResponse.json(
    { error: "All AI models are currently unavailable. Please try again later." },
    { status: 502 }
  );
}
