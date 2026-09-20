import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, X, Volume2 } from "lucide-react";
import TopBar from "@/components/ui/TopBar";
import VoiceButton from "@/components/VoiceButton";
import LegalAnswer from "@/components/LegalAnswer";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { askQuestion, speakAnswer } from "@/services/api";
import { LegalAnswerData, VoiceState } from "@/types";

const MOCK_TRANSCRIPT_STEPS = [
  "My landlord",
  "My landlord hasn't",
  "My landlord hasn't returned",
  "My landlord hasn't returned my security",
  "My landlord hasn't returned my security deposit after I moved out.",
];

export default function Voice() {
  const navigate = useNavigate();
  const [state, setState] = useState<VoiceState>("ready");
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState<LegalAnswerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  function startListening() {
    setState("listening");
    setTranscript("");
    setAnswer(null);
    setError(null);
    MOCK_TRANSCRIPT_STEPS.forEach((step, i) => {
      const t = window.setTimeout(() => setTranscript(step), 500 * (i + 1));
      timers.current.push(t);
    });
  }

  async function stopAndProcess() {
    setState("processing");
    try {
      const fallback = MOCK_TRANSCRIPT_STEPS[MOCK_TRANSCRIPT_STEPS.length - 1];
      const result = await askQuestion(transcript || fallback, "en");
      setAnswer(result);
      setState("answer");
    } catch {
      setError("Something went wrong understanding that. Please try again.");
      setState("error");
    }
  }

  function handleMicClick() {
    if (state === "ready" || state === "error") startListening();
    else if (state === "listening") stopAndProcess();
  }

  function reset() {
    timers.current.forEach((t) => window.clearTimeout(t));
    setState("ready");
    setTranscript("");
    setAnswer(null);
    setError(null);
  }

  async function handleListen() {
    if (!answer) return;
    await speakAnswer(answer.whatThisMeans, "en");
  }

  return (
    <div className="min-h-screen pb-10">
      <TopBar title="Ask by voice" onBack={() => navigate("/")} />

      <div className="px-5 pt-6 space-y-8">
        {(state === "ready" || state === "listening") && (
          <div className="flex flex-col items-center text-center gap-5 pt-6">
            <div>
              <h1 className="text-xl font-semibold">Tell us what happened.</h1>
              <p className="text-sm text-muted mt-1">Speak naturally, in whichever language you're comfortable with.</p>
            </div>
            <VoiceButton state={state} onClick={handleMicClick} />
            <p className="text-sm font-medium text-muted min-h-[1.25rem]">
              {state === "listening" ? "Listening… tap to stop" : "Tap to start"}
            </p>

            {state === "listening" && (
              <div className="w-full rounded-xl2 border border-line bg-card p-4 min-h-[4rem]">
                <p className="text-sm leading-relaxed">
                  {transcript || <span className="text-muted">…</span>}
                </p>
              </div>
            )}

            {state === "listening" && (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="md" icon={<X size={16} />} onClick={reset}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {state === "processing" && (
          <div className="pt-10 space-y-4">
            <p className="text-center text-sm font-medium text-muted">Understanding your situation…</p>
            <Skeleton className="h-24" />
            <Skeleton className="h-16" />
            <Skeleton className="h-40" />
          </div>
        )}

        {state === "answer" && answer && (
          <div className="space-y-4">
            <p className="text-sm text-muted px-1">You said: "{transcript}"</p>
            <LegalAnswer answer={answer} onListen={handleListen} />
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth icon={<RotateCcw size={16} />} onClick={reset}>
                Ask something else
              </Button>
              <Button variant="primary" fullWidth onClick={() => navigate(`/result/${answer.id}`, { state: { answer } })}>
                View full result
              </Button>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="pt-10 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-warnBg text-warn flex items-center justify-center">
              <Volume2 size={22} />
            </div>
            <p className="text-sm text-muted">{error}</p>
            <Button variant="primary" icon={<RotateCcw size={16} />} onClick={reset}>
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
