// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email templates
const emailTemplates = {
  adminNotificationDeposit: (userName: string, amount: string, transactionId: number, userEmail: string, paymentMethod: string) => ({
    subject: `New Deposit Request: ${amount} from ${userName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f5f5f5; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #999; }
    .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Deposit Request</h2>
    </div>
    <div class="content">
      <p>Hi Admin,</p>
      
      <p>A new deposit request has been submitted and requires your review.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
        <div class="info-row">
          <span class="label">User Name:</span> ${userName}
        </div>
        <div class="info-row">
          <span class="label">User Email:</span> ${userEmail}
        </div>
        <div class="info-row">
          <span class="label">Amount:</span> ${amount}
        </div>
        <div class="info-row">
          <span class="label">Payment Method:</span> ${paymentMethod}
        </div>
        <div class="info-row">
          <span class="label">Transaction ID:</span> #${transactionId}
        </div>
      </div>
      
      <p style="margin-top: 20px;">Please log in to the admin dashboard to review and approve or reject this request.</p>
      
      <div class="footer">
        <p>This is an automated notification. Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  }),

  adminNotificationWithdrawal: (userName: string, amount: string, transactionId: number, userEmail: string, paymentMethod: string) => ({
    subject: `New Withdrawal Request: ${amount} from ${userName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f5f5f5; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #999; }
    .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Withdrawal Request</h2>
    </div>
    <div class="content">
      <p>Hi Admin,</p>
      
      <p>A new withdrawal request has been submitted and requires your review.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
        <div class="info-row">
          <span class="label">User Name:</span> ${userName}
        </div>
        <div class="info-row">
          <span class="label">User Email:</span> ${userEmail}
        </div>
        <div class="info-row">
          <span class="label">Amount:</span> ${amount}
        </div>
        <div class="info-row">
          <span class="label">Payment Method:</span> ${paymentMethod}
        </div>
        <div class="info-row">
          <span class="label">Transaction ID:</span> #${transactionId}
        </div>
      </div>
      
      <p style="margin-top: 20px;">Please log in to the admin dashboard to review and approve or reject this request.</p>
      
      <div style="text-align: center;">
        <a href="https://app.example.com/admin/transactions" class="button">Review in Dashboard</a>
      </div>
      
      <div class="footer">
        <p>This is an automated notification. Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  }),
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transactionId, type, amount, userName, userEmail, paymentMethod } = await req.json()

    if (!transactionId || !type || !amount || !userName || !userEmail) {
      throw new Error('Missing required fields')
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const adminEmail = Deno.env.get('ADMIN_EMAIL_ADDRESS')

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL_ADDRESS not configured')
    }

    // Get appropriate email template
    let emailContent
    if (type === 'deposit') {
      emailContent = emailTemplates.adminNotificationDeposit(userName, amount, transactionId, userEmail, paymentMethod || 'Unknown')
    } else if (type === 'withdraw') {
      emailContent = emailTemplates.adminNotificationWithdrawal(userName, amount, transactionId, userEmail, paymentMethod || 'Unknown')
    } else {
      throw new Error('Invalid transaction type')
    }

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@resend.dev',
        to: adminEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Resend API error:', errorData)
      // Log to database but don't throw - we want the transaction to succeed even if email fails
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Email send failed: ${errorData.message || 'Unknown error'}`,
          emailSent: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const data = await response.json()
    console.log('Admin notification sent:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin notification sent',
        emailSent: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('Error in send-admin-notification:', error)
    // Log error but don't fail - graceful degradation
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message,
        emailSent: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
