import { useQuery } from '@tanstack/react-query';
import authService, { AuthSessionResponse } from '@/services/auth.service';

/**
 * Hook reactivo para consultar la sesión activa mediante TanStack Query.
 * Mantiene la misma interfaz de retorno que Better-Auth ({ data, isPending, isLoading, error, refetch, isRefetching })
 * para compatibilidad total con el resto de la aplicación sin alterar rutas ni guardianes.
 */
export function useSession() {
  const query = useQuery<AuthSessionResponse | null>({
    queryKey: ['session'],
    queryFn: async () => {
      return await authService.getSession();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de validez en memoria
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.status === 401) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data ?? null,
    isPending: query.isLoading,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}

export const signIn = {
  email: (data: any) => authService.signIn(data),
  social: () => authService.outhGoogle(),
};

export const signUp = {
  email: (data: any) => authService.signUp(data),
};

export const signOut = () => authService.signOut();

export const authClient = {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession: () => authService.getSession(),
};

export default authClient;
