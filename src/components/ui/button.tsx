import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-11 px-5 text-sm",
    size === "lg" && "h-[52px] px-7 text-base",
    fullWidth && "w-full",
    variant === "primary" &&
      "bg-[#cf5b40] text-white shadow-sm shadow-[#cf5b40]/25 hover:bg-[#bd4f37] focus-visible:outline-[#cf5b40]",
    variant === "secondary" &&
      "bg-[#fff3ed] text-[#b84f38] hover:bg-[#ffe7dd] focus-visible:outline-[#cf5b40]",
    variant === "ghost" &&
      "bg-transparent text-stone-700 hover:bg-stone-100 focus-visible:outline-stone-500",
    variant === "danger" &&
      "bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700 focus-visible:outline-rose-600",
    variant === "outline" &&
      "border border-stone-200 bg-white text-stone-700 hover:border-[#cf5b40]/40 hover:bg-[#fff8f4] focus-visible:outline-[#cf5b40]",
  );
}

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonStyleOptions {}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      type={type}
      {...props}
    />
  );
}
