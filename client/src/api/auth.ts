import { apiClient } from "./client";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthSubmission =
  | { mode: "login"; input: LoginInput }
  | { mode: "register"; input: RegisterInput };

type UserResponse = {
  data: {
    user: User;
  };
};

export const authApi = {
  async currentUser(): Promise<User> {
    const response = await apiClient.get<UserResponse>("/auth/me");
    return response.data.data.user;
  },

  async login(input: LoginInput): Promise<User> {
    const response = await apiClient.post<UserResponse>("/auth/login", input);
    return response.data.data.user;
  },

  async register(input: RegisterInput): Promise<User> {
    const response = await apiClient.post<UserResponse>(
      "/auth/register",
      input,
    );
    return response.data.data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },
};
