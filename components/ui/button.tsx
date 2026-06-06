import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] disabled:pointer-events-none disabled:opacity-50 font-sans',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent-blue)] text-white hover:opacity-90',
        destructive: 'bg-[var(--accent-red)] text-white hover:opacity-90',
        outline: 'border border-[var(--border-bright)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]',
        secondary: 'bg-[var(--bg-3)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        ghost: 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-3)] hover:text-[var(--text-secondary)]',
        success: 'bg-[var(--accent-green)] text-[#0a0a0f] hover:opacity-90',
        gradient: 'bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-green)] text-white hover:opacity-90',
        link: 'text-[var(--accent-blue)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 py-1 text-xs rounded-[8px]',
        lg: 'h-12 px-7 py-3 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
