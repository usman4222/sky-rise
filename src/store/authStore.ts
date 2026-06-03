import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut
} from "firebase/auth";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth";

export interface UserProfile {
  id: string;
  firebaseUid: string;
  name: string;
  email: string;
  phone?: string;
  referralCode: string;
  sponsor?: string;
  kycStatus: string;
  status?: string;
  vipRank?: number;
  achievementRank?: number;
  roles?: string[];
  role?: string;
  wallets?: any;
  signupBonus?: any;
  unlockedLevels?: number[];
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (token: string, user: UserProfile, roles?: string[]) => void;
  clearAuth: () => void;
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      roles: [],
      isAuthenticated: false,
      isLoading: false,

      setAuth: (token, user, roles = []) => {
        set({
          token,
          user,
          roles,
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        set({
          token: null,
          user: null,
          roles: [],
          isAuthenticated: false,
        });
      },

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          // 1. Authenticate with Firebase
          const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
          const idToken = await userCredential.user.getIdToken();
          
          // Temporarily set token so api client could use it, but we override header anyway
          get().setAuth(idToken, {} as any, []);
          
          // 2. Fetch or Sync with MongoDB backend using Firebase token
          const response = await api.get<{ user: UserProfile }>("/firebase-auth/me", {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          
          if (response && response.user) {
            get().setAuth(idToken, response.user, response.user.roles || []);
          }
        } catch (error: any) {
          get().clearAuth();
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const { confirmPassword, password, email, ...payload } = data;
          
          // 1. Create User in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const idToken = await userCredential.user.getIdToken();
          
          // 2. Sync profile details to MongoDB backend
          const response = await api.post<{ user: UserProfile }>(
            "/firebase-auth/sync",
            { idToken, ...payload },
            { headers: { Authorization: `Bearer ${idToken}` } }
          );
          
          if (response && response.user) {
            get().setAuth(idToken, response.user, response.user.roles || []);
          }
        } catch (error: any) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await signOut(auth);
        } finally {
          get().clearAuth();
          set({ isLoading: false });
        }
      },

      fetchProfile: async () => {
        if (!get().token) return;
        set({ isLoading: true });
        try {
          // Safely grab fresh token if Firebase SDK has initialized the user
          let idToken = get().token;
          if (auth.currentUser) {
             idToken = (await auth.currentUser.getIdToken(true)) || idToken;
          }
          
          const response = await api.get<{ user: UserProfile }>("/firebase-auth/me", {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          
          if (response && response.user) {
             // TypeScript ensures idToken is string here, since it comes from get().token or auth
            get().setAuth(idToken as string, response.user, response.user.roles || []);
          }
        } catch (error) {
          get().clearAuth();
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage", 
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : (null as any))),
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        roles: state.roles, 
        isAuthenticated: state.isAuthenticated 
      }), 
    }
  )
);
