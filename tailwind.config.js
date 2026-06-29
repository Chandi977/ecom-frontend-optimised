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
    extend: {},
  },
  plugins: [],
}
