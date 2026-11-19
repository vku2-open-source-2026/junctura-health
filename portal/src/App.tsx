// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { AppShell, SignInPage, Skeleton } from "@junctura/health-ui";
import { useEffect, useRef, useState } from "react";
import { configureApi } from "./api";
import { auth, handleCallback, login, signOut, useSession } from "./auth";
import type { PortalConfig } from "./config";
import { loadConfig } from "./config";
import { AccessPage } from "./pages/AccessPage";
import { ConsentsPage } from "./pages/ConsentsPage";
import { PublicHome } from "./pages/PublicHome";
import { useHashRoute } from "./router";
import { strings } from "./strings";

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-app px-4">
      <Skeleton lines={2} className="w-56" />
    </div>
  );
}

/** Root of the portal: runtime config, OIDC session and the three hash routes. */
export function PortalApp() {
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [signInCard, setSignInCard] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [route, navigate] = useHashRoute();
  const session = useSession();

  useEffect(() => {
    void loadConfig().then(loaded => {
      configureApi(loaded.juncturaUrl);
      setConfig(loaded);
    });
  }, []);

  // Finish an OIDC redirect exactly once per page load.
  const handled = useRef(false);
  useEffect(() => {
    if (!config || handled.current) return;
    handled.current = true;
    if (!new URLSearchParams(window.location.search).has("code")) return;
    handleCallback(config)
      .then(returnTo => { if (returnTo && returnTo !== "/") navigate(returnTo); })
      .catch(() => {
        setSignInCard(true);
        setMessage(strings.signIn.badRedirect);
      });
  }, [config, navigate]);

  // A signed-in person landing on the public page goes to their consents.
  useEffect(() => {
    if (session && route === "/") navigate("/dong-thuan");
  }, [session, route, navigate]);

  // A 401 during use ends the session with a clear message.
  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (session) { wasSignedIn.current = true; return; }
    if (!wasSignedIn.current) return;
    wasSignedIn.current = false;
    if (auth.clearedBy() === "unauthorized") {
      setSignInCard(true);
      setMessage(strings.signIn.sessionEnded);
    }
  }, [session]);

  const startSignIn = () => {
    setMessage(undefined);
    void login(config!).catch(() => setMessage(strings.signIn.failed));
  };

  if (!config) return <Splash />;

  if (!session) {
    // Protected routes ask for sign-in directly; the public page offers the sign-in card.
    if (signInCard || route !== "/") {
      return (
        <SignInPage product={strings.app.name} title={strings.signIn.title} subtitle={strings.signIn.subtitle}
          note={strings.signIn.note} message={message} onSignIn={startSignIn} onBack={() => { setSignInCard(false); navigate("/"); }} />
      );
    }
    return <PublicHome onSignIn={() => setSignInCard(true)} />;
  }

  const current = route === "/truy-cap" ? "truy-cap" : "dong-thuan";
  return (
    <AppShell
      product={strings.app.shortName}
      nav={[{ id: "dong-thuan", label: strings.nav.consents }, { id: "truy-cap", label: strings.nav.access }]}
      current={current}
      onNavigate={navigate}
      user={{ name: session.name ?? strings.app.userFallback }}
      onSignOut={() => { void signOut(config); }}
    >
      {current === "truy-cap" ? <AccessPage /> : <ConsentsPage />}
    </AppShell>
  );
}
