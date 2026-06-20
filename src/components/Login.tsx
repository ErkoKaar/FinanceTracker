// Logged-out screen: email/password login + registration form.
import { useState } from "react";
import { Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";

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
      else if (!data.session) setInfo("Kontrolli emaili ja kinnita konto, enne kui sisse logid.");
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_oklch(0.22_0.02_165_/_0.4),_transparent_60%)]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Wallet className="size-7 text-primary" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Lumen</h1>
          <p className="text-xs text-muted-foreground mt-1">Personaalne rahahaldur</p>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Email</label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nt. mari@näide.ee"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Parool</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {info && <p className="text-xs text-primary">{info}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {mode === "login" ? "Logi sisse" : "Registreeri"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
              setInfo(null);
            }}
            className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition"
          >
            {mode === "login" ? "Pole veel kontot? Registreeri" : "Juba kasutaja? Logi sisse"}
          </button>
        </form>
      </div>
    </div>
  );
}
