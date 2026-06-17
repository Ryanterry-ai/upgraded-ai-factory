"use client";
import { useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, MessageSquare, History, Layout } from "lucide-react";
import type { ChatMessage } from "./types";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (msg: string) => void;
  status: "idle" | "generating" | "completed" | "error";
  inputValue: string;
  onInputChange: (val: string) => void;
  selectedFactory?: string;
}

const TEMPLATES = [
  "Build a SaaS landing page with pricing",
  "Ecommerce store with product grid",
  "Admin dashboard with charts",
  "Portfolio with blog and contact",
  "AI chatbot interface",
  "Clone this website: paste URL here",
];

export function ChatPanel({ messages, onSend, status, inputValue, onInputChange, selectedFactory }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-2">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/10 text-xs font-medium text-white">
          <MessageSquare className="w-3 h-3" /> Chat
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <History className="w-3 h-3" /> History
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <Layout className="w-3 h-3" /> Templates
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-zinc-300 mb-1">What do you want to build?</p>
            <p className="text-xs text-zinc-500 mb-4">Describe your app, paste a URL, or pick a template.</p>
            {selectedFactory && (
              <div className="text-xs px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 mb-4">
                Factory: {selectedFactory}
              </div>
            )}
            <div className="space-y-1.5 w-full max-w-xs">
              {TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => onInputChange(t)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all text-zinc-400 hover:text-zinc-200"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-white/10 text-white"
                  : "bg-white/5 text-zinc-300"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  <span className="text-[10px] text-violet-400 font-medium">build.same</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend(inputValue);
              }
            }}
            placeholder={status === "generating" ? "Generating..." : "Describe your next change..."}
            disabled={status === "generating"}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none disabled:opacity-50"
          />
          <button
            onClick={() => onSend(inputValue)}
            disabled={status === "generating" || !inputValue.trim()}
            className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30"
          >
            {status === "generating" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-1.5 text-center">
          {status === "generating" ? "AI agents are working..." : "Press Enter to send"}
        </p>
      </div>
    </div>
  );
}
