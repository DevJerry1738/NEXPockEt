export const emailTemplates = {
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
      
      <div style="text-align: center;">
        <a href="${Deno.env.get('ADMIN_DASHBOARD_URL') || 'https://app.example.com/admin'}/transactions" class="button">Review in Dashboard</a>
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
        <a href="${Deno.env.get('ADMIN_DASHBOARD_URL') || 'https://app.example.com/admin'}/transactions" class="button">Review in Dashboard</a>
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
      
      <div style="text-align: center;">
        <a href="${Deno.env.get('APP_URL') || 'https://app.example.com'}/dashboard" class="button">View Account</a>
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
      
      <div style="text-align: center;">
        <a href="${Deno.env.get('APP_URL') || 'https://app.example.com'}/dashboard" class="button">Return to Dashboard</a>
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
};
