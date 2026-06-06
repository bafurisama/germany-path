'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { computeProgress, computeAvailableNodes } from '@/lib/progressEngine'
import { PATH_NODES, STAGES } from '@/lib/pathConfig'
import { ComputedProgress, NodeStatus, PathNode, UserProfile } from '@/types'
import { ArrowRight, Clock, Shield, CheckCircle2, Zap, Map, LogOut, Lock, ChevronRight, Sun } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { triggerCompletionMoment, triggerUnlockMoment } from '@/components/nodes/UnlockMoment'
import { getNodeIcon } from '@/lib/nodeIcons'

const STAGE_COPY: Record<number, { headline: string; sub: string; phase: string }> = {
  1: { headline: 'Building the foundations of your life in Germany.', sub: 'Every system here begins with these steps.', phase: 'Arrival Phase' },
  2: { headline: 'Your life in Germany is stabilizing.', sub: 'You\'ve passed the hardest part.', phase: 'Stabilization Phase' },
  3: { headline: 'Germany is becoming yours.', sub: 'Roots are growing. You are integrating.', phase: 'Integration Phase' },
  4: { headline: 'Permanent residency is in sight.', sub: 'The long-term future is becoming clear.', phase: 'Settlement Phase' },
  5: { headline: 'Citizenship is the final horizon.', sub: 'You have earned this milestone.', phase: 'Citizenship Phase' },
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [nodeStates, setNodeStates] = useState<Record<string, NodeStatus>>({})
  const [progress, setProgress] = useState<ComputedProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedNode, setExpandedNode] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (!p?.onboarding_completed) { router.push('/onboarding'); return }

      const prof: UserProfile = {
        id: p.id, email: p.email || user.email || '',
        nationality: p.nationality || '', visaType: p.visa_type || '',
        city: p.city || '', maritalStatus: p.marital_status || '',
        arrivalDate: p.arrival_date || '', employmentStatus: p.employment_status || '',
        hasAnmeldung: p.has_anmeldung ?? false, hasHealthInsurance: p.has_health_insurance ?? false,
        hasTaxId: p.has_tax_id ?? false, hasBankAccount: p.has_bank_account ?? false,
        hasResidencePermit: p.has_residence_permit ?? false, hasSocialSecurityNumber: p.has_social_security_number ?? false,
        germanLevel: p.german_level || 'none', onboardingCompleted: true, createdAt: p.created_at || '',
      }

      const { data: nd } = await supabase.from('user_node_states').select('*').eq('user_id', user.id)
      const states: Record<string, NodeStatus> = {}
      nd?.forEach((n: any) => { states[n.node_id] = n.status })

      setProfile(prof)
      setNodeStates(computeAvailableNodes(states, prof))
      setProgress(computeProgress(states, prof))
      setLoading(false)
    }
    load()
  }, [])

  async function updateNodeStatus(nodeId: string, status: NodeStatus) {
    if (!profile) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_node_states').upsert({
      user_id: user.id, node_id: nodeId, status,
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      ...(status === 'in_progress' ? { started_at: new Date().toISOString() } : {}),
    })
    const newStates = { ...nodeStates, [nodeId]: status }
    const resolved = computeAvailableNodes(newStates, profile)
    if (status === 'completed') {
      const node = PATH_NODES.find(n => n.id === nodeId)
      if (node) { triggerCompletionMoment(node); setTimeout(() => triggerUnlockMoment(node), 700) }
    }
    setNodeStates(resolved)
    setProgress(computeProgress(newStates, profile))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b7dd8, #2a9d6e)', margin: '0 auto 16px', animation: 'pulse 1.5s ease infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading your path…</p>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
  if (!profile || !progress) return null

  const stageInfo = STAGES[progress.currentStage - 1]
  const stageCopy = STAGE_COPY[progress.currentStage]
  const stageNodes = PATH_NODES.filter(n => n.stage === progress.currentStage && (!n.applicableVisaTypes || n.applicableVisaTypes.includes(profile.visaType)))
  const stagePct = stageNodes.length > 0 ? Math.round((stageNodes.filter(n => nodeStates[n.id] === 'completed').length / stageNodes.length) * 100) : 0
  const availableNodes = PATH_NODES.filter(n => nodeStates[n.id] === 'available')
  const inProgressNodes = PATH_NODES.filter(n => nodeStates[n.id] === 'in_progress')
  const completedNodes = PATH_NODES.filter(n => nodeStates[n.id] === 'completed')
  const allRelevant = PATH_NODES.filter(n => !n.applicableVisaTypes || n.applicableVisaTypes.includes(profile.visaType))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      <div className="atmo-bg" />

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 56,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(250,248,244,0.92)', backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 0 var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #3b7dd8, #2a9d6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>G</div>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Germany Path</span>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[{ href: '/dashboard', label: 'Dashboard', active: true }, { href: '/journey', label: 'Journey', active: false }].map(({ href, label, active }) => (
              <Link key={href} href={href} style={{
                padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 400,
                textDecoration: 'none', color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? '#fff' : 'transparent',
                border: active ? '1px solid var(--border)' : '1px solid transparent',
                boxShadow: active ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s',
              }}>{label}</Link>
            ))}
          </div>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
          borderRadius: 8, background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}>
          <LogOut size={12} /> Sign out
        </button>
      </nav>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 clamp(16px,4vw,32px) 80px', position: 'relative', zIndex: 1 }}>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <div style={{ padding: 'clamp(24px,5vw,44px) 0 36px', animation: 'fadeUp 0.5s ease both' }}>
          <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Stage headline */}
            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 16,
                padding: '4px 12px 4px 8px', borderRadius: 100,
                background: `${stageInfo.accentColor}14`,
                border: `1px solid ${stageInfo.accentColor}28`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: stageInfo.accentColor }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: stageInfo.accentColor, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {stageCopy.phase}
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 700,
                letterSpacing: '-0.025em', lineHeight: 1.15,
                marginBottom: 10, color: 'var(--text-primary)',
              }}>
                {stageCopy.headline}
              </h1>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
                {stageCopy.sub}
              </p>

              {/* Stage progress bar */}
              <div style={{ maxWidth: 340 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                    {stageInfo.title} — {stageNodes.filter(n => nodeStates[n.id] === 'completed').length} of {stageNodes.length} complete
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: stageInfo.accentColor }}>{stagePct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}>
                  <div style={{
                    height: '100%', width: `${stagePct}%`,
                    background: `linear-gradient(90deg, ${stageInfo.accentColor}cc, ${stageInfo.accentColor})`,
                    borderRadius: 3, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: `0 0 8px ${stageInfo.accentColor}40`,
                    animation: 'progressFill 1.2s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>
              </div>
            </div>

            {/* Progress ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={65} cy={65} r={54} fill="none" stroke="var(--bg-3)" strokeWidth={7}
                  style={{ filter: 'drop-shadow(inset 0 1px 2px rgba(0,0,0,0.05))' }} />
                <circle cx={65} cy={65} r={54} fill="none"
                  stroke={stageInfo.accentColor} strokeWidth={7} strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress.percentage / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 6px ${stageInfo.accentColor}50)` }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-primary)' }}>{progress.percentage}%</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── COUNTDOWN PILLS ──────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 36, flexWrap: 'wrap', animation: 'fadeUp 0.5s ease 0.08s both' }}>
          {progress.prMonthsRemaining !== null && (
            <Pill icon="🏛️" label="Permanent Residency" value={progress.prMonthsRemaining} unit="months" color="#7c5cbf" note={profile.visaType === 'blue_card' ? 'Blue Card path' : 'Standard path'} />
          )}
          {progress.citizenshipMonthsRemaining !== null && (
            <Pill icon="🇩🇪" label="Citizenship" value={progress.citizenshipMonthsRemaining} unit="months" color="#d97706" />
          )}
          {completedNodes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 100, background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: 14 }}>✅</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2a9d6e' }}>{completedNodes.length} milestone{completedNodes.length !== 1 ? 's' : ''} complete</span>
            </div>
          )}
        </div>

        {/* ── NEXT CRITICAL STEP ───────────────────────────────── */}
        {progress.nextCriticalNode && (
          <NextStep node={progress.nextCriticalNode} nodeStates={nodeStates} onComplete={() => updateNodeStatus(progress.nextCriticalNode!.id, 'completed')} onStart={() => updateNodeStatus(progress.nextCriticalNode!.id, 'in_progress')} />
        )}

        {/* ── MAIN GRID ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 24, alignItems: 'start' }}>

          {/* Milestone list */}
          <div style={{ animation: 'fadeUp 0.5s ease 0.25s both' }}>
            {inProgressNodes.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <SLabel>In progress</SLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {inProgressNodes.map((node, i) => (
                    <MCard key={node.id} node={node} status="in_progress"
                      expanded={expandedNode === node.id}
                      onExpand={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                      onUpdate={updateNodeStatus} delay={i * 0.05} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <SLabel>Available to unlock</SLabel>
              {availableNodes.length === 0 ? (
                <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  All available milestones in progress. You're doing well.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {availableNodes.map((node, i) => (
                    <MCard key={node.id} node={node} status="available"
                      expanded={expandedNode === node.id}
                      onExpand={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                      onUpdate={updateNodeStatus} delay={i * 0.05} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp 0.5s ease 0.35s both' }}>

            {/* Journey progress */}
            <div className="card" style={{ padding: 20 }}>
              <SLabel>Your journey</SLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                {STAGES.map((stage) => {
                  const sn = PATH_NODES.filter(n => n.stage === stage.id && (!n.applicableVisaTypes || n.applicableVisaTypes.includes(profile.visaType)))
                  const done = sn.filter(n => nodeStates[n.id] === 'completed').length
                  const pct = sn.length > 0 ? Math.round((done / sn.length) * 100) : 0
                  const isCurrent = progress.currentStage === stage.id
                  const isPast = progress.currentStage > stage.id
                  const isFuture = progress.currentStage < stage.id

                  return (
                    <div key={stage.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 800,
                          background: isPast ? `${stage.accentColor}18` : isCurrent ? `${stage.accentColor}14` : 'var(--bg-3)',
                          border: `1px solid ${isCurrent ? stage.accentColor + '35' : isPast ? stage.accentColor + '25' : 'var(--border)'}`,
                          color: isPast || isCurrent ? stage.accentColor : 'var(--text-muted)',
                        }}>
                          {isPast ? '✓' : stage.id}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? 'var(--text-primary)' : isPast ? 'var(--text-secondary)' : 'var(--text-muted)', flex: 1 }}>
                          {stage.title}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? stage.accentColor : 'var(--text-muted)' }}>
                          {isFuture ? <Lock size={10} /> : `${pct}%`}
                        </span>
                      </div>
                      {!isFuture && (
                        <div style={{ height: 3, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden', marginLeft: 30 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: isCurrent ? `linear-gradient(90deg, ${stage.accentColor}80, ${stage.accentColor})` : stage.accentColor + '50', borderRadius: 2, transition: 'width 1s ease' }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Journey CTA */}
            <Link href="/journey" style={{ textDecoration: 'none' }}>
              <div className="card-warm" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <span style={{ fontSize: 14 }}>🗺️</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Journey Map</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>All stages, dependencies & your path</p>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>
            </Link>

            {/* Recent wins */}
            {completedNodes.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <SLabel>Recent wins</SLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 4 }}>
                  {completedNodes.slice(-5).reverse().map((node) => {
                    const { icon, color } = getNodeIcon(node.id, node.category)
                    return (
                      <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ fontSize: 14 }}>{icon}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{node.title}</span>
                        <CheckCircle2 size={12} color="#2a9d6e" />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes progressFill { from{width:0%} }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>
    </div>
  )
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{children}</p>
}

function Pill({ icon, label, value, unit, color, note }: { icon: string; label: string; value: number; unit: string; color: string; note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 100, background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{unit}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{note || label}</div>
      </div>
    </div>
  )
}

function NextStep({ node, nodeStates, onComplete, onStart }: { node: PathNode; nodeStates: Record<string, NodeStatus>; onComplete: () => void; onStart: () => void }) {
  const { icon, color, bg } = getNodeIcon(node.id, node.category)
  const status = nodeStates[node.id]
  const unlockNames = node.unlocks.map(id => PATH_NODES.find(n => n.id === id)?.title).filter(Boolean)

  return (
    <div style={{
      marginBottom: 32, padding: '24px 28px', borderRadius: 18,
      background: '#fff', border: `1px solid ${color}22`,
      boxShadow: `var(--shadow-md), 0 0 0 1px ${color}10`,
      position: 'relative', overflow: 'hidden',
      animation: 'fadeUp 0.5s ease 0.15s both',
    }}>
      {/* Subtle tint */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 280, height: '100%', background: `radial-gradient(ellipse at 100% 50%, ${bg} 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next step</p>
              <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{node.title}</h2>
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 14, maxWidth: 460 }}>{node.whyItMatters}</p>

          {unlockNames.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>Unlocks:</span>
              {unlockNames.slice(0, 4).map((n, i) => (
                <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: bg, color, fontWeight: 600 }}>{n}</span>
              ))}
            </div>
          )}
          {node.typicalDuration && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> {node.typicalDuration}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignSelf: 'center' }}>
          {status !== 'completed' && (
            <button onClick={onComplete} style={{
              padding: '11px 22px', borderRadius: 10, border: 'none',
              background: color, color: '#fff', cursor: 'pointer',
              fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
              boxShadow: `0 4px 16px ${color}35`,
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'opacity 0.2s, transform 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity='0.9'; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)' }}
            >
              <CheckCircle2 size={15} /> Complete step
            </button>
          )}
          {status === 'available' && (
            <button onClick={onStart} style={{
              padding: '10px 22px', borderRadius: 10,
              border: `1px solid ${color}30`, background: bg,
              color, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            }}>Start now →</button>
          )}
        </div>
      </div>
    </div>
  )
}

function MCard({ node, status, expanded, onExpand, onUpdate, delay }: {
  node: PathNode; status: NodeStatus; expanded: boolean
  onExpand: () => void; onUpdate: (id: string, s: NodeStatus) => void; delay: number
}) {
  const { icon, color, bg } = getNodeIcon(node.id, node.category)
  const isIP = status === 'in_progress'

  return (
    <div className="card" style={{
      overflow: 'hidden', transition: 'box-shadow 0.2s',
      border: `1px solid ${isIP ? color + '28' : 'var(--border)'}`,
      background: isIP ? `linear-gradient(135deg, #fff, ${bg}88)` : '#fff',
      animation: `fadeUp 0.4s ease ${delay}s both`,
    }}>
      <div onClick={onExpand} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, color: 'var(--text-primary)' }}>{node.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            {node.typicalDuration && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} />{node.typicalDuration}</span>}
            {node.unlocks.length > 0 && <span style={{ color, fontWeight: 600 }}>+{node.unlocks.length} unlocks</span>}
          </div>
        </div>
        <ChevronRight size={14} color="var(--text-muted)" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)', paddingTop: 14, animation: 'fadeIn 0.2s ease both' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 12 }}>{node.description}</p>
          {node.unlocks.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {node.unlocks.map(id => { const n = PATH_NODES.find(x => x.id === id); return n ? <span key={id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: bg, color, fontWeight: 500 }}>{n.title}</span> : null })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 7 }}>
            {status === 'available' && (
              <button onClick={() => onUpdate(node.id, 'in_progress')} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                Mark in progress
              </button>
            )}
            <button onClick={() => onUpdate(node.id, 'completed')} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: color, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', boxShadow: `0 2px 8px ${color}30` }}>
              Complete ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
