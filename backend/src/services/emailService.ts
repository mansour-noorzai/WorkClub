import { Resend } from "resend";
import { getEnv } from "../config/env";

export async function sendEmail(input: {
  to: string;
  subject: string;
  heading: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
}) {
  const env = getEnv();
  const configuredFrom = env.EMAIL_FROM?.trim();
  const fromAddress = configuredFrom || "onboarding@resend.dev";
  const hasResendKey = Boolean(env.RESEND_API_KEY?.trim());

  if (!hasResendKey) {
    if (env.NODE_ENV === "production") {
      return "skipped" as const;
    }

    console.info(`[email] Development fallback: ${input.subject}`);
    console.info(`[email] to=${input.to} from=${fromAddress}`);
    console.info(
      `[email] ${input.message}${input.actionUrl ? ` :: ${input.actionUrl}` : ""}`,
    );
    return "sent" as const;
  }

  const action =
    input.actionLabel && input.actionUrl
      ? `<p><a href="${escapeAttribute(input.actionUrl)}" style="display:inline-block;background:#6558f5;color:#fff;padding:11px 18px;border-radius:8px;text-decoration:none">${escapeHtml(
          input.actionLabel,
        )}</a></p>`
      : "";

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from: fromAddress,
      to: input.to,
      subject: input.subject,
      html: `<div style="font-family:Arial,sans-serif;color:#172033;max-width:560px"><h2>${escapeHtml(
        input.heading,
      )}</h2><p>${escapeHtml(input.message)}</p>${action}<p style="color:#667085;font-size:12px">WorkClub</p></div>`,
    });
    return "sent" as const;
  } catch {
    return "failed" as const;
  }
}

export async function sendInviteEmail(input: {
  email: string;
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
}) {
  return sendEmail({
    to: input.email,
    subject: `Join ${input.workspaceName} on WorkClub`,
    heading: "You’re invited to WorkClub",
    message: `${input.inviterName} invited you to join ${input.workspaceName}.`,
    actionLabel: "Accept invitation",
    actionUrl: input.inviteUrl,
  });
}

export async function sendVerificationEmail(input: {
  email: string;
  verificationUrl: string;
}) {
  return sendEmail({
    to: input.email,
    subject: "Verify your WorkClub email",
    heading: "Verify your email address",
    message: "Confirm your email address to activate your WorkClub workspace.",
    actionLabel: "Verify email",
    actionUrl: input.verificationUrl,
  });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  resetUrl: string;
}) {
  return sendEmail({
    to: input.email,
    subject: "Reset your WorkClub password",
    heading: "Reset your password",
    message:
      "Use this link to choose a new password. It expires in 30 minutes.",
    actionLabel: "Reset password",
    actionUrl: input.resetUrl,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[character];
  });
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
