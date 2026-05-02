'use client'

import React, { useEffect, useState } from "react";
// TODO: import from lib
import type { AuthSession } from "../../../core/dist/session";
import { NextSessionProvider } from "simple-auth-ts-next";
import { getValidSession } from "../auth/actions";

// TODO: move the logic into the lib, just pass the getValidSession action promise in

type SessionState = {
  status: "loading" | "authenticated" | "unauthenticated";
  session?: AuthSession;
};

export function SessionProvider(props: { session: AuthSession | undefined; children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    status: "loading",
    session: props.session,
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

  return (
    <NextSessionProvider session={state.session}>
      {props.children}
    </NextSessionProvider>
  );
}