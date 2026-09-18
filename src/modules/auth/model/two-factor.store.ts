import { create } from 'zustand';

interface TwoFactorStore {
  twoFactorToken: string | null;
  callbackUrl: string | null;
  setChallenge: (token: string, callbackUrl?: string | null) => void;
  clearChallenge: () => void;
}

export const useTwoFactorStore = create<TwoFactorStore>((set) => ({
  twoFactorToken: null,
  callbackUrl: null,
  setChallenge: (token: string, callbackUrl?: string | null) =>
    set({
      twoFactorToken: token,
      callbackUrl: callbackUrl || null,
    }),
  clearChallenge: () =>
    set({
      twoFactorToken: null,
      callbackUrl: null,
    }),
}));
