/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        "surface-hover": "var(--bg-surface-hover)",
        chat: "var(--bg-chat)",
        accent: "var(--accent)",
        "bubble-sent": "var(--bubble-sent)",
        "bubble-received": "var(--bubble-received)",
        subtle: "var(--border-subtle)",
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        'glow': '0 0 10px var(--accent-glow)',
        'bubble-glow': 'inset 0 0 10px rgba(0,0,0,0.2)',
      },
      animation: {
        'slide-up': 'slideUp 0.2s ease-out forwards',
        'fade-in': 'fadeIn 0.15s ease-out forwards',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};
