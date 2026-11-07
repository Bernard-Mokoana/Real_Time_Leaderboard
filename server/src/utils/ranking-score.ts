export const SCORE_EPOCH_MS = Date.UTC(2020, 0, 1);

const TIME_BITS = 30;

export const TIME_SPAN = 2 ** TIME_BITS;

export const MAX_RANKABLE_XP = 2 ** 23 - 1;

export const encodeRankingScore = (
  totalXp: number,
  lastEarned: Date | null,
): number => {
  if (!Number.isSafeInteger(totalXp) || totalXp < 0) {
    throw new RangeError("totalXp must be a safe non-negative integer.");
  }

  const rankableXp = Math.min(totalXp, MAX_RANKABLE_XP);

  const secondsSinceEpoch =
    lastEarned === null
      ? TIME_SPAN - 1
      : Math.min(
          TIME_SPAN - 1,
          Math.max(
            0,
            Math.floor((lastEarned.getTime() - SCORE_EPOCH_MS) / 1000),
          ),
        );

  return rankableXp * TIME_SPAN + (TIME_SPAN - 1 - secondsSinceEpoch);
};

export const decodeTotalXp = (rankingScore: number): number => {
  return Math.floor(rankingScore / TIME_SPAN);
};

export const minimumScoreForXp = (xp: number): number => xp * TIME_SPAN;
