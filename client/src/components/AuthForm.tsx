import { useState, type FormEvent } from "react";
import type { AuthSubmission } from "../api/auth";

type AuthMode = "login" | "register";

type AuthFormProps = {
  error: string | null;
  submitting: boolean;
  onSubmit: (submission: AuthSubmission) => void;
};

export function AuthForm({
  error,
  submitting,
  onSubmit,
}: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const isRegistering = mode === "register";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    if (isRegistering) {
      onSubmit({
        mode,
        input: {
          firstName: String(formData.get("firstName")),
          lastName: String(formData.get("lastName")),
          email,
          password,
        },
      });
      return;
    }

    onSubmit({ mode, input: { email, password } });
  };

  return (
    <main className="page auth-page">
      <h1>Leaderboard</h1>
      <h2>{isRegistering ? "Create an account" : "Sign in"}</h2>

      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <>
            <label>
              First name
              <input name="firstName" autoComplete="given-name" required />
            </label>
            <label>
              Last name
              <input name="lastName" autoComplete="family-name" required />
            </label>
          </>
        )}
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            minLength={isRegistering ? 12 : 1}
            required
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting
            ? "Please wait..."
            : isRegistering
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p>
        {isRegistering ? "Already have an account?" : "New here?"}{" "}
        <button
          type="button"
          onClick={() => setMode(isRegistering ? "login" : "register")}
        >
          {isRegistering ? "Sign in" : "Create an account"}
        </button>
      </p>
    </main>
  );
}
