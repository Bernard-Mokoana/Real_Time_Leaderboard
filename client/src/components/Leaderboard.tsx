import type { LeaderboardPage as LeaderboardPageData } from "../api/leaderboard";

type LeaderboardProps = {
  page: LeaderboardPageData | null;
  loading: boolean;
  error: string | null;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
};

const formatLastEarned = (value: string | null): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

export function Leaderboard({
  page,
  loading,
  error,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
}: LeaderboardProps) {
  return (
    <section aria-labelledby="leaderboard-heading">
      <h2 id="leaderboard-heading">Global leaderboard</h2>

      {page?.viewer && (
        <p>
          Your rank: {page.viewer.rank} — {page.viewer.totalXp} XP
        </p>
      )}

      {loading && <p role="status">Loading leaderboard...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && page && page.entries.length === 0 && (
        <p>No scores yet.</p>
      )}

      {page && page.entries.length > 0 && (
        <table>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Player</th>
              <th scope="col">XP</th>
              <th scope="col">Last earned</th>
            </tr>
          </thead>
          <tbody>
            {page.entries.map((entry) => (
              <tr key={entry.userId}>
                <td>{entry.rank}</td>
                <td>
                  {entry.avatarUrl && (
                    <img
                      src={entry.avatarUrl}
                      alt=""
                      width="32"
                      height="32"
                    />
                  )}{" "}
                  {entry.firstName} {entry.lastName}
                  {page.viewer?.userId === entry.userId && " (you)"}
                </td>
                <td>{entry.totalXp}</td>
                <td>{formatLastEarned(entry.lastEarned)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <nav aria-label="Leaderboard pages">
        <button
          type="button"
          onClick={onPreviousPage}
          disabled={!hasPreviousPage || loading}
        >
          Previous
        </button>{" "}
        <button
          type="button"
          onClick={onNextPage}
          disabled={!page?.nextCursor || loading}
        >
          Next
        </button>
      </nav>
    </section>
  );
}
