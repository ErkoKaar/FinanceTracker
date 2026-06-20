// The "/" route: FinanceTracker's entry point — picks Login or Dashboard based on Supabase auth state.
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useOnlineStatus } from "@/lib/use-online-status";
import { Login } from "@/components/Login";
import { Dashboard } from "@/components/Dashboard";
import { OfflineNotice } from "@/components/OfflineNotice";

export const Route = createFileRoute("/")({
  component: App,
});

function FullScreenMessage({ text }: { text: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">{text}</div>
  );
}

function App() {
  const isOnline = useOnlineStatus();
  const { user, loading, signIn, signUp, signOut } = useAuth();
  if (!isOnline) return <OfflineNotice />;
  if (loading) return <FullScreenMessage text="Loading..." />;
  return user ? (
    <Dashboard userId={user.id} email={user.email ?? ""} onSignOut={signOut} />
  ) : (
    <Login signIn={signIn} signUp={signUp} />
  );
}
