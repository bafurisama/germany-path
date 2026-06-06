import Link from 'next/link'
import { ArrowRight, Map, BarChart3, Clock, Unlock } from 'lucide-react'

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      {/* Atmospheric background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 900px 700px at 10% 0%, rgba(184,134,11,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 600px 500px at 90% 80%, rgba(59,125,216,0.05) 0%, transparent 70%),
          radial-gradient(ellipse 500px 400px at 50% 50%, rgba(42,157,110,0.03) 0%, transparent 70%)
        `,
      }} />

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px, 4vw, 40px)', height: 56,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(250,248,244,0.92)', backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #3b7dd8, #2a9d6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>G</div>
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Germany Path</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/auth/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, padding: '7px 14px', borderRadius: 8 }}>Sign in</Link>
          <Link href="/auth/signup" style={{ background: '#3b7dd8', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 8 }}>Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(60px,10vw,110px) clamp(20px,5vw,40px) 60px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 28, padding: '5px 14px 5px 8px', borderRadius: 100, background: 'rgba(59,125,216,0.08)', border: '1px solid rgba(59,125,216,0.18)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b7dd8' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#3b7dd8', letterSpacing: '0.02em' }}>Your immigration operating system</span>
        </div>

        <h1 style={{ fontSize: 'clamp(32px,6vw,64px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20, color: 'var(--text-primary)' }}>
          Your life in Germany,{' '}
          <span style={{ color: '#3b7dd8' }}>structured.</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 40px' }}>
          Germany is bureaucratic. We don't pretend otherwise. We structure it, sequence it, and make your progress visible.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#3b7dd8', color: '#fff', textDecoration: 'none', padding: '13px 24px', borderRadius: 10, fontWeight: 600, fontSize: 15, boxShadow: '0 4px 16px rgba(59,125,216,0.3)' }}>
            Start your path <ArrowRight size={16} />
          </Link>
          <Link href="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid var(--border)', color: 'var(--text-primary)', textDecoration: 'none', padding: '13px 24px', borderRadius: 10, fontWeight: 500, fontSize: 15, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            Sign in
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 clamp(16px,4vw,40px) 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, position: 'relative', zIndex: 1 }}>
        {[
          { icon: '🗺️', title: 'Personalized path', desc: 'Your immigration journey mapped to your visa, nationality, and current status.' },
          { icon: '📈', title: 'Visible progress', desc: 'Know exactly where you are and what comes next — always.' },
          { icon: '⏱️', title: 'Countdown milestones', desc: 'PR eligibility, citizenship timeline, permit renewals — always in view.' },
          { icon: '🔓', title: 'Dependency engine', desc: 'Understand which tasks unlock what. No more hidden blockers.' },
        ].map(({ icon, title, desc }, i) => (
          <div key={i} className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>{icon}</div>
            <h3 style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '20px clamp(16px,4vw,40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 12, flexWrap: 'wrap', gap: 8, position: 'relative', zIndex: 1 }}>
        <span>© 2025 Germany Path</span>
        <span>Informational guidance only. Not legal advice.</span>
      </div>
    </div>
  )
}
