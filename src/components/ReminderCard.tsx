import { Check, Pencil, Trash2 } from "lucide-react";
import { Reminder } from "@/types";

interface ReminderCardProps {
  reminder: Reminder;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ReminderCard({ reminder, onToggle, onEdit, onDelete }: ReminderCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl2 border border-line bg-card p-4">
      <button
        onClick={() => onToggle(reminder.id)}
        aria-label={reminder.completed ? "Mark as not complete" : "Mark as complete"}
        aria-pressed={reminder.completed}
        className={`h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          reminder.completed ? "bg-verified border-verified text-white" : "border-line text-transparent"
        }`}
      >
        <Check size={13} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${reminder.completed ? "line-through text-muted" : ""}`}>{reminder.title}</p>
        <p className="text-xs text-muted mt-0.5">{reminder.dueLabel}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(reminder.id)}
          aria-label="Edit reminder"
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-chip transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(reminder.id)}
          aria-label="Delete reminder"
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-warnBg hover:text-warn transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
