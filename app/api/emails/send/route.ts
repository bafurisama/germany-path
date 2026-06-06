import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { getEmailHtml, getEmailSubject, EmailTemplate } from '@/lib/email/templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { template, data } = body as { template: EmailTemplate; data: Record<string, any> }

    if (!template) {
      return NextResponse.json({ error: 'Missing template' }, { status: 400 })
    }

    const emailData = { userEmail: user.email!, ...data }
    const html = getEmailHtml(template, emailData)
    const subject = getEmailSubject(template, emailData)

    const { data: sent, error } = await resend.emails.send({
      from: 'Germany Path <hello@germanypath.com>',
      to: [user.email!],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: sent?.id })
  } catch (err: any) {
    console.error('Email API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
