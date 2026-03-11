import { NextResponse } from "next/server";
import Stripe from "stripe";

const memoryRateLimit = new Map<string, { count: number; timestamp: number }>();

function rateLimit(ip: string, limit = 10, windowMs = 60_000) {
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

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 100) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "GP Coins" },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${request.headers.get("origin")}/wallet?success=true&amount=${amount}`,
    cancel_url: `${request.headers.get("origin")}/wallet?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
