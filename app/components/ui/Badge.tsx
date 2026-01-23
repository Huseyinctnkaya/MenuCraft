import type { HTMLAttributes } from "react";
import { cn } from "./utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "pro" | "new" | "primary";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const baseStyles =
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  pro: "bg-indigo-100 text-indigo-700",
  new: "bg-blue-100 text-blue-700",
  primary: "bg-indigo-600 text-white",
};

export default function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span className={cn(baseStyles, variantStyles[variant], className)} {...props} />
  );
}
