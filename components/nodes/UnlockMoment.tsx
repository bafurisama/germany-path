'use client'
import { Unlock, Zap, Shield, Star } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { PathNode } from '@/types'
import { PATH_NODES } from '@/lib/pathConfig'

const UNLOCK_ICONS: Record<string, React.FC<any>> = {
  milestone: Shield,
  language: Star,
  legal: Zap,
  default: Unlock,
}

export function triggerUnlockMoment(completedNode: PathNode) {
  const unlockedNodes = completedNode.unlocks
    .map(id => PATH_NODES.find(n => n.id === id))
    .filter(Boolean) as PathNode[]

  if (unlockedNodes.length === 0) return

  // Single unlock
  if (unlockedNodes.length === 1) {
    const unlocked = unlockedNodes[0]
    const IconComp = UNLOCK_ICONS[unlocked.category] || UNLOCK_ICONS.default

    toast({
      variant: 'unlock',
      title: `Unlocked: ${unlocked.title}`,
      description: `Completing ${completedNode.title} opened a new path.`,
      icon: (
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(176,110,243,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <IconComp size={14} color="var(--accent-purple)" />
        </div>
      ),
    })
    return
  }

  // Multiple unlocks
  toast({
    variant: 'unlock',
    title: `${unlockedNodes.length} tasks unlocked`,
    description: unlockedNodes.slice(0, 3).map(n => n.title).join(', ') + (unlockedNodes.length > 3 ? '…' : ''),
    icon: (
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'rgba(176,110,243,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Zap size={14} color="var(--accent-purple)" />
      </div>
    ),
  })
}

export function triggerCompletionMoment(node: PathNode) {
  toast({
    variant: 'success',
    title: `${node.title} completed`,
    description: node.unlocks.length > 0
      ? `${node.unlocks.length} task${node.unlocks.length > 1 ? 's' : ''} now available.`
      : 'Progress saved.',
    icon: (
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'rgba(56,201,160,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 14 }}>✓</span>
      </div>
    ),
  })
}
