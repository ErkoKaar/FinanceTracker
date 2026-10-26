// Logged-out screen: email/password login + registration form.
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/finance-tracker-logo-transparent.png";
import { field, primaryButton } from "@/lib/ui";

export function Login({
  signIn,
  signUp,
}: {
  signIn: ReturnType<typeof useAuth>["signIn"];
  signUp: ReturnType<typeof useAuth>["signUp"];
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { data, error } = await signUp(email, password);
      if (error) setError(error.message);
      else if (!data.session) setInfo("Check your email to confirm your account before logging in.");
    }
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-dvh items-center px-4 py-12">
      <div className="aurora" aria-hidden />
      <div className="rise mx-auto grid w-full max-w-4xl items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:gap-16">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <img src={logo} alt="" className="logo-glow size-24 md:size-32" />
          <h1 className="display mt-6 text-[clamp(2.75rem,8vw,4.5rem)] font-bold">FinanceTracker</h1>
          <p className="mt-3 max-w-[32ch] text-sm text-muted-foreground">
            Track what you spend and earn, plan each month, and see where the money went.
          </p>
        </div>

        <form onSubmit={submit} className="glass space-y-4 rounded-[20px] p-6">
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-xs text-muted-foreground">
              Email
            </label>
            <input
              id="login-email"
              autoFocus
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. mari@example.com"
              className={`${field} w-full`}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="login-password" className="text-xs text-muted-foreground">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${field} w-full`}
            />
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="text-xs text-primary">
              {info}
            </p>
          )}
          <button type="submit" disabled={submitting} className={`${primaryButton} w-full`}>
            {mode === "login" ? "Log in" : "Sign up"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
              setInfo(null);
            }}
            className="block w-full py-1 text-center text-xs text-muted-foreground transition hover:text-foreground"
          >
            {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
