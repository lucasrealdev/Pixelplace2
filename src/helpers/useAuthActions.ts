import { loginUser, registerUser } from "../services/dataService";

export function useAuthActions() {
  // Login
  const login = async (userName: string, password: string) => {
    const user = await loginUser(userName, password);
    return user;
  };

  // Cadastro
  const register = async (userName: string, password: string) => {
    const user = await registerUser(userName, password);
    return user;
  };

  return { login, register };
} 