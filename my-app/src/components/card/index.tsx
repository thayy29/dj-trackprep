import { colorTokens } from "../../styles/color-tokens";

export interface CardProps {
  title: string;
  counter: string;
  children?: React.ReactNode;
}

export function Card({ title, counter, children }: CardProps) {

  return (
    <div className="py-2 px-4 items-center justify-center bg-background-elevated rounded-xl border shadow border-border-light">
      <div className="flex items-center gap-2">
        <h3 className="text-text-low text-md font-bold">{title}</h3>
        <span className="text-action-primary">{counter}</span>
      </div>
    </div>
  );
}