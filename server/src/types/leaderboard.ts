export type Task = {
  id: string;
  title: string;
  taskType: string;
  xpValue: number;
};

export type LeaderboardEvent = {
  id: string;
  userId: string;
  taskId: string;
  xpDelta: number;
  eventType: string;
  referenceId: string | null;
  createdAt: Date;
};

export type Score = {
  userId: string;
  totalXp: number;
  lastEarned: Date | null;
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
