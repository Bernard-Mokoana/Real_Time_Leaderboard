import type { Score } from "./score.js";

export type LeaderboardEvent = {
  id: string;
  userId: string;
  taskId: string;
  xpDelta: number;
  eventType: string;
  referenceId: string | null;
  createdAt: Date;
};

export type LeaderboardEventRow = {
  id: string;
  user_id: string;
  task_id: string;
  xp_delta: number;
  event_type: string;
  reference_id: string | null;
  created_at: Date;
};

export type AwardXpInput = {
  userId: string;
  taskId: string;
  referenceId: string;
};

export type AwardXpResult = {
  event: LeaderboardEvent;
  score: Score;
  wasAlreadyProcessed: boolean;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  totalXp: number;
  lastEarned: Date | null;
};

export type LeaderboardCursor = {
  totalXp: number;
  userId: string;
};

export type LeaderboardPage = {
  entries: LeaderboardEntry[];
  nextCursor: string | null;
  viewer: LeaderboardEntry | null;
};

export type LeaderboardRow = {
  rank: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  total_xp: string;
  last_earned: Date | null;
};

export type LeaderboardUpdateEvent = {
  userId: string;
  xpDelta: number;
  totalXp: number;
  occurredAt: string;
};

export type CachedLeaderboardEntry = {
  userId: string;
  totalXp: number;
  rank: number;
};

export type LeaderboardProfile = {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export type LiveLeaderboardEntry = LeaderboardProfile & {
  rank: number;
  totalXp: number;
};

export type LiveLeaderboard = {
  entries: LiveLeaderboardEntry[];
  totalParticipants: number;
};

export type LeaderboardProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};
