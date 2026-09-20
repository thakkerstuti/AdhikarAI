import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, X, Volume2 } from "lucide-react";
import TopBar from "@/components/ui/TopBar";
import VoiceButton from "@/components/VoiceButton";
import LegalAnswer from "@/components/LegalAnswer";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { voiceQuery, speakAnswer } from "@/services/api";
import { storage } from "@/utils/storage";
import { LegalAnswerData, VoiceState } from "@/types";

export default function Voice() {
  const navigate = useNavigate();
  const [state, setState] = useState<VoiceState>("ready");
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState<LegalAnswerData | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup active audio tracks and recorders on unmount
  useEffect(() => {
    return () => {
      stopMediaTracks();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  function stopMediaTracks() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }

  async function startListening() {
    setError(null);
    setTranscript("");
    setAnswer(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    // Check browser support for MediaDevices
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Audio recording is not supported in this browser. Please try another browser or use text search.");
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      let mimeType = "";
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stopMediaTracks();
        await processRecordedAudio(recorder.mimeType || "audio/webm");
      };

      recorder.start(250);
      setState("listening");
    } catch (err: unknown) {
      console.error("[Voice] Microphone access error:", err);
      const isPermissionDenied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");

      if (isPermissionDenied) {
        setError("Microphone permission was denied. Please allow microphone access in your browser settings to ask by voice.");
      } else {
        setError("Could not access microphone. Please check your audio input settings.");
      }
      setState("error");
    }
  }

  function stopListening() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      setState("processing");
      mediaRecorderRef.current.stop();
    }
  }

  async function processRecordedAudio(mimeType: string) {
    setState("processing");

    if (audioChunksRef.current.length === 0) {
      setError("No audio was recorded. Please tap the microphone and speak again.");
      setState("error");
      return;
    }

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const selectedLang = storage.getSelectedLanguage();

      const result = await voiceQuery(audioBlob, selectedLang);
      setTranscript(result.transcript);
      setAnswer(result.answer);
      setAudioUrl(result.audioUrl);
      setState("answer");

      // Automatically play synthesized answer if audio is available
      if (result.audioUrl) {
        try {
          const audio = new Audio(result.audioUrl);
          audioPlayerRef.current = audio;
          audio.play().catch(() => {
            // Autoplay policy may restrict immediate playback; user can still click Listen
          });
        } catch {
          // ignore autoplay restrictions
        }
      }
    } catch (err: unknown) {
      console.error("[Voice] Processing failed:", err);
      setError("Something went wrong understanding that. Please try again.");
      setState("error");
    }
  }

  function handleMicClick() {
    if (state === "ready" || state === "error") {
      startListening();
    } else if (state === "listening") {
      stopListening();
    }
  }

  function reset() {
    stopMediaTracks();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setState("ready");
    setTranscript("");
    setAnswer(null);
    setAudioUrl(null);
    setError(null);
  }

  async function handleListen() {
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        await audio.play();
        return;
      } catch {
        // Fallback to synthesize call below
      }
    }
    if (answer) {
      await speakAnswer(answer.whatThisMeans, storage.getSelectedLanguage());
    }
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
                  {transcript || <span className="text-muted">Listening for speech…</span>}
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
