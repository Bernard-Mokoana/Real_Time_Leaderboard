import type {
  LeaderboardEventRow,
  LeaderboardEvent,
  LeaderboardRow,
  LeaderboardEntry,
} from "../types/leaderboard.js";
import type { Score, ScoreRow } from "../types/score.js";
import type {
  Task,
  TaskRow,
  TaskWithStatus,
  TaskWithStatusRow,
} from "../types/task.js";
import type { UserRow, UserWithPassword } from "../types/user.js";

export const toLeaderboardEvent = (
  row: LeaderboardEventRow,
): LeaderboardEvent => ({
  id: row.id,
  userId: row.user_id,
  taskId: row.task_id,
  xpDelta: row.xp_delta,
  eventType: row.event_type,
  referenceId: row.reference_id,
  createdAt: row.created_at,
});

export const toLeaderboardEntry = (row: LeaderboardRow): LeaderboardEntry => ({
  rank: Number(row.rank),
  userId: row.user_id,
  firstName: row.first_name,
  lastName: row.last_name,
  avatarUrl: row.avatar_url,
  totalXp: Number(row.total_xp),
  lastEarned: row.last_earned,
});

export const toScore = (row: ScoreRow): Score => ({
  userId: row.user_id,
  totalXp: Number(row.total_xp),
  lastEarned: row.last_earned,
});

export const toTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  taskType: row.task_type,
  xpValue: row.xp_value,
});

export const toUserWithPassword = (row: UserRow): UserWithPassword => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  passwordHash: row.password_hash,
  avatarUrl: row.avatar_url,
  createdAt: row.created_at,
});

export const toEntry = (
  row: LeaderboardRow,
  rank: number,
): LeaderboardEntry => ({
  rank,
  userId: row.user_id,
  firstName: row.first_name,
  lastName: row.last_name,
  avatarUrl: row.avatar_url,
  totalXp: Number(row.total_xp ?? 0),
  lastEarned: row.last_earned,
});

export const toTaskWithStatus = (row: TaskWithStatusRow): TaskWithStatus => ({
  ...toTask(row),
  completed: row.completed,
});
