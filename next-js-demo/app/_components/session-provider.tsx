'use client'

import React, { useEffect, useState } from "react";
import type { AuthSession } from "../../../core/dist/session";
import { NextSessionProvider } from "simple-auth-ts-next";
import { getValidSession } from "../auth/actions";

// TODO: consider another approach where we eagerly load and check the session form the cookie while the action is loading
// TODO: move the logic into the lib, just pass the promise in

type SessionState = {
  status: "loading" | "authenticated" | "unauthenticated";
  session?: AuthSession;
};

export function SessionProvider(props: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const session = await getValidSession();

        if (cancelled) return;

        if (session) {
          setState({
            status: "authenticated",
            session,
          });
        } else {
          setState({
            status: "unauthenticated",
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            status: "unauthenticated",
          });
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div>
        Loading session...
      </div>
    );
  }

  return (
    <NextSessionProvider session={state.session}>
      {props.children}
    </NextSessionProvider>
  );
}