import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import WelcomeEmail from '@/emails/WelcomeEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, firstName } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'The Forge <onboarding@resend.dev>', // Update this if you have a custom domain
      to: email,
      subject: 'Welcome to The Forge: Your Mandate',
      react: WelcomeEmail({ firstName }),
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}