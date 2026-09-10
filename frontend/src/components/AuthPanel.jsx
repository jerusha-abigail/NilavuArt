import { useState } from "react";

export default function AuthPanel({ supabase, onClose }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleEmailAuth(event) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    const action = mode === "signup"
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });
    const { error } = await action;
    setStatus("idle");
    setMessage(error?.message || (mode === "signup" ? "Check your email to confirm your account." : "Signed in."));
  }

  async function handleGoogleAuth() {
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setMessage(error.message);
  }

  return (
    <div className="auth-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" type="button" onClick={onClose} aria-label="Close sign in">×</button>
        <span className="section-kicker">Private creative space</span>
        <h2 id="auth-title">{mode === "signup" ? "Create your studio" : "Welcome back"}</h2>
        <p>Sign in to see your private gallery, saved feedback, and progress.</p>
        <button className="google-auth" type="button" onClick={handleGoogleAuth}>
          Continue with Google
        </button>
        <div className="auth-divider"><span>or</span></div>
        <form onSubmit={handleEmailAuth}>
          <label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="auth-submit" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="auth-switch" type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </section>
    </div>
  );
}
