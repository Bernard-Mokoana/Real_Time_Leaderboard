export type Score = {
  userId: string;
  totalXp: number;
  lastEarned: Date | null;
};

export type ScoreRow = {
  user_id: string;
  total_xp: string;
  last_earned: Date | null;
};

export type ScoreCachedRow = {
  user_id: string;
  total_xp: string;
};
