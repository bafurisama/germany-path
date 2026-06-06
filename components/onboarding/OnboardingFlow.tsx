'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react'

interface OnboardingData {
  nationality: string
  visaType: string
  city: string
  maritalStatus: string
  arrivalDate: string
  employmentStatus: string
  hasAnmeldung: boolean
  hasHealthInsurance: boolean
  hasTaxId: boolean
  hasBankAccount: boolean
  hasResidencePermit: boolean
  hasSocialSecurityNumber: boolean
  germanLevel: string
}

const STEPS = [
  {
    id: 'nationality',
    title: 'What is your nationality?',
    subtitle: 'This helps us tailor requirements specific to your country.',
    type: 'select',
    options: [
      'Turkish', 'Indian', 'American', 'British', 'Brazilian', 'Nigerian',
      'Pakistani', 'Chinese', 'Vietnamese', 'Ukrainian', 'Other EU', 'Other',
    ],
    field: 'nationality',
  },
  {
    id: 'visaType',
    title: 'What is your current visa / residence status?',
    subtitle: 'This determines your path to permanent residency.',
    type: 'select',
    options: [
      { value: 'blue_card', label: 'EU Blue Card', desc: 'Fastest PR path (21–33 months)' },
      { value: 'skilled_worker', label: 'Skilled Worker Visa', desc: 'Standard employment visa' },
      { value: 'job_seeker', label: 'Job Seeker Visa', desc: 'Looking for employment' },
      { value: 'student', label: 'Student Visa', desc: 'Enrolled in German institution' },
      { value: 'family', label: 'Family Reunification', desc: 'Joining a family member' },
      { value: 'freelance', label: 'Freelance / Self-employed', desc: 'Running own business' },
      { value: 'other', label: 'Other', desc: 'Other visa type' },
    ],
    field: 'visaType',
  },
  {
    id: 'city',
    title: 'Which city are you in?',
    subtitle: 'Some processes differ by Bundesland.',
    type: 'select',
    options: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart', 'Düsseldorf', 'Other'],
    field: 'city',
  },
  {
    id: 'maritalStatus',
    title: 'What is your marital status?',
    subtitle: 'This affects tax class and family workflows.',
    type: 'select',
    options: [
      { value: 'single', label: 'Single' },
      { value: 'married', label: 'Married', desc: 'Spouse in Germany' },
      { value: 'married_abroad', label: 'Married', desc: 'Spouse abroad' },
      { value: 'partnership', label: 'Registered Partnership' },
    ],
    field: 'maritalStatus',
  },
  {
    id: 'arrivalDate',
    title: 'When did you arrive in Germany?',
    subtitle: 'Used to calculate your PR and citizenship timeline.',
    type: 'date',
    field: 'arrivalDate',
  },
  {
    id: 'employmentStatus',
    title: 'What is your current employment situation?',
    subtitle: 'This determines applicable deadlines and requirements.',
    type: 'select',
    options: [
      { value: 'employed', label: 'Employed full-time' },
      { value: 'employed_part', label: 'Employed part-time' },
      { value: 'self_employed', label: 'Self-employed / Freelance' },
      { value: 'job_seeking', label: 'Looking for a job' },
      { value: 'student', label: 'Student' },
    ],
    field: 'employmentStatus',
  },
  {
    id: 'hasAnmeldung',
    title: 'Have you completed your Anmeldung?',
    subtitle: 'Address registration at the Einwohnermeldeamt.',
    type: 'boolean',
    field: 'hasAnmeldung',
  },
  {
    id: 'hasHealthInsurance',
    title: 'Do you have active health insurance in Germany?',
    subtitle: 'Gesetzliche or private Krankenversicherung.',
    type: 'boolean',
    field: 'hasHealthInsurance',
  },
  {
    id: 'hasTaxId',
    title: 'Have you received your Tax ID?',
    subtitle: 'Steueridentifikationsnummer — sent by post after Anmeldung.',
    type: 'boolean',
    field: 'hasTaxId',
  },
  {
    id: 'hasBankAccount',
    title: 'Do you have a German bank account?',
    subtitle: 'Any German Girokonto counts.',
    type: 'boolean',
    field: 'hasBankAccount',
  },
  {
    id: 'hasResidencePermit',
    title: 'Do you have a valid residence permit or Blue Card?',
    subtitle: 'Aufenthaltserlaubnis issued by Ausländerbehörde.',
    type: 'boolean',
    field: 'hasResidencePermit',
  },
  {
    id: 'germanLevel',
    title: 'What is your current German language level?',
    subtitle: 'Be honest — this shapes your integration path.',
    type: 'select',
    options: [
      { value: 'none', label: 'None / A0', desc: 'Complete beginner' },
      { value: 'a1', label: 'A1', desc: 'Basic phrases' },
      { value: 'a2', label: 'A2', desc: 'Simple exchanges' },
      { value: 'b1', label: 'B1', desc: 'Independent user' },
      { value: 'b2', label: 'B2', desc: 'Upper intermediate' },
      { value: 'c1_plus', label: 'C1+', desc: 'Advanced / Native-like' },
    ],
    field: 'germanLevel',
  },
]

