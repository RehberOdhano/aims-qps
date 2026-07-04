"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, var(--color-navy) 0%, var(--color-teal) 100%)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "36px 40px",
          width: 380,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-navy)" }}>
            AIMS QPS Rounding
          </h1>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 3 }}>
            Aria Institute of Medical Sciences
          </p>
        </div>

        <form action={formAction}>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="username"
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "#4A5568",
                marginBottom: 5,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1.5px solid var(--color-border)",
                borderRadius: 6,
                fontSize: 13,
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "#4A5568",
                marginBottom: 5,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1.5px solid var(--color-border)",
                borderRadius: 6,
                fontSize: 13,
                fontFamily: "inherit",
              }}
            />
          </div>

          {state?.error && (
            <div
              style={{
                background: "var(--color-danger-bg)",
                border: "1px solid var(--color-danger-border)",
                borderRadius: 6,
                padding: "9px 12px",
                fontSize: 12,
                color: "var(--color-danger-text)",
                marginBottom: 16,
              }}
            >
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{
              width: "100%",
              padding: 11,
              background: "var(--color-navy)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: pending ? "default" : "pointer",
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
