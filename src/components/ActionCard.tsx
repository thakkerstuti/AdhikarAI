interface ActionCardProps {
  index: number;
  text: string;
}

export default function ActionCard({ index, text }: ActionCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl2 border border-line bg-card p-4">
      <span className="shrink-0 h-6 w-6 rounded-full bg-ink text-paper text-xs font-bold flex items-center justify-center mt-0.5">
        {index}
      </span>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}
