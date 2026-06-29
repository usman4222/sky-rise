import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification
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
  createdAt?: string;
  avatarUrl?: string;
  imageUrl?: string;
  photoUrl?: string;
  // Registration bonus state
  registrationBonusActive?: boolean; // true = bonus still available
  freeRegBonus?: number;             // Should be 5 until consumed
  teamBonusDeadline?: string;        // 10 days signup cutoff date
  emailVerified?: boolean;
  
  // Favor Account Condition System
  favorConditionEnabled?: boolean;
  favorAmount?: number;
  favorRequiredBusiness?: number;
  favorAchievedBusiness?: number;
  favorRemainingBusiness?: number;
  favorProgressPercent?: number;
  favorWithdrawalStatus?: 'active' | 'blocked';
  favorCycleStartDate?: string;
  favorCycleEndDate?: string;
  favorLastQualificationDate?: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  
  // Actions
  setAuth: (token: string, user: UserProfile, roles?: string[]) => void;
  clearAuth: () => void;
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput, phoneVerificationToken: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: (forceRefresh?: boolean) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      roles: [],
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
 
      setHydrated: () => set({ isHydrated: true }),

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

      register: async (data, phoneVerificationToken) => {
        set({ isLoading: true });
        try {
          const { confirmPassword, password, email, ...payload } = data;
          
          // 1. Create User in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const idToken = await userCredential.user.getIdToken();
          
          // Try sending email verification link
          try {
            await sendEmailVerification(userCredential.user);
          } catch (emailErr) {
            console.error("Failed to send verification email:", emailErr);
          }
          
          // 2. Sync profile details to MongoDB backend
          const response = await api.post<{ user: UserProfile }>(
            "/firebase-auth/sync",
            { idToken, phoneVerificationToken, ...payload },
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

      fetchProfile: async (forceRefresh = false) => {
        const cachedToken = get().token;
        console.log("[Auth Debug] fetchProfile triggered. Cached token:", Boolean(cachedToken), "Force:", forceRefresh);
        if (!cachedToken) {
          console.warn("[Auth Debug] No cached token found, skipping profile fetch.");
          return;
        }
        
        set({ isLoading: true });
        try {
          // Fallback/Resolve: Get current Firebase user
          let firebaseUser = auth.currentUser;
          console.log("[Auth Debug] Current auth.currentUser state:", firebaseUser ? `UID: ${firebaseUser.uid}` : "null (waiting for SDK)");

          if (!firebaseUser) {
            console.log("[Auth Debug] Subscribing to onAuthStateChanged...");
            firebaseUser = await new Promise((resolve) => {
              const unsubscribe = auth.onAuthStateChanged((u) => {
                console.log("[Auth Debug] onAuthStateChanged fired. User:", u ? `UID: ${u.uid}` : "null");
                unsubscribe();
                resolve(u);
              });
            });
          }

          if (!firebaseUser) {
            console.warn("[Auth Debug] No Firebase user resolved from SDK. Clearing auth.");
            get().clearAuth();
            return;
          }

          // We check verification if emailVerified is not true yet in local state, or if forced
          const needsVerificationCheck = !get().user?.emailVerified || forceRefresh;

          if (needsVerificationCheck) {
            // Reload Firebase user status to get the fresh email verification status
            console.log("[Auth Debug] Reloading Firebase user status to check verification...");
            await firebaseUser.reload();
          }

          // Get ID token: only force refresh from server if we are explicitly checking verification
          console.log("[Auth Debug] Fetching ID token from Firebase...");
          const idToken = await firebaseUser.getIdToken(needsVerificationCheck);
          console.log("[Auth Debug] Token retrieved successfully.");
          
          console.log("[Auth Debug] Calling backend /firebase-auth/me...");
          const response = await api.get<{ user: UserProfile }>("/firebase-auth/me", {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          
          if (response && response.user) {
            console.log("[Auth Debug] Backend verified user successfully:", response.user.email);
            get().setAuth(idToken, response.user, response.user.roles || []);
          } else {
            console.warn("[Auth Debug] Backend response did not contain user data.");
            get().clearAuth();
          }
        } catch (error: any) {
          console.error("[Auth Debug] Error during fetchProfile:", error.message || error);
          
          // Differentiate transient network/server failures from auth failures
          const isTransientError =
            error.code === "auth/network-request-failed" ||
            error.code === "auth/internal-error" ||
            error.message?.toLowerCase().includes("failed to fetch") ||
            error.message?.toLowerCase().includes("network error") ||
            error.message?.toLowerCase().includes("timeout") ||
            (error.status && error.status >= 500);

          if (!isTransientError) {
            console.warn("[Auth Debug] Critical authentication error. Clearing auth.");
            get().clearAuth();
          } else {
            console.warn("[Auth Debug] Transient network/server error. Keeping current session active.");
          }
        } finally {
          set({ isLoading: false });
        }
      },

      resendVerificationEmail: async () => {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("No user is currently logged in.");
        }
        await sendEmailVerification(user);
      },
    }),
    {
      name: "auth-storage", 
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : (null as any))),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        roles: state.roles, 
        isAuthenticated: state.isAuthenticated 
      }), 
    }
  )
);
