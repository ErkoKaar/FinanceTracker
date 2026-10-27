// Landing page for the bank authorization redirect: Enable Banking sends the user back here with
// ?code=... after they approve access at the bank. Exchanges the code for a stored connection
// (which also runs the initial one-year import) and links back home.
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { completeBankAuth, consumePendingBankAuth } from "@/lib/bank";

export const Route = createFileRoute("/bank-callback")({
  component: BankCallback,
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
});

type State = { status: "working" | "done" | "error"; message: string };

function BankCallback() {
  const { code, state: returnedState, error: bankError } = Route.useSearch();
  const { user, loading } = useAuth();
  const [state, setState] = useState<State>({
    status: "working",
    message: "Connecting your bank and importing transactions — this can take a minute...",
  });
  // The code is single-use, so the exchange must run exactly once (guards React StrictMode's
  // double effect run in dev).
  const started = useRef(false);

  useEffect(() => {
    if (loading || started.current) return;
    if (bankError) {
      setState({ status: "error", message: `The bank returned an error: ${bankError}` });
      return;
    }
    if (!code) {
      setState({ status: "error", message: "Missing authorization code in the redirect URL." });
      return;
    }
    if (!user) {
      setState({ status: "error", message: "You're not logged in. Log in first, then connect the bank again." });
      return;
    }
    started.current = true;
    if (!consumePendingBankAuth(returnedState)) {
      setState({
        status: "error",
        message: "This bank link wasn't started from this browser tab. Connect the bank again from the app.",
      });
      return;
    }
    completeBankAuth(code)
      .then((result) =>
        setState({
          status: "done",
          message: `Bank connected — imported ${result.imported} transactions from ${result.accounts} account${result.accounts === 1 ? "" : "s"}.`,
        })
      )
      .catch((err) =>
        setState({ status: "error", message: err instanceof Error ? err.message : "Connecting the bank failed." })
      );
  }, [loading, user, code, returnedState, bankError]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {state.status === "working" && "Connecting bank..."}
          {state.status === "done" && "Bank connected"}
          {state.status === "error" && "Bank connection failed"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
        {state.status !== "working" && (
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to the app
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
