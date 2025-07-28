import { create } from 'zustand';
import { auth } from '@/lib/firebaseClient';
import { persist } from 'zustand/middleware';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';


interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
}

interface AuthActions {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  verifyAdmin: () => Promise<boolean>;
  clearError: () => void;
  initialize: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAdmin: false,
  loading: true,
  error: null,
  token: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      signInWithGoogle: async () => {
        try {
          set({ loading: true, error: null });
          
          const provider = new GoogleAuthProvider();
          provider.addScope('email');
          provider.addScope('profile');

          const result = await signInWithPopup(auth, provider);
          const user = result.user;
          const token = await user.getIdToken();

          // Verificar si es admin en el backend
          const adminCheck = await fetch('/admin/verify', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!adminCheck.ok) {
            throw new Error('No tienes permisos de administrador');
          }

          set({ 
            user, 
            isAdmin: true, 
            token,
            loading: false,
            error: null 
          });

        } catch (error) {
          console.error('Error en login:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Error al iniciar sesión',
            loading: false,
            user: null,
            isAdmin: false,
            token: null
          });
          throw error;
        }
      },

      signOut: async () => {
        try {
          set({ loading: true });
          await firebaseSignOut(auth);
          set({
            user: null,
            isAdmin: false,
            token: null,
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
          set({ 
            error: 'Error al cerrar sesión',
            loading: false 
          });
        }
      },

      verifyAdmin: async () => {
        const { token } = get();
        if (!token) return false;

        try {
          const response = await fetch('/api/admin/verify', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const isValidAdmin = response.ok;
          set({ isAdmin: isValidAdmin });
          return isValidAdmin;
        } catch (error) {
          console.error('Error verificando admin:', error);
          set({ isAdmin: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      initialize: () => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          try {
            if (user) {
              const token = await user.getIdToken();
              
              // Verificar permisos admin
              const adminCheck = await fetch('/api/admin/verify', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              set({
                user,
                token,
                isAdmin: adminCheck.ok,
                loading: false,
                error: null
              });
            } else {
              set({
                user: null,
                token: null,
                isAdmin: false,
                loading: false,
                error: null
              });
            }
          } catch (error) {
            console.error('Error en inicialización auth:', error);
            set({
              user: null,
              token: null,
              isAdmin: false,
              loading: false,
              error: 'Error de autenticación'
            });
          }
        });

        // Retornar función de limpieza
        return unsubscribe;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user ? {
          uid: state.user.uid,
          email: state.user.email,
          displayName: state.user.displayName,
          photoURL: state.user.photoURL,
        } : null,
        token: state.token,
        isAdmin: state.isAdmin,
      }),
    }
  )
);