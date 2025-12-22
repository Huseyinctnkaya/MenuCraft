import type { HTMLAttributes } from "react";
import { cn } from "./utils";

type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: CardPadding;
};

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  className,
  padding = "none",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border",
        paddingStyles[padding],
        className
      )}
      {...props}
    />
  );
}
