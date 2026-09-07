import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base neutra do produto (fundo claro, conteúdo denso em números)
        canvas: "#F6F7F9",
        surface: "#FFFFFF",
        border: "#E4E7EC",
        ink: {
          900: "#0F1729", // texto principal / sidebar
          700: "#33415C",
          500: "#5B6B87",
          300: "#98A4BC",
        },
        // Marca — teal profundo (referência ao "radar"), não o clay/cream genérico
        brand: {
          900: "#0B3B39",
          700: "#0E7C86",
          500: "#14A6A6",
          200: "#CFEFEE",
        },
        // Semântica do Radar de Caixa (Etapa 2 / Fase 5) — reservada desde já
        radar: {
          saudavel: "#059669",
          atencao: "#D97706",
          risco: "#DC2626",
          excesso: "#2563EB",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
