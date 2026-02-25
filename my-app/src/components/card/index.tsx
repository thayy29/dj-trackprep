import { getCardStyles, type CardSize, type CardVariant } from "./styles";

export interface CardProps {
  title: string;
  counter?: number;
  size?: CardSize;
  variant?: CardVariant;
  children?: React.ReactNode;
}

export function Card({ 
  title, 
  counter = 0, 
  size = "md", 
  variant = "default",
  children 
}: CardProps) {
  const styles = getCardStyles(variant, size);

  return (
    <div className={styles.container}>
      <span className={`${styles.title} text-text-low font-medium`}>{title}</span>
      <span className={`${styles.value} text-action-primary font-semibold`}>{counter}</span>
      {children}
    </div>
  );
}