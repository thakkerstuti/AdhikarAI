import { Mic, Square } from "lucide-react";
import { VoiceState } from "@/types";

interface VoiceButtonProps {
  state: VoiceState;
  onClick: () => void;
  size?: "md" | "lg";
}

export default function VoiceButton({ state, onClick, size = "lg" }: VoiceButtonProps) {
  const listening = state === "listening";
  const dims = size === "lg" ? "h-24 w-24" : "h-14 w-14";
  const iconSize = size === "lg" ? 30 : 20;

  return (
    <div className="relative inline-flex items-center justify-center">
      {listening && (
        <>
          <span className={`absolute ${dims} rounded-full bg-ink/20 animate-pulseRing`} />
          <span className={`absolute ${dims} rounded-full bg-ink/20 animate-pulseRing [animation-delay:0.4s]`} />
        </>
      )}
      <button
        type="button"
        onClick={onClick}
        aria-label={listening ? "Stop recording" : "Tap to speak"}
        aria-pressed={listening}
        className={`relative ${dims} rounded-full bg-ink text-paper flex items-center justify-center shadow-soft transition-transform active:scale-95 disabled:opacity-40`}
        disabled={state === "processing"}
      >
        {listening ? <Square size={iconSize - 8} fill="currentColor" /> : <Mic size={iconSize} strokeWidth={2.2} />}
      </button>
    </div>
  );
}
