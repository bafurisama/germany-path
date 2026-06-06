'use client'
import { Lock } from 'lucide-react'
import { Stage, PathNode, NodeStatus } from '@/types'
import { Badge } from '@/components/ui/badge'

interface FogOfFutureProps {
  stage: Stage
  nodes: PathNode[]
  monthsUntilEligible?: number
  remainingRequirements?: string[]
}

export function FogOfFuture({ stage, nodes, monthsUntilEligible, remainingRequirements }: FogOfFutureProps) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 14,
        border: `1px solid ${stage.accentColor}20`,
        overflow: 'hidden',
        marginBottom: 8,
      }}
    >
      {/* Blurred background content */}
      <div style={{ filter: 'blur(3px)', opacity: 0.3, padding: '16px 20px', pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${stage.accentColor}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: stage.accentColor,
          }}>{stage.id}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{stage.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stage.subtitle}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {nodes.slice(0, 3).map(node => (
            <div key={node.id} style={{
              height: 36, borderRadius: 8, background: 'var(--bg-3)',
              border: '1px solid var(--border)',
            }} />
          ))}
        </div>
      </div>

      {/* Fog overlay gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${stage.accentColor}08 0%, var(--bg)60 100%)`,
        backdropFilter: 'blur(1px)',
      }} />

      {/* Lock overlay content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${stage.accentColor}15`,
          border: `1px solid ${stage.accentColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}>
          <Lock size={18} color={stage.accentColor} />
        </div>

        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: 'var(--text-primary)' }}>
          {stage.title}
        </div>

        {monthsUntilEligible !== undefined && monthsUntilEligible > 0 && (
          <div style={{
            fontSize: 13, color: stage.accentColor, marginBottom: 12,
            fontWeight: 500,
          }}>
            Available in ~{monthsUntilEligible} months
          </div>
        )}

        {remainingRequirements && remainingRequirements.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 280 }}>
            {remainingRequirements.map((req, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 4,
                background: 'var(--bg-4)', border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}>
                {req}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
