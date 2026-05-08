// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email templates
const emailTemplates = {
  userApprovalEmail: (userName: string, type: string, amount: string) => ({
    subject: `Your ${type.charAt(0).toUpperCase() + type.slice(1)} Request Has Been Approved`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #28a745; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background-color: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #999; }
    .button { display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">✓ Request Approved</h2>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      
      <p>Great news! Your ${type} request has been approved.</p>
      
      <div style="background-color: #f0f8f5; padding: 15px; border-radius: 4px; border-left: 4px solid #28a745;">
        <div class="info-row">
          <span class="label">Request Type:</span> ${type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
        <div class="info-row">
          <span class="label">Amount:</span> ${amount}
        </div>
        ${type === 'deposit' ? `
        <div class="info-row">
          <span class="label">Status:</span> Your account has been credited with this amount.
        </div>
        ` : `
        <div class="info-row">
          <span class="label">Status:</span> Your withdrawal will be processed shortly.
        </div>
        `}
      </div>
      
      <p style="margin-top: 20px;">You can view your transaction history in your account dashboard.</p>
      
      
      <div class="footer">
        <p>This is an automated notification. Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  }),

  userRejectionEmail: (userName: string, type: string, amount: string, reason?: string) => ({
    subject: `Your ${type.charAt(0).toUpperCase() + type.slice(1)} Request Could Not Be Processed`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
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
      <h2 style="margin: 0;">✗ Request Could Not Be Processed</h2>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      
      <p>Unfortunately, your ${type} request could not be processed at this time.</p>
      
      <div style="background-color: #fff5f5; padding: 15px; border-radius: 4px; border-left: 4px solid #dc3545;">
        <div class="info-row">
          <span class="label">Request Type:</span> ${type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
        <div class="info-row">
          <span class="label">Amount:</span> ${amount}
        </div>
        ${reason ? `
        <div class="info-row">
          <span class="label">Reason:</span> ${reason}
        </div>
        ` : ''}
      </div>
      
      <p style="margin-top: 20px;">If you believe this is an error or have questions, please contact support.</p>
      
     
      
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
    const { userEmail, status, type, amount, userName, reason } = await req.json()

    if (!userEmail || !status || !type || !amount || !userName) {
      throw new Error('Missing required fields')
    }

    if (!['approved', 'rejected'].includes(status)) {
      throw new Error('Invalid status')
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Get appropriate email template
    let emailContent
    if (status === 'approved') {
      emailContent = emailTemplates.userApprovalEmail(userName, type, amount)
    } else if (status === 'rejected') {
      emailContent = emailTemplates.userRejectionEmail(userName, type, amount, reason)
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
        to: userEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Resend API error:', errorData)
      // Log to database but don't throw - we want the transaction update to succeed even if email fails
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
    console.log('User notification sent:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User notification sent',
        emailSent: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('Error in send-user-notification:', error)
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
