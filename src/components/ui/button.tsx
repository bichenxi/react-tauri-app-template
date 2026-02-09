import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-primary to-orange-600 text-white shadow-[0_4px_14px_0_rgba(255,144,0,0.39)] hover:shadow-[0_6px_20px_rgba(255,144,0,0.23)] hover:-translate-y-0.5 border-none",
        destructive: "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md hover:shadow-lg hover:bg-red-600",
        outline: "border-none bg-white/50 text-gray-700 shadow-sm ring-1 ring-white/10 hover:bg-white hover:text-gray-900 hover:shadow-md backdrop-blur-sm",
        secondary: "bg-gray-100/80 text-gray-900 hover:bg-gray-200/80 border-none",
        ghost: "hover:bg-black/5 text-gray-600 hover:text-gray-900",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
