/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08131f",
        ocean: "#0d2235",
        mist: "#a9bed0",
        sand: "#f2d3a2",
        coral: "#ff7a2f",
        sky: "#5fb4ff",
      },
      fontFamily: {
        display: ['"Aptos Display"', '"Bahnschrift"', '"Segoe UI Variable Display"', "sans-serif"],
        body: ['"Aptos"', '"Segoe UI Variable Display"', '"Trebuchet MS"', "sans-serif"],
      },
      boxShadow: {
        ambient: "0 30px 80px rgba(0, 0, 0, 0.28)",
        glow: "0 18px 48px rgba(255, 122, 47, 0.24)",
      },
      backgroundImage: {
        hero:
          "radial-gradient(circle at top left, rgba(95,180,255,0.24), transparent 28%), radial-gradient(circle at 85% 18%, rgba(255,122,47,0.18), transparent 22%), linear-gradient(180deg, #08131f 0%, #091828 54%, #0b1e2f 100%)",
      },
    },
  },
  plugins: [],
};
