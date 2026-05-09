/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#071427",
        mist: "#5f7089",
        accent: "#1c73e8",
        bg: "#f6f9ff"
      }
    }
  },
  plugins: []
};
