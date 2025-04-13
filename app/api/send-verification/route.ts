import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, firstName, lastName, verificationUrl } =
      await request.json();

    if (!email || !verificationUrl) {
      return NextResponse.json(
        { error: 'Email and verification URL are required' },
        { status: 400 }
      );
    }

    // Send verification email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Medical Appointments <noreply@your-domain.com>', // Update with your verified domain
      to: [email],
      subject: 'Verify your admin account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5; margin-bottom: 24px;">Verify Your Admin Account</h1>
          <p>Hello ${firstName || ''} ${lastName || ''},</p>
          <p>Thank you for registering as an administrator. Please click the button below to verify your email address and activate your account:</p>
          <div style="margin: 32px 0;">
            <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p>If you didn't request this verification, you can safely ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p style="margin-top: 32px; font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this URL into your browser: <a href="${verificationUrl}">${verificationUrl}</a></p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending verification email with Resend:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error in send-verification route:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
