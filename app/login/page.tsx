"use client";

import { useActionState } from "react";
import Image from "next/image";
import { login } from "@/app/actions/auth";
import Button from "@/components/Button";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="login-shell">
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Image
            src="/aria-hospital-logo.jpeg"
            alt="Aria Institute of Medical Sciences"
            width={180}
            height={101}
            priority
            style={{ margin: "0 auto", display: "block" }}
          />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-navy)", marginTop: 12 }}>
            AIMS QPS Rounding
          </h1>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 3 }}>
            Quality &amp; Patient Safety Rounding System
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

          <Button type="submit" className="btn-primary" isLoading={pending} loadingLabel="Signing in…">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
