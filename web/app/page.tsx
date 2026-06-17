"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowUp, User, Sparkles } from "lucide-react";

const PROMPT_SUGGESTIONS = [
  "make a customer support ticket system with live chat",
  "create a marketplace for freelancers with bidding and payment system",
  "build a event planning platform with RSVP and vendor management",
  "create a music streaming app with playlist sharing",
  "create a booking system for appointments with calendar integration",
  "build a collaborative project management app with real-time updates",
  "create a recipe sharing platform with meal planning and grocery lists",
  "build a personal CRM for managing contacts and relationships",
  "build a learning management system with video courses and quizzes",
  "build an AI-powered personal finance tracker with expense categorization",
  "make a workout tracking app with progress visualization",
  "build a habit tracking app with streak visualization and social features",
];

const TYPING_SPEED = 40;
const ERASING_SPEED = 20;
const PAUSE_AFTER_TYPING = 2000;
const PAUSE_AFTER_ERASING = 300;

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [carouselText, setCarouselText] = useState("");
  const [showTabBadge, setShowTabBadge] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<{
    timeoutId?: ReturnType<typeof setTimeout>;
    cancelled?: boolean;
  }>({});

  // Typewriter carousel
  useEffect(() => {
    if (isUserTyping) return;

    const currentSuggestion = PROMPT_SUGGESTIONS[currentSuggestionIndex];
    let charIndex = 0;
    let isErasing = false;
    let currentText = "";

    const tick = () => {
      if (carouselRef.current.cancelled) return;

      if (!isErasing) {
        // Typing
        currentText = currentSuggestion.slice(0, charIndex + 1);
        charIndex++;
        setCarouselText(currentText);

        if (charIndex === currentSuggestion.length) {
          // Done typing — show tab badge, pause, then erase
          setShowTabBadge(true);
          carouselRef.current.timeoutId = setTimeout(() => {
            setShowTabBadge(false);
            isErasing = true;
            charIndex = currentSuggestion.length;
            tick();
          }, PAUSE_AFTER_TYPING);
          return;
        }
        carouselRef.current.timeoutId = setTimeout(tick, TYPING_SPEED);
      } else {
        // Erasing
        charIndex--;
        currentText = currentSuggestion.slice(0, charIndex);
        setCarouselText(currentText);

        if (charIndex === 0) {
          // Done erasing — move to next suggestion
          setCurrentSuggestionIndex((prev) => (prev + 1) % PROMPT_SUGGESTIONS.length);
          carouselRef.current.timeoutId = setTimeout(tick, PAUSE_AFTER_ERASING);
          return;
        }
        carouselRef.current.timeoutId = setTimeout(tick, ERASING_SPEED);
      }
    };

    carouselRef.current.cancelled = false;
    carouselRef.current.timeoutId = setTimeout(tick, 500);

    return () => {
      carouselRef.current.cancelled = true;
      if (carouselRef.current.timeoutId) {
        clearTimeout(carouselRef.current.timeoutId);
      }
    };
  }, [currentSuggestionIndex, isUserTyping]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrompt(value);
    if (value.length > 0 && !isUserTyping) {
      setIsUserTyping(true);
      setShowTabBadge(false);
      setCarouselText("");
    } else if (value.length === 0) {
      setIsUserTyping(false);
    }
  }, [isUserTyping]);

  const handleInputFocus = useCallback(() => {
    if (!prompt) {
      setIsUserTyping(false);
    }
  }, [prompt]);

  const handleSubmit = useCallback(() => {
    const text = prompt.trim();
    if (!text) return;
    router.push(`/projects/new?prompt=${encodeURIComponent(text)}`);
  }, [prompt, router]);

  const handleCarouselClick = useCallback(() => {
    setPrompt(carouselText);
    setIsUserTyping(true);
    setShowTabBadge(false);
    setCarouselText("");
    inputRef.current?.focus();
  }, [carouselText]);

  const placeholderText = isUserTyping ? "" : carouselText;
  const showPlaceholder = !isUserTyping && !prompt;

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col relative overflow-hidden">
      {/* Aurora background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-40"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255,200,150,0.3) 0%, rgba(255,220,180,0.2) 25%, rgba(200,180,255,0.15) 50%, rgba(180,220,255,0.1) 70%, transparent 100%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute top-1/3 left-1/3 w-[500px] h-[500px] opacity-30"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255,180,120,0.25) 0%, rgba(255,200,160,0.15) 40%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-[400px] h-[400px] opacity-25"
          style={{
            background: "radial-gradient(ellipse at center, rgba(180,200,255,0.2) 0%, rgba(200,180,255,0.1) 50%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-gray-800" />
            <span className="text-lg font-bold tracking-tight text-gray-900">same</span>
          </div>
          <button className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors ml-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors">
          <User className="w-4.5 h-4.5" />
        </button>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 -mt-16">
        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-3">
          Make anything
        </h1>
        <p className="text-lg text-gray-500 mb-10">
          Build websites by chatting with AI
        </p>

        {/* Prompt input box */}
        <div className="w-full max-w-[620px]">
          <div className="border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
            {/* Input area */}
            <div className="relative px-5 pt-5 pb-3 min-h-[80px]">
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                  if (e.key === "Tab" && !prompt && carouselText) {
                    e.preventDefault();
                    handleCarouselClick();
                  }
                }}
                className="w-full bg-transparent text-gray-900 outline-none text-[15px] leading-relaxed"
                placeholder=""
                autoFocus
              />
              {/* Custom placeholder with typewriter */}
              {showPlaceholder && (
                <div
                  className="absolute left-5 top-5 text-gray-400 text-[15px] leading-relaxed pointer-events-none select-none"
                  onClick={handleCarouselClick}
                >
                  <span>{carouselText}</span>
                  <span className="inline-block w-[2px] h-[18px] bg-gray-400 ml-[1px] align-middle animate-pulse" />
                  {!isUserTyping && carouselText && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400 border border-gray-200">
                      tab
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                  claude-4.8-opus
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  prompt.trim()
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Social proof */}
          <p className="text-center text-sm text-gray-400 mt-5">
            over 600,000+ projects built with Same
          </p>
        </div>
      </main>
    </div>
  );
}
