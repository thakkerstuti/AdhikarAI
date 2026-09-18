import { ReactNode } from "react";

interface IconCircleProps {
  children: ReactNode;
  tone?: "chip" | "ink" | "verified" | "warn";
  size?: "sm" | "md" | "lg";
}

const toneClasses: Record<string, string> = {
  chip: "bg-chip text-ink",
  ink: "bg-ink text-paper",
  verified: "bg-verifiedBg text-verified",
  warn: "bg-warnBg text-warn",
};

const sizeClasses: Record<string, string> = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-16 w-16",
};

export default function IconCircle({ children, tone = "chip", size = "md" }: IconCircleProps) {
  return (
    <div className={`shrink-0 rounded-full flex items-center justify-center ${toneClasses[tone]} ${sizeClasses[size]}`}>
      {children}
    </div>
  );
}
