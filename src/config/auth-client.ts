import { createAuthClient } from 'better-auth/react';

const backURL = import.meta.env.VITE_BACK_URL;

export const authClient = createAuthClient({
  baseURL: `${backURL}/api/auth`,
  fetchOptions: {
    credentials: 'include',
  },
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
});

export const { useSession, signIn, signUp, signOut } = authClient;
