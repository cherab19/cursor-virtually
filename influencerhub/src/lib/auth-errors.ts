import type { AuthError } from "@supabase/supabase-js";

function authErrorCode(error: AuthError): string | undefined {
  const extended = error as AuthError & { error_code?: string };
  return extended.error_code ?? extended.code ?? undefined;
}

/** User-facing copy for Supabase Auth failures (signup, sign-in, etc.). */
export function formatAuthError(error: AuthError): string {
  const code = authErrorCode(error);

  switch (code) {
    case "over_email_send_rate_limit":
      return (
        "Signup confirmation emails are rate-limited on this Supabase project. " +
        "For local development, open Supabase → Authentication → Providers → Email and turn off " +
        "“Confirm email”, then try again. Otherwise wait about an hour for the limit to reset."
      );
    case "email_address_invalid":
      return "That email address is not allowed. Use a real address (not example.com).";
    case "user_already_registered":
      return "An account with this email already exists. Sign in instead, or use a different email.";
    case "weak_password":
      return "Password is too weak. Use at least 6 characters.";
    case "signup_disabled":
      return "Sign-ups are disabled for this project. Enable email sign-up in Supabase → Authentication.";
    default:
      break;
  }

  if (error.status === 429) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  return error.message;
}
