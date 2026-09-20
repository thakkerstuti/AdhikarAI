import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Camera, FileUp, Image as ImageIcon, FileText } from "lucide-react";
import TopBar from "@/components/ui/TopBar";
import DocumentCard from "@/components/DocumentCard";
import Skeleton from "@/components/ui/Skeleton";
import { getDocumentExplanation, uploadDocument } from "@/services/api";

export default function DocumentUpload() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const scanMode = params.get("mode") === "scan";
  const [analyzing, setAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setAnalyzing(true);
    const { documentId } = await uploadDocument(file);
    const analysis = await getDocumentExplanation(documentId);
    navigate("/document/result", { state: { analysis } });
  }

  if (analyzing) {
    return (
      <div className="min-h-screen">
        <TopBar title="Analyzing" onBack={() => navigate("/")} />
        <div className="px-5 pt-10 text-center space-y-6">
          <div className="mx-auto h-14 w-14 rounded-full bg-chip flex items-center justify-center">
            <FileText size={22} className="animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold">Analyzing your document…</p>
            <p className="text-xs text-muted mt-1">{fileName}</p>
          </div>
          <div className="space-y-3 pt-4">
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <Skeleton className="h-24" />
            <Skeleton className="h-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar title="Upload a document" onBack={() => navigate("/")} />
      <div className="px-5 pt-4 space-y-6">
        <p className="text-sm text-muted">
          Upload a rental agreement, notice, contract, or any legal document — we'll explain what it says.
        </p>

        <div className="space-y-2">
          <DocumentCard icon={Camera} title="Take a photo" subtitle="Use your camera" onClick={() => cameraRef.current?.click()} />
          <DocumentCard icon={FileUp} title="Upload PDF" subtitle="From your files" onClick={() => inputRef.current?.click()} />
          <DocumentCard icon={ImageIcon} title="Upload image" subtitle="JPG, PNG, HEIC" onClick={() => inputRef.current?.click()} />
        </div>

        <p className="text-xs text-muted text-center">Supported: PDF, JPG, PNG, HEIC · up to 10MB</p>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture={scanMode ? "environment" : undefined}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
