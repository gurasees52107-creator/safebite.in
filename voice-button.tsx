import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  onResult: (text: string) => void;
  lang?: string;
  className?: string;
};

export function VoiceButton({ onResult, lang = "en", className }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const t = e.results?.[0]?.[0]?.transcript ?? "";
      if (t) onResult(t.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {}
    };
  }, [onResult]);

  useEffect(() => {
    if (recRef.current) recRef.current.lang = lang || "en";
  }, [lang]);

  if (!supported) return null;

  const toggle = () => {
    const r = recRef.current;
    if (!r) return;
    if (listening) {
      try {
        r.stop();
      } catch {}
      setListening(false);
    } else {
      try {
        r.start();
        setListening(true);
      } catch {}
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      title={listening ? "Stop" : "Speak"}
      className={
        "inline-flex items-center justify-center rounded-md border transition-colors " +
        (listening
          ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse"
          : "border-border bg-background text-foreground hover:bg-accent ") +
        (className ? " " + className : "")
      }
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}
