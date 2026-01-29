/**
 * Guia de tokens de cor para uso em React e Tailwind.
 * Use estes tokens para garantir consistência visual e facilitar manutenção.
 *
 * Exemplo de uso em React:
 *   style={{ backgroundColor: colorTokens.background.main }}
 *
 * Exemplo de uso em Tailwind:
 *   bg-background-main (se configurado no tailwind.config.js)
 */

export const colorTokens = {
  background: {
    main: "#121212",
    surface: "#181818",
    elevated: "#393939",
    pressed: "#282828",
  },
  text: {
    high: "#FFFFFF",
    medium: "#B3B3B3",
    low: "#6A6A6A",
  },
  icon: {
    main: "#FFFFFF",
    secondary: "#B3B3B3",
    disabled: "#535353",
  },
  action: {
    primary: "#1DB954",
    primaryHover: "#1ED760",
    secondary: "#7A3EFF",
    secondaryHover: "#8F5FFF",
    danger: "#E91429",
    success: "#1AA34A",
  },
  border: {
    light: "#282828",
    focus: "#1DB954",
    error: "#E91429",
  },
  gradient: {
    brand: "linear-gradient(90deg, #1DB954 0%, #7A3EFF 100%)",
    break: "linear-gradient(90deg, #7A3EFF 0%, #3E2EFF 100%)",
  },
} as const;

// Sugestão de uso em React:
// <div style={{ backgroundColor: colorTokens.background.main, color: colorTokens.text.high }} />

// Sugestão de uso em Tailwind (após configurar no tailwind.config.js):
// className="bg-background-main text-high"
