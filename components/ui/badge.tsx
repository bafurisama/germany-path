import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[rgba(79,142,247,0.2)]',
        green: 'bg-[var(--accent-green-dim)] text-[var(--accent-green)] border border-[rgba(56,201,160,0.2)]',
        amber: 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border border-[rgba(245,166,35,0.2)]',
        purple: 'bg-[var(--accent-purple-dim)] text-[var(--accent-purple)] border border-[rgba(176,110,243,0.2)]',
        red: 'bg-[rgba(255,107,107,0.12)] text-[var(--accent-red)] border border-[rgba(255,107,107,0.2)]',
        outline: 'border border-[var(--border)] text-[var(--text-muted)] bg-transparent',
        muted: 'bg-[var(--bg-4)] text-[var(--text-muted)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
