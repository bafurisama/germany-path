// Maps node category + id to emoji icon and warm color
export const NODE_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  // Registration
  anmeldung:              { icon: '🏠', color: '#b8860b', bg: 'rgba(184,134,11,0.1)' },
  rundfunkbeitrag:        { icon: '📡', color: '#7c5cbf', bg: 'rgba(124,92,191,0.1)' },
  sim_card:               { icon: '📱', color: '#3b7dd8', bg: 'rgba(59,125,216,0.1)' },

  // Finance
  tax_id:                 { icon: '📄', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  bank_account:           { icon: '🏦', color: '#2a9d6e', bg: 'rgba(42,157,110,0.1)' },
  schufa_first_entry:     { icon: '📊', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  tax_class_optimization: { icon: '💶', color: '#2a9d6e', bg: 'rgba(42,157,110,0.1)' },
  annual_tax_return:      { icon: '🧾', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  pension_tracking:       { icon: '📈', color: '#3b7dd8', bg: 'rgba(59,125,216,0.1)' },

  // Insurance / Health
  health_insurance:       { icon: '🛡️', color: '#2a9d6e', bg: 'rgba(42,157,110,0.1)' },
  doctor_registration:    { icon: '⚕️', color: '#2a9d6e', bg: 'rgba(42,157,110,0.1)' },

  // Legal
  residence_permit:       { icon: '📋', color: '#7c5cbf', bg: 'rgba(124,92,191,0.1)' },
  blue_card:              { icon: '💙', color: '#3b7dd8', bg: 'rgba(59,125,216,0.1)' },
  driver_license_conversion: { icon: '🚗', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  social_security_number: { icon: '🪪', color: '#7c5cbf', bg: 'rgba(124,92,191,0.1)' },
  settlement_permit_eligibility: { icon: '✅', color: '#2a9d6e', bg: 'rgba(42,157,110,0.1)' },

  // Language
  german_a1:              { icon: '🎓', color: '#3b7dd8', bg: 'rgba(59,125,216,0.1)' },
  german_a2:              { icon: '🎓', color: '#3b7dd8', bg: 'rgba(59,125,216,0.1)' },
  german_b1:              { icon: '🎓', color: '#7c5cbf', bg: 'rgba(124,92,191,0.1)' },
  integrationskurs:       { icon: '🏫', color: '#7c5cbf', bg: 'rgba(124,92,191,0.1)' },

  // Integration
  pr_fast_track:          { icon: '🌟', color: '#b8860b', bg: 'rgba(184,134,11,0.12)' },
  pr_standard:            { icon: '🏛️', color: '#7c5cbf', bg: 'rgba(124,92,191,0.1)' },
  citizenship_residency:  { icon: '🇩🇪', color: '#dc4f4f', bg: 'rgba(220,79,79,0.1)' },
  citizenship_language:   { icon: '🎓', color: '#dc4f4f', bg: 'rgba(220,79,79,0.1)' },
  einbuergerungstest:     { icon: '📝', color: '#dc4f4f', bg: 'rgba(220,79,79,0.1)' },
  citizenship_application:{ icon: '🏅', color: '#b8860b', bg: 'rgba(184,134,11,0.12)' },
}

export const CATEGORY_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  registration: { icon: '🏠', color: '#b8860b', bg: 'rgba(184,134,11,0.1)' },
  finance:      { icon: '💶', color: '#2a9d6e', bg: 'rgba(42,157,110,0.1)' },
  insurance:    { icon: '🛡️', color: '#2a9d6e', bg: 'rgba(42,157,110,0.1)' },
  legal:        { icon: '📋', color: '#7c5cbf', bg: 'rgba(124,92,191,0.1)' },
  language:     { icon: '🎓', color: '#3b7dd8', bg: 'rgba(59,125,216,0.1)' },
  integration:  { icon: '🏫', color: '#7c5cbf', bg: 'rgba(124,92,191,0.1)' },
  milestone:    { icon: '🌟', color: '#b8860b', bg: 'rgba(184,134,11,0.12)' },
}

export function getNodeIcon(nodeId: string, category: string) {
  return NODE_ICONS[nodeId] || CATEGORY_ICONS[category] || { icon: '📌', color: '#3b7dd8', bg: 'rgba(59,125,216,0.1)' }
}
