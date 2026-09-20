import { NavLink } from "react-router-dom";
import { Home, Folder, Bell, User } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/cases", label: "Cases", icon: Folder, end: false },
  { to: "/reminders", label: "Reminders", icon: Bell, end: false },
  { to: "/profile", label: "Profile", icon: User, end: false },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-paper/95 backdrop-blur"
    >
      <div className="mx-auto max-w-md grid grid-cols-4">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? "text-ink" : "text-muted"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