const defaultData: OnboardingData = {
  nationality: '',
  visaType: '',
  city: '',
  maritalStatus: '',
  arrivalDate: '',
  employmentStatus: '',
  hasAnmeldung: false,
  hasHealthInsurance: false,
  hasTaxId: false,
  hasBankAccount: false,
  hasResidencePermit: false,
  hasSocialSecurityNumber: false,
  germanLevel: '',
}

export default function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(defaultData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const currentStep = STEPS[step]
  const progress = ((step) / STEPS.length) * 100

  function setValue(field: string, value: any) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  function canAdvance() {
    const val = (data as any)[currentStep.field]
    if (currentStep.type === 'boolean') return true
    if (currentStep.type === 'date') return !!val
    return !!val
  }

  async function handleFinish() {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: upsertError } = await supabase.from('user_profiles').upsert({
        id: user.id,
        email: user.email,
        nationality: data.nationality,
        visa_type: data.visaType,
        city: data.city,
        marital_status: data.maritalStatus,
        arrival_date: data.arrivalDate,
        employment_status: data.employmentStatus,
        german_level: data.germanLevel,
        has_anmeldung: data.hasAnmeldung,
        has_health_insurance: data.hasHealthInsurance,
        has_tax_id: data.hasTaxId,
        has_bank_account: data.hasBankAccount,
        has_residence_permit: data.hasResidencePermit,
        has_social_security_number: data.hasSocialSecurityNumber,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
      })

      if (upsertError) throw upsertError

      // Initialize node states from onboarding answers
      const nodeStates: any[] = []
      const completedNodes: Record<string, boolean> = {
        anmeldung: data.hasAnmeldung,
        health_insurance: data.hasHealthInsurance,
        tax_id: data.hasTaxId,
        bank_account: data.hasBankAccount,
        residence_permit: data.hasResidencePermit,
      }

      // Map german level to completed language nodes
      if (['a1', 'a2', 'b1', 'b2', 'c1_plus'].includes(data.germanLevel)) {
        completedNodes['german_a1'] = true
      }
      if (['a2', 'b1', 'b2', 'c1_plus'].includes(data.germanLevel)) {
        completedNodes['german_a2'] = true
      }
      if (['b1', 'b2', 'c1_plus'].includes(data.germanLevel)) {
        completedNodes['german_b1'] = true
      }

      for (const [nodeId, completed] of Object.entries(completedNodes)) {
        if (completed) {
          nodeStates.push({
            user_id: user.id,
            node_id: nodeId,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
        }
      }

      if (nodeStates.length > 0) {
        await supabase.from('user_node_states').upsert(nodeStates)
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.')
      setSaving(false)
    }
  }

  const optionStyle = (selected: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
    borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
    border: `1px solid ${selected ? 'var(--accent-blue)' : 'var(--border)'}`,
    background: selected ? 'var(--accent-blue-dim)' : 'var(--bg-3)',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="orb" style={{
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)',
        top: -200, right: -200,
      }} />

      {/* Progress bar */}
      <div style={{ height: 2, background: 'var(--border)', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-green))',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>G</div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Germany Path</span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {step + 1} of {STEPS.length}
        </span>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 540, position: 'relative', zIndex: 1 }}>
          <div key={step} className="animate-fade-up">
            {/* Step indicator */}
            <div style={{
              display: 'flex', gap: 6, marginBottom: 32,
            }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  height: 3, flex: 1, borderRadius: 2,
                  background: i < step ? 'var(--accent-blue)' : i === step ? 'var(--accent-blue)' : 'var(--border)',
                  opacity: i === step ? 1 : i < step ? 0.6 : 1,
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>

            <h2 style={{
              fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 600,
              letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.2,
            }}>
              {currentStep.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15 }}>
              {currentStep.subtitle}
            </p>

            {/* Options */}
            {currentStep.type === 'select' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentStep.options!.map((option) => {
                  const value = typeof option === 'string' ? option : (option as any).value
                  const label = typeof option === 'string' ? option : (option as any).label
                  const desc = typeof option === 'object' ? (option as any).desc : undefined
                  const selected = (data as any)[currentStep.field] === value

                  return (
                    <div
                      key={value}
                      style={optionStyle(selected)}
                      onClick={() => setValue(currentStep.field, value)}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        border: `2px solid ${selected ? 'var(--accent-blue)' : 'var(--border-bright)'}`,
                        background: selected ? 'var(--accent-blue)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {selected && <Check size={10} color="#fff" strokeWidth={3} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 500 }}>{label}</div>
                        {desc && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {currentStep.type === 'boolean' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { value: true, label: 'Yes, completed', color: 'var(--accent-green)', dim: 'var(--accent-green-dim)' },
                  { value: false, label: 'Not yet', color: 'var(--text-secondary)', dim: 'var(--bg-3)' },
                ].map(({ value, label, color, dim }) => {
                  const selected = (data as any)[currentStep.field] === value
                  return (
                    <div
                      key={String(value)}
                      style={{
                        ...optionStyle(false),
                        border: `1px solid ${selected ? color : 'var(--border)'}`,
                        background: selected ? dim : 'var(--bg-3)',
                      }}
                      onClick={() => setValue(currentStep.field, value)}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${selected ? color : 'var(--border-bright)'}`,
                        background: selected ? color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {selected && <Check size={10} color="#fff" strokeWidth={3} />}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: selected ? color : 'var(--text-primary)' }}>
                        {label}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {currentStep.type === 'date' && (
              <input
                type="date"
                value={(data as any)[currentStep.field]}
                onChange={(e) => setValue(currentStep.field, e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%', padding: '14px 16px',
                  background: 'var(--bg-3)', border: '1px solid var(--border-bright)',
                  borderRadius: 10, color: 'var(--text-primary)', fontSize: 16,
                  outline: 'none', fontFamily: 'inherit',
                  colorScheme: 'dark',
                }}
              />
            )}

            {error && (
              <div style={{
                marginTop: 16,
                background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)',
                borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--accent-red)',
              }}>
                {error}
              </div>
            )}

            {/* Navigation */}
            <div style={{
              display: 'flex', gap: 12, marginTop: 32,
              justifyContent: 'space-between', alignItems: 'center',
            }}>
              <button
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '12px 20px', borderRadius: 10,
                  background: 'var(--bg-3)', border: '1px solid var(--border)',
                  color: step === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                  cursor: step === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                }}
              >
                <ArrowLeft size={15} /> Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canAdvance()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '12px 24px', borderRadius: 10,
                    background: canAdvance() ? 'var(--accent-blue)' : 'var(--bg-4)',
                    border: 'none', color: canAdvance() ? '#fff' : 'var(--text-muted)',
                    cursor: canAdvance() ? 'pointer' : 'not-allowed',
                    fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                >
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={saving || !canAdvance()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '12px 24px', borderRadius: 10,
                    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))',
                    border: 'none', color: '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  Build my path <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
