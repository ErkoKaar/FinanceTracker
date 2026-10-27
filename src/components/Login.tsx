// Logged-out screen: email/password login. Sign-ups are closed (a trigger on auth.users rejects new
// accounts, see supabase/schema.sql), so there is no registration form; the public demo needs none.
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/finance-tracker-logo-transparent.png";
import { field, primaryButton } from "@/lib/ui";

export function Login({ signIn }: { signIn: ReturnType<typeof useAuth>["signIn"] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
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
              autoComplete="current-password"
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
          <button type="submit" disabled={submitting} className={`${primaryButton} w-full`}>
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
