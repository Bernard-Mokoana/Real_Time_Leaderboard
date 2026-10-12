import { apiClient } from "./client";

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  totalXp: number;
  lastEarned: string | null;
};

export type LeaderboardPage = {
  entries: LeaderboardEntry[];
  nextCursor: string | null;
  viewer: LeaderboardEntry | null;
};

type LeaderboardResponse = {
  data: LeaderboardPage;
};

export const leaderboardApi = {
  async getPage(cursor: string | null): Promise<LeaderboardPage> {
    const response = await apiClient.get<LeaderboardResponse>(
      "/leaderboard",
      {
        params: cursor ? { cursor } : undefined,
      },
    );

    return response.data.data;
  },
};
