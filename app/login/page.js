"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues with Firebase Client SDK
    const initAuth = async () => {
      const { getAuth } = await import("firebase/auth");
      const { getApps, initializeApp } = await import("firebase/app");
      if (!getApps().length) {
        initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        });
      }
      setAuth(getAuth());
    };
    initAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    setError(null);

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      
      const idToken = await userCredential.user.getIdToken();

      // Exchange for session cookie
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error("Failed to create session");
      }

      await auth.signOut(); // We rely entirely on the session cookie server-side
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to sign in. Please verify your credentials.");
      // Ensure we sign out if something fails
      if (auth?.currentUser) {
        await auth.signOut();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Owner Dashboard Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your site and listings
          </p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-trade-primary focus:border-trade-primary sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-trade-primary focus:border-trade-primary sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !auth}
              className={`relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-trade-primary border border-transparent rounded-md hover:bg-trade-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-trade-primary ${
                isLoading || !auth ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
