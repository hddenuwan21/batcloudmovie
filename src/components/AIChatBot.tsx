import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Bot, Send, X, Sparkles } from "lucide-react";
import { ChatMessage } from "../types";

interface AIChatBotProps {
  currentLang: "si" | "en";
  activeProfile: string;
}

export default function AIChatBot({ currentLang, activeProfile }: AIChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Localization resources
  const textResources = {
    title: { si: "සිනමා AI සහායකයා", en: "Cinema AI Advisor" },
    tag: { si: "සහයෝගී Cinema Helper", en: "Interactive Recommendations Engine" },
    welcome: {
      si: `ආයුබෝවන් ${activeProfile}! 👋 මම ඔබගේ චිත්‍රපට AI සහායකයා. ඔබට අද නැරඹීමට හොඳ නිර්දේශ අවශ්‍යද? චිත්‍රපට තොරතුරු, නළු නිළියන් සහ සිංහල සිනමා තොරතුරු ඕනෑම දෙයක් මාගෙන් විමසන්න! 🍿🎬`,
      en: `Hello ${activeProfile}! 👋 I'm your Batcloud Xlive cinematic assistant. Ask me anything about movies, TV series, actors, or customized recommendations! 🍿🎬`
    },
    thinking: { si: "සිතමින් සිටී...", en: "Thinking..." },
    placeholder: {
      si: "චිත්‍රපට හෝ ටීවී ගැන විමසන්න...",
      en: "Ask me about movies, shows, suggestions..."
    },
    error: {
      si: "සමාවන්න! සම්බන්ධතාවයේ දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.",
      en: "AI advisor was temporarily disconnected. Please send your query again."
    }
  };

  useEffect(() => {
    // Set initial welcome message
    setMessages([
      {
        sender: "ai",
        text: textResources.welcome[currentLang],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, [currentLang, activeProfile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    const query = userInput.trim();
    if (!query) return;

    setUserInput("");
    const userMsg: ChatMessage = {
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userProfile: activeProfile
        })
      });

      if (!resp.ok) throw new Error("API call failed");
      const data = await resp.json();

      setIsTyping(false);
      setMessages(prev => [...prev, {
        sender: "ai",
        text: data.reply || "Something went wrong",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
    } catch (err) {
      console.error("AI Assistant connection error:", err);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        sender: "ai",
        text: textResources.error[currentLang],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
    }
  };

  return (
    <>
      {/* Floating launcher trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-600 to-rose-500 hover:shadow-[0_8px_25px_rgba(124,58,237,0.5)] cursor-pointer flex items-center justify-center text-white text-xl z-30 shadow-2xl transition-all transform hover:scale-110 active:scale-95"
      >
        <Bot className="w-6 h-6 animate-pulse" />
        <span className="absolute -top-1 -right-1 bg-red-600 text-[8px] font-black pointer-events-none text-white px-1.5 py-0.5 rounded-full">
          LIVE
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ duration: 0.3, cubicBezier: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-4 sm:right-6 w-[360px] sm:w-[380px] h-[500px] max-h-[75vh] bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 select-none"
          >
            {/* Header section with gradient */}
            <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl relative">
                  <Bot className="w-5 h-5 text-white animate-bounce" />
                  <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-zinc-900" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5 leading-none">
                    <span>{textResources.title[currentLang]}</span>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                  </h4>
                  <span className="text-[10px] text-white/75 block mt-1">
                    {textResources.tag[currentLang]}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/15 text-white/80 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages flow container */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/40 no-scrollbar"
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"} max-w-[85%] ${
                    m.sender === "user" ? "ml-auto" : "mr-auto"
                  }`}
                >
                  <div
                    className={`p-3.5 rounded-2xl ${
                      m.sender === "user"
                        ? "bg-red-600 text-white rounded-tr-none shadow-md"
                        : "bg-white/5 text-zinc-100 rounded-tl-none border border-white/5 shadow-md"
                    } text-xs text-left leading-relaxed`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                  </div>
                  <span className="text-[9px] text-zinc-500 mt-1 font-mono px-1">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex flex-col items-start max-w-[80%] mr-auto">
                  <div className="p-3 bg-white/5 rounded-2xl rounded-tl-none border border-white/5 text-[10px] text-zinc-400 flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                    <span>{textResources.thinking[currentLang]}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ingestion interface bar */}
            <div className="p-3 bg-zinc-900 border-t border-zinc-800/60 flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                placeholder={textResources.placeholder[currentLang]}
                className="flex-1 bg-zinc-950 border border-zinc-800 text-white rounded-full px-4 py-2 text-xs focus:outline-none focus:border-red-600 placeholder-zinc-500 transition-colors"
              />
              <button
                onClick={handleSendMessage}
                className="p-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
