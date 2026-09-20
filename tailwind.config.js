/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F2EC",
        card: "#FFFFFF",
        ink: "#15171A",
        muted: "#6E7076",
        line: "#E8E4DB",
        chip: "#EFEDE7",
        verified: "#3F7A5A",
        verifiedBg: "#E7F1EA",
        warn: "#B23A2E",
        warnBg: "#F7E9E7",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(21,23,26,0.04), 0 8px 24px -12px rgba(21,23,26,0.10)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.6s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};
