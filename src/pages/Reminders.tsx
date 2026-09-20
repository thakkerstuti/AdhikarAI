import { useEffect, useState } from "react";
import { Plus, Bell } from "lucide-react";
import ReminderCard from "@/components/ReminderCard";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { createReminder, deleteReminder, getReminders, updateReminder } from "@/services/api";
import { Reminder } from "@/types";

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [dueLabel, setDueLabel] = useState("");

  function refresh() {
    getReminders().then(setReminders);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createReminder(title, dueLabel || "No date set");
    setTitle("");
    setDueLabel("");
    setAdding(false);
    refresh();
  }

  async function toggle(id: string) {
    const current = reminders?.find((r) => r.id === id);
    if (!current) return;
    await updateReminder(id, { completed: !current.completed });
    refresh();
  }

  async function edit(id: string) {
    const current = reminders?.find((r) => r.id === id);
    if (!current) return;
    const next = window.prompt("Edit reminder", current.title);
    if (next && next.trim()) {
      await updateReminder(id, { title: next.trim() });
      refresh();
    }
  }

  async function remove(id: string) {
    await deleteReminder(id);
    refresh();
  }

  return (
    <div className="px-5 pt-8 pb-28 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Your reminders</h1>
          <p className="text-sm text-muted mt-1">Follow-ups you've set for yourself.</p>
        </div>
        <button
          onClick={() => setAdding((a) => !a)}
          aria-label="Add reminder"
          className="h-10 w-10 rounded-full bg-ink text-paper flex items-center justify-center shrink-0"
        >
          <Plus size={18} />
        </button>
      </header>

      {adding && (
        <form onSubmit={handleAdd} className="rounded-xl2 border border-line bg-card p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reminder title"
            className="w-full rounded-xl2 border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-ink"
            autoFocus
          />
          <input
            value={dueLabel}
            onChange={(e) => setDueLabel(e.target.value)}
            placeholder="e.g. Friday · 5:00 PM"
            className="w-full rounded-xl2 border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-ink"
          />
          <div className="flex gap-2">
            <Button type="submit" size="md">Add reminder</Button>
            <Button type="button" variant="ghost" size="md" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {reminders === null && (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}

      {reminders?.length === 0 && (
        <div className="text-center pt-16 space-y-3">
          <div className="mx-auto h-14 w-14 rounded-full bg-chip flex items-center justify-center">
            <Bell size={22} />
          </div>
          <p className="text-sm text-muted">No reminders yet.</p>
        </div>
      )}

      {reminders && reminders.length > 0 && (
        <div className="space-y-2.5">
          {reminders.map((r) => (
            <ReminderCard key={r.id} reminder={r} onToggle={toggle} onEdit={edit} onDelete={remove} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted text-center pt-2">
        These are reminders you create — not legal deadlines determined by the app.
      </p>
    </div>
  );
}
