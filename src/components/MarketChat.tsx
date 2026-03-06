"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  limit,
  serverTimestamp,
  doc,
} from "firebase/firestore";
import { useMarket } from "@/lib/market-context";
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";

type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: number;
};

function formatTime(millis: number): string {
  if (!millis) return "";
  return new Date(millis).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function MarketChat({ marketId }: { marketId: string }) {
  const { state } = useMarket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const displayName = state.user?.name || state.user?.email?.split("@")[0] || "Guest";
  const currentUid = isFirebaseConfigured() ? getFirebaseAuth().currentUser?.uid ?? null : null;

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const db = getFirestoreDb();
    const messagesRef = collection(db, "chats", marketId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId || "",
            userName: data.userName || "Guest",
            message: data.message || "",
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          };
        });
        setMessages(next);
        setConnected(true);
      },
      () => setConnected(false)
    );

    return () => unsubscribe();
  }, [marketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !state.user || !isFirebaseConfigured()) return;
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) return;

    const db = getFirestoreDb();
    try {
      await addDoc(collection(db, "chats", marketId, "messages"), {
        marketId,
        userId: uid,
        userName: displayName,
        message: input.trim(),
        createdAt: serverTimestamp(),
      });
      setInput("");
    } catch {
      return;
    }
  };

  const handleEdit = async (msg: ChatMessage) => {
    if (!editText.trim() || !isFirebaseConfigured()) return;
    const db = getFirestoreDb();
    try {
      await updateDoc(doc(db, "chats", marketId, "messages", msg.id), {
        message: editText.trim(),
      });
      setEditingId(null);
      setEditText("");
    } catch {
      return;
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!isFirebaseConfigured()) return;
    const db = getFirestoreDb();
    try {
      await deleteDoc(doc(db, "chats", marketId, "messages", msgId));
    } catch {
      return;
    }
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="pm-chat">
        <p className="muted small">Chat requires Firebase.</p>
      </div>
    );
  }

  return (
    <div className="pm-chat">
      {/* Header */}
      <div className="pm-chat__header">
        <span className="pm-chat__title">Race chat</span>
        <span className={connected ? "pm-live-dot pm-live-dot--on" : "pm-live-dot"}>
          {connected ? "Live" : "Connecting..."}
        </span>
      </div>

      {/* Messages */}
      <div className="pm-chat__messages">
        {messages.length === 0 ? (
          <p className="muted small pm-chat__empty">No messages yet. Kick off the debate.</p>
        ) : (
          messages.map((msg) => {
            const isOwn = !!currentUid && msg.userId === currentUid;
            const initials = getInitials(msg.userName) || "?";

            return (
              <div key={msg.id} className={`pm-bubble ${isOwn ? "pm-bubble--own" : ""}`}>
                <div className="pm-bubble__avatar" aria-hidden>
                  {initials}
                </div>
                <div className="pm-bubble__body">
                  <div className="pm-bubble__meta">
                    <span className="pm-bubble__name">{msg.userName}</span>
                    <span className="pm-bubble__time">{formatTime(msg.createdAt)}</span>
                    {isOwn && editingId !== msg.id && (
                      <div className="pm-bubble__actions">
                        <button
                          className="pm-action-btn"
                          type="button"
                          title="Edit"
                          onClick={() => {
                            setEditingId(msg.id);
                            setEditText(msg.message);
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="pm-action-btn pm-action-btn--delete"
                          type="button"
                          title="Delete"
                          onClick={() => void handleDelete(msg.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  {editingId === msg.id ? (
                    <div className="pm-bubble__edit">
                      <input
                        className="pm-bubble__edit-input"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleEdit(msg);
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditText("");
                          }
                        }}
                        autoFocus
                      />
                      <div className="pm-bubble__edit-actions">
                        <button className="pm-action-btn" type="button" onClick={() => void handleEdit(msg)}>
                          Save
                        </button>
                        <button
                          className="pm-action-btn"
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditText("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="pm-bubble__text">{msg.message}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pm-chat__input">
        <input
          type="text"
          value={input}
          maxLength={300}
          onChange={(e) => setInput(e.target.value)}
          placeholder={state.user ? "Say something..." : "Sign in to chat"}
          disabled={!state.user}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSend();
          }}
        />
        <button
          className="pm-send-btn"
          type="button"
          onClick={() => void handleSend()}
          disabled={!state.user || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
