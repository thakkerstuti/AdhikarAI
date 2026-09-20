import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg" | "icon";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: "bg-ink text-paper hover:bg-ink/90",
  secondary: "bg-chip text-ink hover:bg-chip/80",
  ghost: "bg-transparent text-ink hover:bg-chip border border-line",
  danger: "bg-warnBg text-warn hover:bg-warnBg/70",
};

const sizeClasses: Record<string, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-6 text-base",
  icon: "h-11 w-11 p-0",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  fullWidth,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {icon && iconPosition === "left" && icon}
      {children}
      {icon && iconPosition === "right" && icon}
    </button>
  );
}
