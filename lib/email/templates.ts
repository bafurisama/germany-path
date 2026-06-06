export type EmailTemplate = 'pr_countdown' | 'license_deadline' | 'tax_id_reminder' | 'welcome' | 'milestone_unlock'

interface EmailData {
  userEmail: string
  userName?: string
  prMonthsRemaining?: number
  milestoneName?: string
  deadlineDays?: number
}

export function getEmailHtml(template: EmailTemplate, data: EmailData): string {
  const base = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { margin: 0; padding: 0; background: #0a0a0f; font-family: 'Helvetica Neue', Arial, sans-serif; color: #f0f0f5; }
        .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
        .logo { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 40px; }
        .logo-mark { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #4f8ef7, #38c9a0); display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff; text-align: center; line-height: 32px; }
        .logo-text { font-size: 15px; font-weight: 600; color: #f0f0f5; }
        .card { background: #111118; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 32px; margin-bottom: 24px; }
        .tag { display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 4px; margin-bottom: 16px; }
        .number { font-size: 56px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; margin-bottom: 8px; }
        .label { font-size: 14px; color: rgba(240,240,245,0.55); margin-bottom: 24px; }
        h2 { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 12px; }
        p { font-size: 15px; line-height: 1.65; color: rgba(240,240,245,0.7); margin: 0 0 16px; }
        .btn { display: inline-block; background: #4f8ef7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; }
        .footer { font-size: 12px; color: rgba(240,240,245,0.25); text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); }
        .divider { height: 1px; background: rgba(255,255,255,0.06); margin: 24px 0; }
      </style>
    </head>
    <body>
  `
  const footer = `
      <div class="footer">
        <p style="margin:0">Germany Path &mdash; Your Immigration OS</p>
        <p style="margin:4px 0 0">Informational guidance only. Not legal advice.</p>
      </div>
    </div></body></html>
  `

  const logoHtml = `
    <div class="container">
      <div class="logo">
        <div class="logo-mark">G</div>
        <span class="logo-text">Germany Path</span>
      </div>
  `

  switch (template) {
    case 'welcome':
      return base + logoHtml + `
        <div class="card">
          <div class="tag" style="background:rgba(79,142,247,0.12);color:#4f8ef7;">Welcome</div>
          <h2>Your path is ready.</h2>
          <p>We've built your personalized immigration progression map based on your profile. Check your dashboard to see where you are, what comes next, and how far you are from permanent residency.</p>
          <a href="https://germanypath.com/dashboard" class="btn">Open my dashboard →</a>
        </div>
        <div class="card">
          <p style="margin:0;font-size:14px;color:rgba(240,240,245,0.5);">Germany Path sends low-frequency, high-relevance updates only — no spam, ever. Emails arrive when something meaningful changes in your journey.</p>
        </div>
      ` + footer

    case 'pr_countdown':
      const months = data.prMonthsRemaining || 0
      const accentColor = months <= 3 ? '#38c9a0' : months <= 12 ? '#f5a623' : '#b06ef3'
      return base + logoHtml + `
        <div class="card">
          <div class="tag" style="background:${accentColor}18;color:${accentColor};">Permanent Residency</div>
          <div class="number" style="color:${accentColor};">${months}</div>
          <div class="label">months until PR eligibility</div>
          <div class="divider"></div>
          <h2>${months <= 6 ? 'You\'re almost there.' : 'Your PR timeline update.'}</h2>
          <p>${months <= 3
            ? 'Your permanent residency application window is approaching. Start gathering your documents now to avoid delays.'
            : months <= 12
            ? 'You\'re in the final stretch. Make sure your pension contributions and language requirements are on track.'
            : 'Your progress is on track. Keep building your pension months and language skills.'
          }</p>
          <a href="https://germanypath.com/dashboard" class="btn">Check my progress →</a>
        </div>
      ` + footer

    case 'license_deadline':
      return base + logoHtml + `
        <div class="card">
          <div class="tag" style="background:rgba(245,166,35,0.12);color:#f5a623;">Action Required</div>
          <h2>Driver's license conversion reminder.</h2>
          <p>Your foreign driver's license conversion deadline may be approaching. Non-EU licenses must typically be converted within 6 months of establishing residence.</p>
          <p>Driving on an expired foreign license in Germany can result in significant fines and insurance complications.</p>
          <a href="https://germanypath.com/journey" class="btn">Review my tasks →</a>
        </div>
      ` + footer

    case 'tax_id_reminder':
      return base + logoHtml + `
        <div class="card">
          <div class="tag" style="background:rgba(56,201,160,0.12);color:#38c9a0;">Reminder</div>
          <h2>Your Tax ID should be arriving soon.</h2>
          <p>Most immigrants receive their Steueridentifikationsnummer 2–4 weeks after completing Anmeldung. Check your mailbox — it arrives as a physical letter.</p>
          <p>Without your Tax ID, your employer taxes you at the maximum rate (Steuerklasse VI). Mark it complete in your dashboard once it arrives.</p>
          <a href="https://germanypath.com/dashboard" class="btn">Update my progress →</a>
        </div>
      ` + footer

    case 'milestone_unlock':
      return base + logoHtml + `
        <div class="card">
          <div class="tag" style="background:rgba(176,110,243,0.12);color:#b06ef3;">Unlocked</div>
          <h2>${data.milestoneName || 'New milestone'} is now available.</h2>
          <p>You've completed the prerequisites. A new stage of your Germany journey has opened up — check your path to see what's next.</p>
          <a href="https://germanypath.com/journey" class="btn">View my journey →</a>
        </div>
      ` + footer

    default:
      return base + logoHtml + `<div class="card"><p>Update from Germany Path.</p></div>` + footer
  }
}

export function getEmailSubject(template: EmailTemplate, data: EmailData): string {
  switch (template) {
    case 'welcome': return 'Your Germany Path is ready'
    case 'pr_countdown': return `${data.prMonthsRemaining} months to permanent residency`
    case 'license_deadline': return 'Driver\'s license conversion reminder'
    case 'tax_id_reminder': return 'Your Tax ID should be arriving soon'
    case 'milestone_unlock': return `Unlocked: ${data.milestoneName}`
    default: return 'Update from Germany Path'
  }
}
