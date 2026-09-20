import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookmarkPlus, FileEdit } from "lucide-react";
import TopBar from "@/components/ui/TopBar";
import LegalAnswer from "@/components/LegalAnswer";
import Button from "@/components/ui/Button";
import { SAMPLE_ANSWERS } from "@/data/mockData";
import { LegalAnswerData } from "@/types";
import { createReminder, speakAnswer } from "@/services/api";

export default function LegalResult() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { answer?: LegalAnswerData } };
  const answer = location.state?.answer ?? SAMPLE_ANSWERS.deposit;
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await createReminder(`Follow up: ${answer.nextSteps[0]}`, "Tomorrow · 10:00 AM");
    setSaved(true);
  }

  async function handleListen() {
    await speakAnswer(answer.whatThisMeans, "en");
  }

  return (
    <div className="min-h-screen pb-10">
      <TopBar title="Legal result" onBack={() => navigate(-1)} />
      <div className="px-5 pt-2 space-y-4">
        <LegalAnswer answer={answer} onListen={handleListen} />

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" icon={<BookmarkPlus size={16} />} onClick={handleSave} disabled={saved}>
            {saved ? "Saved" : "Save case"}
          </Button>
          <Button variant="primary" icon={<FileEdit size={16} />} onClick={() => navigate("/generate")}>
            Generate letter
          </Button>
        </div>
      </div>
    </div>
  );
}
