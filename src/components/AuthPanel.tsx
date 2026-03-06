"use client";

import { useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useMarket } from "@/lib/market-context";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

const providers = [
  { id: "google", label: "Continue with Google" },
];

export default function AuthPanel() {
  const { state, signIn } = useMarket();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const firebaseReady = isFirebaseConfigured();

  const handleEmailSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (!firebaseReady) {
      signIn({ name: name.trim(), email: email.trim().toLowerCase(), provider: "email" });
      return;
    }
    try {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim().toLowerCase(),
        password.trim()
      );
      await updateProfile(credential.user, { displayName: name.trim() });
      setMessage("Account created. You're in.");
    } catch (error) {
      try {
        const credential = await signInWithEmailAndPassword(
          getFirebaseAuth(),
          email.trim().toLowerCase(),
          password.trim()
        );
        if (!credential.user.displayName && name.trim()) {
          await updateProfile(credential.user, { displayName: name.trim() });
        }
        setMessage("Signed in.");
      } catch (signInError) {
        setMessage("Email auth failed. Check credentials.");
      }
    }
  };

  const handleSocial = async (provider: string) => {
    const displayName = name.trim() || "GP Racer";
    const userEmail = email.trim().toLowerCase() || `${provider}@gpcoins.dev`;
    if (!firebaseReady) {
      signIn({ name: displayName, email: userEmail, provider });
      return;
    }
    try {
      const auth = getFirebaseAuth();
      await signInWithPopup(auth, new GoogleAuthProvider());
      setMessage("Signed in.");
    } catch (error) {
      setMessage("Social sign-in failed. Check provider setup.");
    }
  };

  return (
    <div className="card auth" id="auth">
      <h3>Join the paddock</h3>
      <p className="muted">Every new trader gets 1,000 GP Coins to start.</p>
      {!firebaseReady && (
        <p className="muted small">Firebase not configured, using local demo auth.</p>
      )}
      {state.user ? (
        <div className="auth__signed">
          <p className="muted">Signed in as {state.user.name}.</p>
        </div>
      ) : (
        <>
          <form className="auth__form" onSubmit={handleEmailSignUp}>
            <label>
              Display name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="PolePositionKid"
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@f1grid.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            <button className="btn btn--primary" type="submit">
              Claim 1,000 GP Coins
            </button>
          </form>
          <div className="auth__divider">Or continue with</div>
          <div className="auth__social">
            {providers.map((provider) => (
              <button
                key={provider.id}
                className="btn btn--ghost btn--google"
                type="button"
                onClick={() => handleSocial(provider.id)}
              >
                <span className="btn__icon" aria-hidden>
                  <svg viewBox="0 0 48 48" role="img" focusable="false">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.2 3.22l6.86-6.86C35.9 2.17 30.4 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.5 13.36 17.84 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.14-3.08-.4-4.55H24v9.02h12.94c-.56 2.95-2.2 5.45-4.7 7.15l7.2 5.6C43.5 37.98 46.98 31.86 46.98 24.55z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.54 28.42c-.5-1.5-.78-3.1-.78-4.77s.28-3.27.78-4.77l-7.98-6.2C.94 16.46 0 20.12 0 23.65s.94 7.2 2.56 10.0l7.98-5.23z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.4 0 11.9-2.11 15.86-5.75l-7.2-5.6c-2 1.36-4.56 2.16-8.66 2.16-6.16 0-11.5-3.86-13.46-9.28l-7.98 5.23C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                </span>
                {provider.label}
              </button>
            ))}
          </div>
        </>
      )}
      {message && <p className="status">{message}</p>}
    </div>
  );
}
