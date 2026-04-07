/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand palette via CSS variables ────────────────────────
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",   // emerald-500 — main brand
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          400: "#2dd4bf",
          500: "#14b8a6",   // teal-500 — secondary
          600: "#0d9488",
          700: "#0f766e",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          400: "#a3e635",
          500: "#84cc16",   // lime-500 — accent / highlights
          600: "#65a30d",
        },
        // ── Semantic tokens ────────────────────────────────────────
        background:   "hsl(var(--background))",
        foreground:   "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border:  "hsl(var(--border))",
        input:   "hsl(var(--input))",
        ring:    "hsl(var(--ring))",
        // ── Score verdict colors ───────────────────────────────────
        verdict: {
          strong_buy: "#10b981",
          buy:        "#14b8a6",
          hold:       "#f59e0b",
          avoid:      "#ef4444",
        },
      },
      // ── Typography ─────────────────────────────────────────────
      fontFamily: {
        sans:  ["Inter", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Outfit", "Inter", "sans-serif"],
      },
      // ── Border radius ──────────────────────────────────────────
      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      // ── Shadows (neumorphism + glow) ───────────────────────────
      boxShadow: {
        "neu":        "6px 6px 12px rgba(0,0,0,0.4), -2px -2px 8px rgba(255,255,255,0.04)",
        "neu-inset":  "inset 4px 4px 8px rgba(0,0,0,0.4), inset -2px -2px 6px rgba(255,255,255,0.04)",
        "glow-emerald": "0 0 20px rgba(16,185,129,0.35)",
        "glow-teal":    "0 0 20px rgba(20,184,166,0.35)",
        "glow-lime":    "0 0 20px rgba(132,204,22,0.35)",
        "card":       "0 4px 24px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.4)",
      },
      // ── Backgrounds & gradients ────────────────────────────────
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":   "linear-gradient(135deg, #064e3b 0%, #0f172a 40%, #064e3b 100%)",
        "gradient-card":    "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        "gradient-emerald": "linear-gradient(135deg, #10b981, #059669)",
        "gradient-teal":    "linear-gradient(135deg, #14b8a6, #0d9488)",
        "gradient-score":   "linear-gradient(90deg, #10b981 0%, #14b8a6 50%, #84cc16 100%)",
      },
      // ── Animations ────────────────────────────────────────────
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(16,185,129,0.2)" },
          "50%":      { boxShadow: "0 0 28px rgba(16,185,129,0.5)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up":    "fade-up 0.5s ease-out",
        "fade-in":    "fade-in 0.3s ease-out",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        "shimmer":    "shimmer 2s linear infinite",
        "spin-slow":  "spin-slow 8s linear infinite",
      },
      // ── Spacing extras ─────────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
    },
  },
  plugins: [],
};
