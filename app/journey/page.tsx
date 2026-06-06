'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { computeAvailableNodes, computeProgress } from '@/lib/progressEngine'
import { PATH_NODES, STAGES } from '@/lib/pathConfig'
import { triggerCompletionMoment, triggerUnlockMoment } from '@/components/nodes/UnlockMoment'
import { NodeStatus, PathNode, UserProfile } from '@/types'
import { CheckCircle2, Clock, ExternalLink, X, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getNodeIcon } from '@/lib/nodeIcons'

// ─────────────────────────────────────────────────────────────
// NODE POSITIONS: absolute x/y on the 900×1100 canvas
// Bottom = early journey, Top = late journey (like mockup)
// ─────────────────────────────────────────────────────────────
const POSITIONS: Record<string, { x: number; y: number }> = {
  // Stage 1 – bottom
  anmeldung:               { x: 160, y: 820 },
  sim_card:                { x:  30, y: 930 },
  health_insurance:        { x: 350, y: 760 },
  rundfunkbeitrag:         { x: 560, y: 880 },
  // Stage 1/2 mid
  tax_id:                  { x: 200, y: 640 },
  bank_account:            { x:  50, y: 660 },
  social_security_number:  { x: 380, y: 620 },
  // Stage 2
  residence_permit:        { x: 200, y: 510 },
  blue_card:               { x: 200, y: 400 },
  schufa_first_entry:      { x: 500, y: 580 },
  driver_license_conversion:{ x: 580, y: 700 },
  doctor_registration:     { x: 390, y: 480 },
  tax_class_optimization:  { x:  40, y: 530 },
  // Stage 3
  german_a1:               { x:  30, y: 780 },
  german_a2:               { x:  30, y: 700 },
  german_b1:               { x:  50, y: 350 },
  integrationskurs:        { x: 560, y: 460 },
  pension_tracking:        { x: 420, y: 360 },
  annual_tax_return:       { x:  30, y: 440 },
  // Stage 4
  settlement_permit_eligibility: { x: 420, y: 270 },
  pr_fast_track:           { x: 210, y: 230 },
  pr_standard:             { x: 410, y: 180 },
  // Stage 5
  citizenship_residency:   { x: 220, y: 120 },
  citizenship_language:    { x:  40, y: 200 },
  einbuergerungstest:      { x: 430,  y: 100 },
  citizenship_application: { x: 330,  y:  30 },
}

const NW = 148, NH = 76 // node width/height

