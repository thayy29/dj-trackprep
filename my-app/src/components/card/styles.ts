export const cardVariants = {
  // Base compartilhada para Card e CardButton
  base: "flex items-center rounded-xl transition-colors",

  // Tamanhos
  size: {
    sm: "py-1.5 px-3 gap-2",
    md: "py-2 px-4 gap-2",
    lg: "py-3 px-5 gap-3",
  },

  // Variantes visuais (Card = info, CardButton = ações)
  variant: {
    // Card variants
    default: "bg-background-elevated border border-border-light",
    outline: "bg-transparent border border-border-light",

    // CardButton variants
    primary:
      "bg-action-primary text-white hover:bg-action-primary/90 cursor-pointer",
    secondary:
      "bg-background-elevated text-text-medium hover:bg-background-pressed cursor-pointer",
    ghost:
      "bg-transparent text-text-high hover:bg-background-elevated cursor-pointer",
  },

  // Tipografia
  text: {
    sm: { title: "text-xs", subtitle: "text-xs", value: "text-xs" },
    md: { title: "text-sm", subtitle: "text-xs", value: "text-sm" },
    lg: { title: "text-base", subtitle: "text-sm", value: "text-base" },
  },

  // Ícones
  icon: {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  },

  // Avatares
  avatar: {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  },
} as const;

export type CardSize = keyof typeof cardVariants.size;
export type CardVariant = keyof typeof cardVariants.variant;

export function getCardStyles(
  variant: CardVariant = "default",
  size: CardSize = "md",
) {
  return {
    container: `${cardVariants.base} ${cardVariants.size[size]} ${cardVariants.variant[variant]}`,
    title: cardVariants.text[size].title,
    subtitle: cardVariants.text[size].subtitle,
    value: cardVariants.text[size].value,
    icon: cardVariants.icon[size],
    avatar: cardVariants.avatar[size],
  };
}
