// src/lib/db/auth.ts

import { nhost } from "./client";

/**
 * Sign in with email and password.
 *
 * Throws if authentication fails.
 *
 * Returns the authenticated session.
 */
export async function signIn(email: string, password: string) {
  const response = await nhost.auth.signInEmailPassword({
    email,
    password,
  });

  if (!response.body.session) {
    throw new Error("Additional authentication is required.");
  }

  return response.body.session;
}

/**
 * Create a new user account with email and password.
 *
 * Returns the session when one is immediately available.
 *
 * If email verification is required by your Nhost configuration,
 * the session may be null until the user verifies their email.
 */
export async function signUp(
  email: string,
  password: string,
  options?: {
    displayName?: string;
    locale?: string;
    metadata?: Record<string, unknown>;
    redirectTo?: string;
  },
) {
  const response = await nhost.auth.signUpEmailPassword({
    email,
    password,
    options,
  });

  return response.body.session ?? null;
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await nhost.auth.signOut({});
}

/**
 * Get the currently stored authentication session.
 *
 * Returns null when the user is not signed in.
 */
export function getSession() {
  return nhost.getUserSession();
}

/**
 * Get the currently authenticated user.
 *
 * Returns null when the user is not signed in.
 */
export function getCurrentUser() {
  return nhost.getUserSession()?.user ?? null;
}

/**
 * Check whether a user is currently authenticated.
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Request a password reset email.
 *
 * Nhost will send the user an email containing
 * the password-reset flow.
 */
export async function requestPasswordReset(
  email: string,
  redirectTo?: string,
): Promise<void> {
  await nhost.auth.sendPasswordResetEmail({
    email,
    options: redirectTo
      ? {
          redirectTo,
        }
      : undefined,
  });
}

/**
 * Change the currently authenticated user's password.
 *
 * Nhost may require elevated permissions for this operation.
 */
export async function changePassword(
  newPassword: string,
  ticket?: string,
): Promise<void> {
  await nhost.auth.changeUserPassword({
    newPassword,
    ticket,
  });
}

/**
 * Send a verification email to a user.
 */
export async function sendVerificationEmail(
  email: string,
  redirectTo?: string,
): Promise<void> {
  await nhost.auth.sendVerificationEmail({
    email,
    options: redirectTo
      ? {
          redirectTo,
        }
      : undefined,
  });
}

/**
 * Request an email-address change for the current user.
 *
 * Nhost sends a verification email to the new address.
 */
export async function changeEmail(
  newEmail: string,
  redirectTo?: string,
): Promise<void> {
  await nhost.auth.changeUserEmail({
    newEmail,
    options: redirectTo
      ? {
          redirectTo,
        }
      : undefined,
  });
}

/**
 * Refresh the current session if necessary.
 *
 * Normally you do NOT need to call this manually because the
 * Nhost client automatically refreshes sessions.
 *
 * This is useful when you explicitly want to ensure that the
 * current session is fresh.
 */
export async function refreshSession(marginSeconds = 60) {
  return nhost.refreshSession(marginSeconds);
}

/**
 * Clear the locally stored session.
 *
 * This does NOT invalidate the refresh token on the Nhost server.
 *
 * Prefer signOut() for a real logout.
 */
export function clearLocalSession(): void {
  nhost.clearSession();
}
