import type { DatabaseClient } from "../types/types.js";
import type { AuthUser, UserWithPassword, UserRow } from "../types/user.js";
import type {
  LeaderboardProfile,
  LeaderboardProfileRow,
} from "../types/leaderboard.js";

import { toUserWithPassword } from "../utils/mappers.js";

const withoutPassword = (user: UserWithPassword): AuthUser => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

export const userRepository = {
  async create(
    client: DatabaseClient,
    input: {
      firstName: string;
      lastName: string;
      email: string;
      passwordHash: string;
    },
  ): Promise<AuthUser> {
    const result = await client.query<UserRow>(
      `
        INSERT INTO users (
          first_name,
          last_name,
          email,
          password_hash
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          first_name,
          last_name,
          email,
          password_hash,
          avatar_url,
          created_at
      `,
      [input.firstName, input.lastName, input.email, input.passwordHash],
    );

    return withoutPassword(toUserWithPassword(result.rows[0]!));
  },

  async findByEmail(
    client: DatabaseClient,
    email: string,
  ): Promise<UserWithPassword | null> {
    const result = await client.query<UserRow>(
      `
        SELECT
          id,
          first_name,
          last_name,
          email,
          password_hash,
          avatar_url,
          created_at
        FROM users
        WHERE email = $1
      `,
      [email.toLowerCase().trim()],
    );

    const row = result.rows[0];

    return row ? toUserWithPassword(row) : null;
  },

  async findById(
    client: DatabaseClient,
    userId: string,
  ): Promise<AuthUser | null> {
    const result = await client.query<UserRow>(
      `
        SELECT
          id,
          first_name,
          last_name,
          email,
          password_hash,
          avatar_url,
          created_at
        FROM users
        WHERE id = $1
      `,
      [userId],
    );

    const row = result.rows[0];

    return row ? withoutPassword(toUserWithPassword(row)) : null;
  },

  async findLeaderboardProfilesByIds(
    client: DatabaseClient,
    userIds: string[],
  ): Promise<LeaderboardProfile[]> {
    if (userIds.length === 0) {
      return [];
    }

    const result = await client.query<LeaderboardProfileRow>(
      `
      SELECT id, first_name, last_name, avatar_url
      FROM users
      WHERE id = ANY($1::uuid[])
      `,
      [userIds],
    );

    return result.rows.map((row) => ({
      userId: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      avatarUrl: row.avatar_url,
    }));
  },
};
