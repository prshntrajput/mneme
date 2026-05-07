import { getStorage, setStorage, clearAuth } from './storage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';

export async function isAuthenticated(): Promise<boolean> {
  const token = await getStorage('auth_token');
  return Boolean(token);
}

export async function getUserInfo(): Promise<{ email: string; userId: string } | null> {
  const [email, userId] = await Promise.all([getStorage('user_email'), getStorage('user_id')]);
  if (!email || !userId) return null;
  return { email, userId };
}

export async function loginWithGoogle(): Promise<void> {
  // Build the Supabase Google OAuth URL directly.
  // redirect_to is the chromiumapp.org URL that launchWebAuthFlow intercepts.
  const redirectTo = chrome.identity.getRedirectURL();
  const authUrl = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  authUrl.searchParams.set('provider', 'google');
  authUrl.searchParams.set('redirect_to', redirectTo);

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      async (callbackUrl) => {
        if (chrome.runtime.lastError || !callbackUrl) {
          reject(new Error(chrome.runtime.lastError?.message ?? 'Auth cancelled'));
          return;
        }

        try {
          const url = new URL(callbackUrl);

          // Supabase returns tokens in the hash fragment (implicit flow)
          // e.g. https://<ext>.chromiumapp.org/#access_token=...&refresh_token=...
          const hash = new URLSearchParams(url.hash.slice(1));
          const accessToken = hash.get('access_token');
          const refreshToken = hash.get('refresh_token');

          if (!accessToken) {
            throw new Error('No access token in callback URL');
          }

          // Decode user info from the JWT payload (server will validate the token)
          const payload = JSON.parse(
            atob(accessToken.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')),
          ) as { sub: string; email?: string };

          await Promise.all([
            setStorage('auth_token', accessToken),
            setStorage('refresh_token', refreshToken ?? ''),
            setStorage('user_id', payload.sub),
            setStorage('user_email', payload.email ?? ''),
          ]);

          resolve();
        } catch (err) {
          reject(err);
        }
      },
    );
  });
}

export async function logout(): Promise<void> {
  await clearAuth();
}

export async function getAuthToken(): Promise<string | null> {
  return getStorage('auth_token');
}
