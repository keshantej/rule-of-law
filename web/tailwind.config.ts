import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sand: "#efe5d0",
        paper: "#f7f1e4",
        navy: "#172847",
        ink: "#0f1a2a",
        ember: "#9b2332",
        gold: "#cda15d"
      },
      boxShadow: {
        horizon: "0 24px 80px rgba(23,40,71,0.18)"
      },
      backgroundImage: {
        dune: "radial-gradient(circle at 20% 10%, rgba(205,161,93,0.22), transparent 34%), radial-gradient(circle at 80% 20%, rgba(155,35,50,0.18), transparent 26%), linear-gradient(180deg, #f7f1e4 0%, #efe5d0 100%)"
      }
    }
  },
  plugins: []
};

export default config;
