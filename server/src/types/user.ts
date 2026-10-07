export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
};

export type UserWithPassword = AuthUser & {
  passwordHash: string;
};

export type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  created_at: Date;
};
