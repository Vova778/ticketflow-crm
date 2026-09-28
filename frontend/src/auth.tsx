import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, tokenStore } from "./api";
import type { User } from "./types";
interface Session {
  user: User | undefined;
  loading: boolean;
  error: Error | null;
  retry: () => void;
  signIn: (token: string) => void;
  signOut: () => void;
}
const AuthContext = createContext<Session | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(tokenStore.get);
  const client = useQueryClient();
  const me = useQuery({
    queryKey: ["me", token],
    queryFn: ({ signal }) => api<User>("/auth/me", { signal }),
    enabled: !!token,
    retry: false,
    staleTime: 30_000,
  });
  const signOut = () => {
    tokenStore.clear();
    setToken(null);
    void client.cancelQueries();
    client.clear();
  };
  useEffect(() => {
    const expire = () => {
      tokenStore.clear();
      setToken(null);
      void client.cancelQueries();
      client.clear();
    };
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, [client]);
  return (
    <AuthContext.Provider
      value={{
        user: token ? me.data : undefined,
        loading: !!token && me.isPending,
        error: token ? me.error : null,
        retry: () => {
          void me.refetch();
        },
        signIn: (value) => {
          client.clear();
          tokenStore.set(value);
          setToken(value);
        },
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider required");
  return auth;
}
