/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#071427",
        mist: "#5f7089",
        accent: "#1c73e8",
        mint: "#37d8b2",
        bg: "#f6f9ff"
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Apple SD Gothic Neo",
          "Pretendard",
          "Noto Sans KR",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};
