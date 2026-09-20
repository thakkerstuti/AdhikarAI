interface PaginationDotsProps {
  total: number;
  current: number;
  onDotClick?: (index: number) => void;
}

export default function PaginationDots({ total, current, onDotClick }: PaginationDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Onboarding steps">
      {Array.from({ length: total }).map((_, idx) => {
        const isActive = idx === current;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onDotClick?.(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            aria-selected={isActive}
            role="tab"
            className={`h-2 rounded-full transition-all duration-300 ${
              isActive ? "w-7 bg-ink" : "w-2 bg-line hover:bg-muted/40"
            }`}
          />
        );
      })}
    </div>
  );
}
