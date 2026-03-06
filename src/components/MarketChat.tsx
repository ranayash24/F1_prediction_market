"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useMarket } from "@/lib/market-context";

type ChatMessage = {
  id: string;
  marketId: string;
  userName: string;
  message: string;
  createdAt: string;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8081";

export default function MarketChat({ marketId }: { marketId: string }) {
  const { state } = useMarket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const latestMessagesRef = useRef<ChatMessage[]>([]);

  const displayName = useMemo(() => {
    if (state.user?.name) return state.user.name;
    if (state.user?.email) return state.user.email.split("@")[0];
    return "Guest";
  }, [state.user]);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/markets/${marketId}/chat`);
        const data = (await response.json()) as ChatMessage[];
        if (active && Array.isArray(data)) {
          setMessages(data.slice().reverse());
        }
      } catch {
        if (active) setMessages([]);
      }
    };

    loadMessages();

    const client = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}/ws`) as WebSocket,
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/markets/${marketId}/chat`, (message) => {
          try {
            const payload = JSON.parse(message.body) as ChatMessage;
            const current = latestMessagesRef.current;
            const next = [...current, payload].slice(-50);
            setMessages(next);
          } catch {
            return;
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      active = false;
      clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, [marketId]);

  const handleSend = () => {
    if (!input.trim() || !state.user || !clientRef.current || !connected) return;

    clientRef.current.publish({
      destination: `/app/markets/${marketId}/chat`,
      body: JSON.stringify({
        userName: displayName,
        message: input.trim(),
      }),
    });

    setInput("");
  };

  return (
    <div className="market-chat">
      <div className="market-chat__header">
        <span className="meta">Race chat</span>
        <span className={connected ? "pill" : "pill pill--muted"}>
          {connected ? "Live" : "Offline"}
        </span>
      </div>
      <div className="market-chat__messages">
        {messages.length === 0 ? (
          <p className="muted small">No messages yet. Kick off the debate.</p>
        ) : (
          messages.map((entry) => (
            <p key={entry.id}>
              <strong>{entry.userName}:</strong> {entry.message}
            </p>
          ))
        )}
      </div>
      <div className="market-chat__input">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={state.user ? "Say something" : "Sign in to chat"}
          disabled={!state.user}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSend();
          }}
        />
        <button className="btn btn--ghost" type="button" onClick={handleSend} disabled={!state.user}>
          Send
        </button>
      </div>
    </div>
  );
}
