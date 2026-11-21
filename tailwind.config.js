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
          DEFAULT: "#E92227",
          600: "#C91B20",
          50: "#FFF1F2",
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
        display: ["Inter", "Arial", "sans-serif"],
        sans: ["Inter", "Arial", "sans-serif"],
        mono: ["Inter", "Arial", "sans-serif"],
      },
      letterSpacing: {
        eyebrow: "normal",
      },
      borderRadius: { DEFAULT: "4px", lg: "4px", xl: "4px", "2xl": "4px", "3xl": "4px" },
      boxShadow: {
        card: "0 1px 3px rgb(16 33 61 / 8%)",
        lift: "0 2px 8px rgb(16 33 61 / 8%)",
        glow: "none",
        glass: "none",
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
        float: "none",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
}
