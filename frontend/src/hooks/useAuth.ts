/**
 * Authentication Hook Stub - Adaptive Learning Ecosystem
 * Temporary stub for compilation
 */

export interface User {
  id: string;
  role: string;
  email: string;
  name: string;
  token?: string;
}

export const useAuth = () => {
  return {
    user: null as User | null,
    login: async () => {},
    logout: () => {},
    isAuthenticated: false,
    loading: false
  };
};

export default useAuth;