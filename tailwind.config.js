/** @type {import('tailwindcss').Config} */
module.exports = {
  // Prefix to prevent class name collision with Bootstrap / PrimeFlex
  prefix: 'tw-',
  // Disable Preflight to prevent overriding Bootstrap/Antd/MUI baseline styles
  corePlugins: {
    preflight: false,
  },
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./modals/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Storefront design tokens (Ultra-Clean Industrial) ──────────────
      colors: {
        navy: {
          DEFAULT: "#0F2747",
          deep: "#0A1B33",
          700: "#16305A",
          600: "#25466E",
          500: "#3A5A85",
        },
        accent: {
          DEFAULT: "#FF9800",
          600: "#F57C00",
          50: "#FFF5E6",
        },
        alert: {
          DEFAULT: "#E53935",
          50: "#FDECEC",
        },
        ink: "#111827",
        subtle: "#667085",
        canvas: "#F7F8FA",
        hairline: "#E6E8EC",
      },
      fontFamily: {
        // Calistoga (warm display serif) headlines; Inter body/UI; JetBrains Mono for spec data
        display: ["Calistoga", "Georgia", "Cambria", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        eyebrow: "0.18em",
      },
      boxShadow: {
        // Navy-tinted shadows (never pure black) so elevation matches the brand hue
        card: "0 1px 2px rgba(15,39,71,0.06), 0 6px 16px -6px rgba(15,39,71,0.10)",
        lift: "0 28px 60px -24px rgba(15,39,71,0.38)",
        glow: "0 12px 34px -8px rgba(255,152,0,0.48)",
        // Inner edge-refraction for true glassmorphism on navy bands
        glass: "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.06), 0 24px 60px -30px rgba(0,0,0,0.55)",
      },
      backgroundImage: {
        // Subtle fractal-noise grain to break digital flatness on dark bands
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        "logo-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "logo-scroll": "logo-scroll 32s linear infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
}
