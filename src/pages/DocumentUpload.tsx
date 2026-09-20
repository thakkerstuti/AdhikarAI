import { useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Camera, FileUp, Image as ImageIcon, FileText, ScanLine, Upload } from "lucide-react";
import TopBar from "@/components/ui/TopBar";
import DocumentCard from "@/components/DocumentCard";
import Skeleton from "@/components/ui/Skeleton";
import { getDocumentExplanation, uploadDocument } from "@/services/api";

export default function DocumentUpload() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const scanMode = params.get("mode") === "scan";
  const [analyzing, setAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If user arrived specifically to scan, prompt camera picker
    if (scanMode && cameraRef.current) {
      // Optional slight delay for smoother UI mount
      const timer = setTimeout(() => {
        cameraRef.current?.click();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [scanMode]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setAnalyzing(true);
    try {
      const { documentId } = await uploadDocument(file);
      const analysis = await getDocumentExplanation(documentId);
      navigate("/document/result", { state: { analysis } });
    } catch {
      setAnalyzing(false);
    }
  }

  if (analyzing) {
    return (
      <div className="min-h-screen bg-paper">
        <TopBar title="Analyzing Document" onBack={() => setAnalyzing(false)} />
        <div className="px-5 pt-10 text-center space-y-6">
          <div className="relative mx-auto h-16 w-16 rounded-full bg-chip flex items-center justify-center">
            <FileText size={26} className="text-ink animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Reading your document…</h2>
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
    <div className="min-h-screen bg-paper pb-10">
      <TopBar
        title={scanMode ? "Scan Document" : "Upload Document"}
        onBack={() => navigate("/")}
      />

      <div className="px-5 pt-4 space-y-6">
        {scanMode ? (
          /* SCANNER CAMERA MODE */
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-semibold text-ink">Document Scanner</h2>
              <p className="text-sm text-muted">
                Align notice, agreement, or legal document within your camera frame to scan.
              </p>
            </div>

            {/* Viewfinder Frame Visual */}
            <div
              onClick={() => cameraRef.current?.click()}
              className="group relative cursor-pointer aspect-[3/4] max-w-xs mx-auto rounded-3xl border-2 border-dashed border-ink/30 bg-card hover:border-ink transition-colors flex flex-col items-center justify-center p-6 text-center shadow-soft overflow-hidden"
            >
              {/* Corner Frame Lines */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-ink rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-ink rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-ink rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-ink rounded-br-lg" />

              <div className="h-16 w-16 rounded-full bg-ink text-paper flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-md">
                <Camera size={28} />
              </div>
              <p className="text-sm font-semibold text-ink">Tap to Open Camera</p>
              <p className="text-xs text-muted mt-1">Capture clear photo of document</p>

              <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-ink bg-chip px-3 py-1.5 rounded-full">
                <ScanLine size={13} /> Auto OCR Text Recognition
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setParams({})}
                className="text-xs font-semibold text-ink hover:underline inline-flex items-center gap-1"
              >
                <Upload size={13} /> Need to upload a PDF or saved file instead?
              </button>
            </div>
          </div>
        ) : (
          /* FILE UPLOAD MODE */
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-ink">Upload Document File</h2>
              <p className="text-sm text-muted leading-relaxed">
                Upload a rental agreement, court notice, employment contract, or legal letter.
              </p>
            </div>

            <div className="space-y-3">
              <DocumentCard
                icon={FileUp}
                title="Upload PDF Document"
                subtitle="Select .pdf file from your files"
                onClick={() => inputRef.current?.click()}
              />
              <DocumentCard
                icon={ImageIcon}
                title="Upload Photo / Screenshot"
                subtitle="Select JPG, PNG, or HEIC image"
                onClick={() => inputRef.current?.click()}
              />
            </div>

            <div className="rounded-2xl border border-line bg-card p-4 text-center space-y-1">
              <p className="text-xs font-semibold text-ink">Supported File Formats</p>
              <p className="text-xs text-muted">PDF, JPG, PNG, HEIC up to 10MB</p>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setParams({ mode: "scan" })}
                className="text-xs font-semibold text-ink hover:underline inline-flex items-center gap-1"
              >
                <Camera size={13} /> Switch to Camera Document Scanner
              </button>
            </div>
          </div>
        )}

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
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

