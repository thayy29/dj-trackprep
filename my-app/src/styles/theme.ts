export const theme = {
  background: {
    main: "#121212",
    surface: "#181818",
    elevated: "#282828",
    pressed: "#333333",
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
};

// Função utilitária para gerar custom properties CSS
export function generateCssVariables(themeObj = theme) {
  const flatten = (obj: any, prefix = ""): string[] =>
    Object.entries(obj).flatMap(([key, value]) =>
      typeof value === "object"
        ? flatten(value, `${prefix}${prefix ? "-" : ""}${key}`)
        : [`--${prefix}${prefix ? "-" : ""}${key}: ${value};`],
    );
  return `:root {\n  ${flatten(themeObj).join("\n  ")}\n}`;
}
