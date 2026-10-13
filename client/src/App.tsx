import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  authApi,
  type AuthSubmission,
  type User,
} from "./api/auth";
import { getErrorMessage } from "./api/client";
import {
  leaderboardApi,
  type LeaderboardPage as LeaderboardPageData,
} from "./api/leaderboard";
import { AuthForm } from "./components/AuthForm";
import { Leaderboard } from "./components/Leaderboard";

type RealtimeStatus = "connecting" | "connected" | "disconnected";

const getSocketOrigin = (): string | undefined => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!apiBaseUrl) {
    return undefined;
  }

  const apiOrigin = new URL(apiBaseUrl, window.location.origin).origin;

  return apiOrigin === window.location.origin ? undefined : apiOrigin;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [page, setPage] = useState<LeaderboardPageData | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [previousCursors, setPreviousCursors] = useState<(string | null)[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>("connecting");
  const [realtimeError, setRealtimeError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    authApi
      .currentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return;
        }

        setAuthError(getErrorMessage(error, "Unable to check your session."));
      })
      .finally(() => {
        if (active) {
          setCheckingSession(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setPage(null);
      setPageError(null);
      return;
    }

    let active = true;
    setPage(null);
    setPageLoading(true);
    setPageError(null);

    leaderboardApi
      .getPage(cursor)
      .then((leaderboardPage) => {
        if (active) {
          setPage(leaderboardPage);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setPageError(
            getErrorMessage(error, "Unable to load the leaderboard."),
          );
        }
      })
      .finally(() => {
        if (active) {
          setPageLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user, cursor, refreshVersion]);

  useEffect(() => {
    if (!user) {
      setRealtimeStatus("disconnected");
      setRealtimeError(null);
      return;
    }

    let hasConnected = false;
    const socketOrigin = getSocketOrigin();
    const socket = socketOrigin
      ? io(socketOrigin, { withCredentials: true })
      : io({ withCredentials: true });
    setRealtimeStatus("connecting");
    setRealtimeError(null);

    socket.on("connect", () => {
      const reconnected = hasConnected;
      hasConnected = true;
      setRealtimeStatus("connected");
      setRealtimeError(null);

      if (reconnected) {
        setCursor(null);
        setPreviousCursors([]);
        setRefreshVersion((version) => version + 1);
      }
    });
    socket.on("disconnect", () => {
      setRealtimeStatus("disconnected");
    });
    socket.on("connect_error", (error) => {
      setRealtimeStatus("disconnected");
      setRealtimeError(error.message);
    });
    socket.on("leaderboard:updated", () => {
      setCursor(null);
      setPreviousCursors([]);
      setRefreshVersion((version) => version + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleAuthSubmit = useCallback(
    async ({ input, mode }: AuthSubmission) => {
      setAuthSubmitting(true);
      setAuthError(null);

      try {
        const authenticatedUser =
          mode === "register"
            ? await authApi.register(input)
            : await authApi.login(input);
        setUser(authenticatedUser);
        setCursor(null);
        setPreviousCursors([]);
      } catch (error: unknown) {
        setAuthError(getErrorMessage(error, "Unable to sign in."));
      } finally {
        setAuthSubmitting(false);
      }
    },
    [],
  );

  const handleLogout = async () => {
    setAuthError(null);

    try {
      await authApi.logout();
      setUser(null);
      setPage(null);
    } catch (error: unknown) {
      setAuthError(getErrorMessage(error, "Unable to sign out."));
    }
  };

  const handleNextPage = () => {
    if (!page?.nextCursor) {
      return;
    }

    setPreviousCursors((cursors) => [...cursors, cursor]);
    setCursor(page.nextCursor);
  };

  const handlePreviousPage = () => {
    if (previousCursors.length === 0) {
      return;
    }

    const previousCursor = previousCursors[previousCursors.length - 1];
    setPreviousCursors((cursors) => cursors.slice(0, -1));
    setCursor(previousCursor ?? null);
  };

  if (checkingSession) {
    return <main aria-busy="true">Checking your session...</main>;
  }

  if (!user) {
    return (
      <AuthForm
        error={authError}
        submitting={authSubmitting}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Leaderboard</h1>
        <p>
          Signed in as {user.firstName} {user.lastName} ({user.email})
        </p>
        <button type="button" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      {authError && <p role="alert">{authError}</p>}
      <p role="status">
        Live updates: {realtimeStatus}
        {realtimeError && ` (${realtimeError})`}
      </p>

      <Leaderboard
        page={page}
        loading={pageLoading}
        error={pageError}
        hasPreviousPage={previousCursors.length > 0}
        onNextPage={handleNextPage}
        onPreviousPage={handlePreviousPage}
      />
    </main>
  );
}