export default function JourneyPage() {
  const [profile, setProfile]           = useState<UserProfile | null>(null)
  const [nodeStates, setNodeStates]     = useState<Record<string, NodeStatus>>({})
  const [selectedNode, setSelectedNode] = useState<PathNode | null>(null)
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set([1, 2]))
  const [loading, setLoading]           = useState(true)
  const supabase = createClient()
  const router   = useRouter()

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
        hasResidencePermit: p.has_residence_permit ?? false,
        hasSocialSecurityNumber: p.has_social_security_number ?? false,
        germanLevel: p.german_level || 'none', onboardingCompleted: true, createdAt: p.created_at || '',
      }
      const { data: nd } = await supabase.from('user_node_states').select('*').eq('user_id', user.id)
      const states: Record<string, NodeStatus> = {}
      nd?.forEach((n: any) => { states[n.node_id] = n.status })
      setProfile(prof)
      setNodeStates(computeAvailableNodes(states, prof))
      setLoading(false)
    }
    load()
  }, [])

  async function updateNode(nodeId: string, status: NodeStatus) {
    if (!profile) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_node_states').upsert({
      user_id: user.id, node_id: nodeId, status,
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      ...(status === 'in_progress' ? { started_at: new Date().toISOString() } : {}),
    })
    if (status === 'completed') {
      const node = PATH_NODES.find(n => n.id === nodeId)
      if (node) { triggerCompletionMoment(node); setTimeout(() => triggerUnlockMoment(node), 700) }
    }
    const newStates = { ...nodeStates, [nodeId]: status }
    setNodeStates(computeAvailableNodes(newStates, profile))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 13 }}>
      Loading your journey…
    </div>
  )
  if (!profile) return null

  const progress = computeProgress(nodeStates, profile)
  const relevant = PATH_NODES.filter(n => !n.applicableVisaTypes || n.applicableVisaTypes.includes(profile.visaType))
  const completedCount = relevant.filter(n => nodeStates[n.id] === 'completed').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* ── NAV ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,4vw,32px)', height: 56,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(250,248,244,0.95)', backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 200,
        boxShadow: '0 1px 0 var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#3b7dd8,#2a9d6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>G</div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Germany Path</span>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[{ href: '/dashboard', label: 'Dashboard', active: false }, { href: '/journey', label: 'Journey', active: true }].map(({ href, label, active }) => (
              <Link key={href} href={href} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 13, fontWeight: active ? 600 : 400, textDecoration: 'none', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', background: active ? '#fff' : 'transparent', border: active ? '1px solid var(--border)' : '1px solid transparent', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}>{label}</Link>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{completedCount}/{relevant.length} complete</span>
      </nav>

      {/* ── DESKTOP MAP (hidden on mobile via CSS) ── */}
      <div className="journey-desktop" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Map container — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', position: 'relative', minHeight: 0 }}>
          {/* Fixed size canvas */}
          <div style={{ position: 'relative', width: 900, minHeight: 1060, margin: '0 auto' }}>

            {/* ── WATERCOLOR BACKGROUND ── */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, borderRadius: 0, overflow: 'hidden' }}>
              <svg viewBox="0 0 900 1060" xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
                <defs>
                  <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
                  <filter id="blur6"><feGaussianBlur stdDeviation="7"/></filter>
                  <filter id="blur12"><feGaussianBlur stdDeviation="14"/></filter>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4e8f0" stopOpacity="0.7"/>
                    <stop offset="60%" stopColor="#e8f0e4" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#eef4e0" stopOpacity="0.4"/>
                  </linearGradient>
                  <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b8cc90" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#90a870" stopOpacity="0.3"/>
                  </linearGradient>
                </defs>
                {/* Sky */}
                <rect width="900" height="1060" fill="url(#skyGrad)"/>
                {/* Distant mountains */}
                <ellipse cx="150" cy="350" rx="260" ry="180" fill="#b0c8a0" opacity="0.3" filter="url(#blur12)"/>
                <ellipse cx="680" cy="300" rx="300" ry="200" fill="#a8c098" opacity="0.28" filter="url(#blur12)"/>
                <ellipse cx="450" cy="400" rx="200" ry="140" fill="#b8d0a8" opacity="0.22" filter="url(#blur12)"/>
                {/* Rolling hills */}
                <ellipse cx="100" cy="700" rx="200" ry="130" fill="#a8c488" opacity="0.35" filter="url(#blur6)"/>
                <ellipse cx="820" cy="650" rx="180" ry="120" fill="#b0cc90" opacity="0.32" filter="url(#blur6)"/>
                <ellipse cx="450" cy="900" rx="400" ry="180" fill="url(#groundGrad)" filter="url(#blur6)"/>
                {/* River — winds from bottom-left to upper-right */}
                <path d="M 80 1060 Q 160 900, 220 780 Q 300 640, 340 520 Q 380 400, 420 280 Q 460 160, 500 60"
                  stroke="#7ab4d0" strokeWidth="32" fill="none" opacity="0.3" filter="url(#blur6)" strokeLinecap="round"/>
                <path d="M 80 1060 Q 160 900, 220 780 Q 300 640, 340 520 Q 380 400, 420 280 Q 460 160, 500 60"
                  stroke="#a0cce0" strokeWidth="18" fill="none" opacity="0.2" filter="url(#blur3)" strokeLinecap="round"/>
                {/* Path / road */}
                <path d="M 280 1040 Q 260 880, 250 760 Q 240 640, 260 520 Q 280 400, 300 280 Q 320 160, 360 60"
                  stroke="rgba(160,140,100,0.45)" strokeWidth="10" fill="none"
                  strokeDasharray="22,14" strokeLinecap="round" filter="url(#blur3)"/>
                {/* Trees left */}
                {[[30,820],[55,860],[20,900],[40,760],[60,940]].map(([cx,cy],i)=>(
                  <ellipse key={`tl${i}`} cx={cx} cy={cy} rx={20+i*4} ry={32+i*6} fill="#6a9a50" opacity={0.28+i*0.04} filter="url(#blur3)"/>
                ))}
                {/* Trees right */}
                {[[850,700],[870,750],[840,800],[860,660],[880,840]].map(([cx,cy],i)=>(
                  <ellipse key={`tr${i}`} cx={cx} cy={cy} rx={18+i*3} ry={28+i*5} fill="#7aaa58" opacity={0.26+i*0.04} filter="url(#blur3)"/>
                ))}
                {/* Mid trees */}
                {[[720,500],[700,560],[740,460]].map(([cx,cy],i)=>(
                  <ellipse key={`tm${i}`} cx={cx} cy={cy} rx={16+i*4} ry={26+i*6} fill="#80aa60" opacity={0.22+i*0.04} filter="url(#blur3)"/>
                ))}
                {/* City silhouette — top right */}
                {[[720,200,16,60],[740,180,12,80],[760,210,20,50],[785,190,14,70],[805,205,18,55]].map(([x,y,w,h],i)=>(
                  <rect key={`b${i}`} x={x} y={y} width={w} height={h} fill="#8890a0" opacity="0.18" rx="2" filter="url(#blur3)"/>
                ))}
                {/* TV Tower */}
                <rect x="832" y="140" width="3" height="110" fill="#7880a0" opacity="0.22" filter="url(#blur3)"/>
                <ellipse cx="833" cy="160" rx="7" ry="11" fill="#7880a0" opacity="0.18" filter="url(#blur3)"/>
              </svg>
            </div>

            {/* ── SVG CONNECTION LINES ── */}
            <svg style={{ position: 'absolute', inset: 0, width: 900, height: 1060, zIndex: 1, pointerEvents: 'none' }}>
              {relevant.map((node: PathNode) =>
                node.dependencies.map((depId: string) => {
                  const dep = PATH_NODES.find(n => n.id === depId)
                  if (!dep) return null
                  const fromPos = POSITIONS[depId]
                  const toPos   = POSITIONS[node.id]
                  if (!fromPos || !toPos) return null
                  const isDone = nodeStates[depId] === 'completed'
                  const fx = fromPos.x + NW / 2, fy = fromPos.y
                  const tx = toPos.x + NW / 2,   ty = toPos.y + NH
                  const my = (fy + ty) / 2
                  return (
                    <path key={`${depId}→${node.id}`}
                      d={`M${fx},${fy} C${fx},${my} ${tx},${my} ${tx},${ty}`}
                      fill="none"
                      stroke={isDone ? '#2a9d6e' : 'rgba(100,100,80,0.22)'}
                      strokeWidth={isDone ? 2.5 : 1.5}
                      strokeDasharray={isDone ? 'none' : '6,5'}
                      strokeLinecap="round"
                      style={{ transition: 'stroke 0.5s' }}
                    />
                  )
                })
              )}
            </svg>

            {/* ── NODE CARDS ── */}
            {relevant.map((node: PathNode) => {
              const pos    = POSITIONS[node.id]
              if (!pos) return null
              const status = nodeStates[node.id] || 'locked'
              const isSel  = selectedNode?.id === node.id
              const { icon, color, bg } = getNodeIcon(node.id, node.category)
              const isLocked    = status === 'locked'
              const isCompleted = status === 'completed'
              const isInProg    = status === 'in_progress'

              return (
                <div key={node.id}
                  onClick={() => !isLocked && setSelectedNode(isSel ? null : node)}
                  style={{
                    position: 'absolute', left: pos.x, top: pos.y,
                    width: NW, zIndex: isSel ? 10 : 2,
                    background: isCompleted ? 'rgba(255,255,255,0.97)' : isSel ? '#fff' : 'rgba(255,255,255,0.90)',
                    border: `1.5px solid ${isSel ? color : isCompleted ? '#2a9d6e40' : isInProg ? color+'50' : 'rgba(26,24,20,0.1)'}`,
                    borderRadius: 14, padding: '10px 11px',
                    boxShadow: isSel
                      ? `0 6px 24px ${color}25, 0 2px 8px rgba(0,0,0,0.10)`
                      : isCompleted ? '0 2px 10px rgba(42,157,110,0.12)' : '0 2px 10px rgba(0,0,0,0.07)',
                    opacity: isLocked ? 0.42 : 1,
                    cursor: isLocked ? 'default' : 'pointer',
                    transform: isSel ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                    backdropFilter: 'blur(10px)',
                    userSelect: 'none',
                  }}
                >
                  {/* Icon + title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: isLocked ? 'var(--bg-3)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                      {isLocked ? '🔒' : icon}
                    </div>
                    <p style={{ fontWeight: 600, fontSize: 10.5, lineHeight: 1.35, color: isLocked ? 'var(--text-muted)' : 'var(--text-primary)', flex: 1 }}>
                      {node.title}
                    </p>
                  </div>
                  {/* Subtitle + status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 9.5, color: 'var(--text-muted)', lineHeight: 1.3, flex: 1 }}>
                      {isLocked && node.dependencies.length > 0
                        ? `Req: ${node.dependencies.slice(0,1).map(d => PATH_NODES.find(n=>n.id===d)?.title?.split(' ')[0]).join(', ')}`
                        : node.typicalDuration?.split('–')[0] + (node.typicalDuration?.includes('–') ? '…' : '')
                      }
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 4 }}>
                      {node.unlocks.length > 0 && !isLocked && (
                        <span style={{ fontSize: 8.5, padding: '1px 4px', borderRadius: 3, background: bg, color, fontWeight: 700 }}>+{node.unlocks.length}</span>
                      )}
                      {isCompleted && <CheckCircle2 size={11} color="#2a9d6e" />}
                      {isInProg && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b7dd8', boxShadow: '0 0 5px #3b7dd8' }} />}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* ── LEGEND (top-right) ── */}
            <div style={{ position: 'absolute', right: 16, top: 16, zIndex: 5, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', border: '1px solid rgba(26,24,20,0.09)', borderRadius: 12, padding: '13px 15px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', minWidth: 140 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>Journey Legend</p>
              {[
                { dot: '#2a9d6e', label: 'Completed' },
                { dot: '#3b7dd8', label: 'In Progress' },
                { dot: '#d97706', label: 'Available' },
                { dot: 'rgba(26,24,20,0.2)', label: 'Locked' },
              ].map(({ dot, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 18, height: 0, borderTop: '1.5px dashed rgba(100,100,80,0.4)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Future Path</span>
              </div>
            </div>

            {/* ── PROGRESS CARD (top-left) ── */}
            <div style={{ position: 'absolute', left: 16, top: 16, zIndex: 5, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', border: '1px solid rgba(26,24,20,0.09)', borderRadius: 12, padding: '14px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', width: 190 }}>
              <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 3, color: 'var(--text-primary)' }}>Your Progress</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Keep going! You're building your future in Germany.
              </p>
              <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${progress.percentage}%`, background: 'linear-gradient(90deg,#3b7dd8,#2a9d6e)', borderRadius: 2, transition: 'width 1s ease' }} />
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>{completedCount} of {relevant.length} milestones completed</p>
              <Link href="/dashboard" style={{ fontSize: 11, color: '#3b7dd8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                View progress details <ArrowRight size={10} />
              </Link>
            </div>

            {/* ── JOURNEY INSIGHTS (middle-right) ── */}
            <div style={{ position: 'absolute', right: 16, top: 220, zIndex: 5, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', border: '1px solid rgba(26,24,20,0.09)', borderRadius: 12, padding: '13px 15px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', width: 190 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>💡</span>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Journey Insights</p>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 8 }}>
                {progress.prMonthsRemaining !== null
                  ? `${progress.prMonthsRemaining} months until permanent residency eligibility.`
                  : 'Complete Anmeldung first — it unlocks most other steps.'}
              </p>
              <Link href="/dashboard" style={{ fontSize: 11, color: '#3b7dd8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                View more insights <ArrowRight size={10} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── BOTTOM PANEL ── */}
        <BottomPanel
          node={selectedNode || progress.nextCriticalNode}
          isSelected={!!selectedNode}
          nodeStates={nodeStates}
          onUpdate={updateNode}
          onClose={() => setSelectedNode(null)}
        />
      </div>

      {/* ── MOBILE LIST (hidden on desktop via CSS) ── */}
      <div className="journey-mobile" style={{ padding: '24px 16px 100px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Your Journey</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          {completedCount} of {relevant.length} milestones complete
        </p>

        {/* Insights */}
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '11px 13px', marginBottom: 18, display: 'flex', gap: 9 }}>
          <span style={{ fontSize: 15 }}>💡</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Journey Insights</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {progress.prMonthsRemaining !== null ? `${progress.prMonthsRemaining} months to permanent residency.` : 'Complete your profile to see your timeline.'}
            </p>
          </div>
        </div>

        {/* Stage accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {STAGES.map(stage => {
            const sNodes = relevant.filter((n: PathNode) => n.stage === stage.id)
            const done   = sNodes.filter((n: PathNode) => nodeStates[n.id] === 'completed').length
            const pct    = sNodes.length > 0 ? Math.round((done / sNodes.length) * 100) : 0
            const isExp  = expandedStages.has(stage.id)
            const isCur  = progress.currentStage === stage.id
            const locked = sNodes.every((n: PathNode) => (nodeStates[n.id] || 'locked') === 'locked') && stage.id > 1

            return (
              <div key={stage.id}>
                <div onClick={() => setExpandedStages(prev => { const s = new Set(prev); s.has(stage.id) ? s.delete(stage.id) : s.add(stage.id); return s })}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 12, cursor: 'pointer', background: isCur ? '#fff' : 'rgba(255,255,255,0.7)', border: `1px solid ${isCur ? stage.accentColor+'30' : 'var(--border)'}`, boxShadow: isCur ? '0 1px 6px rgba(0,0,0,0.06)' : 'none', marginBottom: isExp ? 3 : 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${stage.accentColor}14`, border: `1.5px solid ${stage.accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: stage.accentColor, flexShrink: 0 }}>
                    {pct === 100 ? '✓' : locked ? '🔒' : stage.id}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{stage.title}</span>
                      {isCur && <span style={{ fontSize: 9, fontWeight: 700, color: stage.accentColor, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '1px 5px', borderRadius: 3, background: `${stage.accentColor}14` }}>Current</span>}
                    </div>
                    {!locked && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ height: 3, flex: 1, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${stage.accentColor}80,${stage.accentColor})`, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{done}/{sNodes.length}</span>
                      </div>
                    )}
                  </div>
                  {isExp ? <ChevronDown size={13} color="var(--text-muted)" /> : <ChevronRight size={13} color="var(--text-muted)" />}
                </div>

                {isExp && (
                  <div style={{ marginLeft: 10, marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {locked ? (
                      <div style={{ padding: '13px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: '1px dashed var(--border)', textAlign: 'center' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>🔒 {stage.title}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Complete earlier stages to unlock</p>
                      </div>
                    ) : sNodes.map((node: PathNode) => {
                      const status = nodeStates[node.id] || 'locked'
                      const isLocked = status === 'locked'
                      const { icon, color, bg } = getNodeIcon(node.id, node.category)
                      const isSel = selectedNode?.id === node.id
                      return (
                        <div key={node.id} onClick={() => !isLocked && setSelectedNode(isSel ? null : node)}
                          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 11px', borderRadius: 9, cursor: isLocked ? 'default' : 'pointer', background: isSel ? '#fff' : 'rgba(255,255,255,0.75)', border: `1px solid ${isSel ? color+'35' : status==='completed' ? '#2a9d6e18' : 'var(--border)'}`, opacity: isLocked ? 0.45 : 1, boxShadow: isSel ? '0 1px 6px rgba(0,0,0,0.07)' : 'none', transition: 'all 0.15s' }}>
                          <div style={{ width: 29, height: 29, borderRadius: 7, background: isLocked ? 'var(--bg-3)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                            {isLocked ? '🔒' : icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 1 }}>{node.title}</p>
                            {!isLocked && node.typicalDuration && <p style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9}/>{node.typicalDuration}</p>}
                          </div>
                          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                            {status === 'completed' && <CheckCircle2 size={13} color="#2a9d6e"/>}
                            {!isLocked && status !== 'completed' && (
                              <button onClick={e => { e.stopPropagation(); updateNode(node.id, 'completed') }}
                                style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #2a9d6e25', background: 'rgba(42,157,110,0.08)', color: '#2a9d6e', cursor: 'pointer', fontSize: 10, fontWeight: 600, fontFamily: 'inherit' }}>Done</button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile bottom panel */}
        {(selectedNode || progress.nextCriticalNode) && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200 }}>
            <BottomPanel
              node={selectedNode || progress.nextCriticalNode}
              isSelected={!!selectedNode}
              nodeStates={nodeStates}
              onUpdate={updateNode}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>

      <style>{`
        .journey-desktop { display: flex; }
        .journey-mobile  { display: none; }
        @media (max-width: 768px) {
          .journey-desktop { display: none !important; }
          .journey-mobile  { display: block !important; }
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  )
}

// ── BOTTOM PANEL ──────────────────────────────────────────────
function BottomPanel({ node, isSelected, nodeStates, onUpdate, onClose }: {
  node: PathNode | null; isSelected: boolean
  nodeStates: Record<string, NodeStatus>
  onUpdate: (id: string, s: NodeStatus) => void
  onClose: () => void
}) {
  if (!node) return null
  const { icon, color, bg } = getNodeIcon(node.id, node.category)
  const status = nodeStates[node.id] || 'available'
  const unlockNodes = node.unlocks.map(id => PATH_NODES.find(n => n.id === id)).filter(Boolean) as PathNode[]

  return (
    <div style={{ background: '#fff', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 24px rgba(0,0,0,0.09)' }}>
      {/* Main row */}
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '16px clamp(14px,3vw,32px)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Selected node info */}
          <div style={{ flex: '0 0 auto', maxWidth: 220, minWidth: 160 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {isSelected && status === 'completed' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <CheckCircle2 size={11} color="#2a9d6e"/>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#2a9d6e' }}>Completed</span>
                  </div>
                )}
                <p style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{node.title}</p>
              </div>
              {isSelected && (
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}><X size={14}/></button>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 6 }}>{node.description}</p>
            {node.typicalDuration && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9}/>{node.typicalDuration}</p>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} className="desktop-only" />

          {/* What this unlocks */}
          {unlockNodes.length > 0 && (
            <div style={{ flex: 1, minWidth: 160 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>What this unlocks for you</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>New paths are now available.</p>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {unlockNodes.slice(0, 4).map(un => {
                  const ui = getNodeIcon(un.id, un.category)
                  return (
                    <div key={un.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 7, background: ui.bg, border: `1px solid ${ui.color}20` }}>
                      <span style={{ fontSize: 12 }}>{ui.icon}</span>
                      <span style={{ fontSize: 11, color: ui.color, fontWeight: 600 }}>{un.title.split(' ').slice(0,3).join(' ')}</span>
                    </div>
                  )
                })}
              </div>
              {unlockNodes.length > 4 && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>+{unlockNodes.length - 4} more</p>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} className="desktop-only" />

          {/* Next step CTA */}
          <div style={{ flex: '0 0 auto', minWidth: 160 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
              {isSelected ? 'Update status' : 'Next recommended step'}
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 9 }}>{node.title}</p>
            {status !== 'completed' ? (
              <button onClick={() => onUpdate(node.id, 'completed')} style={{ padding: '10px 18px', borderRadius: 9, border: 'none', background: '#3b7dd8', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(59,125,216,0.3)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <CheckCircle2 size={13}/> Start this step
              </button>
            ) : (
              <button onClick={() => onUpdate(node.id, 'available')} style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', marginBottom: 6 }}>
                Undo completion
              </button>
            )}
            {node.officialLink && (
              <a href={node.officialLink} target="_blank" rel="noopener" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                <ExternalLink size={10}/> Why is this important?
              </a>
            )}
          </div>
        </div>
      </div>

      {/* More milestones */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px clamp(14px,3vw,32px)' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>More milestones on your path</p>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {PATH_NODES.filter(n => (nodeStates[n.id] === 'available' || nodeStates[n.id] === 'in_progress') && n.id !== node.id).slice(0, 6).map(n => {
              const ni = getNodeIcon(n.id, n.category)
              const s  = nodeStates[n.id] || 'available'
              return (
                <div key={n.id} style={{ minWidth: 130, padding: '9px 11px', borderRadius: 9, background: 'var(--bg-2)', border: '1px solid var(--border)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <span style={{ fontSize: 13 }}>{ni.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                  </div>
                  <span style={{ display: 'inline-block', fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: s === 'in_progress' ? 'rgba(59,125,216,0.1)' : 'rgba(217,119,6,0.1)', color: s === 'in_progress' ? '#3b7dd8' : '#d97706', fontWeight: 600 }}>
                    {s === 'in_progress' ? 'In Progress' : 'Available'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
