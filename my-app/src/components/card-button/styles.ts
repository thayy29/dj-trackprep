export const cardButtonVariants = {
  base: "text-medium font-medium rounded-xl",
  variant: {
    primary: "bg-action-primary text-white",
    secondary: "bg-background-pressed text-text-medium",
    outline: "bg-transparent border border-action-primary text-action-primary",
    ghost: "bg-transparent text-text-high hover:bg-action-secondary",
  },
  size: {
    sm: "py-1 px-2 text-sm",
    md: "py-2 px-4 text-md",
    lg: "py-3 px-6 text-lg",
  },
  rounded: {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  },
} as const;

export type CardButtonVariant = keyof typeof cardButtonVariants.variant;
export type CardButtonSize = keyof typeof cardButtonVariants.size;
export type CardButtonRounded = keyof typeof cardButtonVariants.rounded;

export function getCardButtonStyles(
  variant: CardButtonVariant = "primary",
  size: CardButtonSize = "md",
  rounded: CardButtonRounded = "xl",
): string {
  return [
    cardButtonVariants.variant[variant],
    cardButtonVariants.size[size],
    cardButtonVariants.rounded[rounded],
  ].join(" ");
}
