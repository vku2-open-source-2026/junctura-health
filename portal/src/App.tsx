// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { SignInPage, Skeleton } from "@junctura/health-ui";
import { useEffect, useRef, useState } from "react";
import { configureApi, getBlob, getJson, postBytes, postJson } from "./api";
import { auth, handleCallback, login, signOut, useSession } from "./auth";
import { loadConfig, type PortalConfig } from "./config";
import { DeskProvider, deskPageFor, isDeskRoute, type DeskApi } from "./desk";
import { PublicHome } from "./pages/PublicHome";
import { useHashRoute } from "./router";
import { staffFor, usernameOf } from "./session";
import { ContractDetailPage, ContractsPage, FacilitiesPage, WorkflowsPage } from "./space";
import { strings } from "./strings";

const CONTRACT_DETAIL = /^\/hop-dong\/([a-z][a-z0-9-]{0,62})$/;
const DESK_HOME = "/lam-viec";
const deskApi: DeskApi = { getJson, postJson, getBlob, postBytes };

/** The public page for a hash route; unknown routes show the home page. */
export function pageFor(route: string) {
  const detail = CONTRACT_DETAIL.exec(route);
  if (detail) return <ContractDetailPage slug={detail[1]} />;
  if (route === "/hop-dong") return <ContractsPage />;
  if (route === "/quy-trinh") return <WorkflowsPage />;
  if (route === "/co-so") return <FacilitiesPage />;
  return <PublicHome />;
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-app px-4">
      <Skeleton lines={2} className="w-56" />
    </div>
  );
}

/**
 * Root of Cổng Junctura Health, the GUI of Layer 2. Public pages explain the shared health
 * space. The signed-in workspace, in the order of the brief, is H (#/lam-viec: today, notices,
 * directory), P (#/ho-so: cross-facility cases) and D (#/dieu-hanh: live figures for the health
 * department); it signs facility staff in with Junctura and works on Layer 1. Patients never sign in here:
 * they use the MyHealth app of Layer 3.
 */
export function PortalApp() {
  const [route, navigate] = useHashRoute();
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const session = useSession();

  useEffect(() => { window.scrollTo?.(0, 0); }, [route]);

  useEffect(() => {
    void loadConfig().then(loaded => {
      configureApi(loaded.juncturaUrl);
      setConfig(loaded);
    });
  }, []);

  // Finish an OIDC redirect exactly once per page load, then return to where sign-in started.
  const handled = useRef(false);
  useEffect(() => {
    if (!config || handled.current) return;
    handled.current = true;
    if (!new URLSearchParams(window.location.search).has("code")) return;
    handleCallback(config)
      .then(returnTo => navigate(returnTo && isDeskRoute(returnTo) ? returnTo : DESK_HOME))
      .catch(() => { setMessage(strings.signIn.badRedirect); navigate(DESK_HOME); });
  }, [config, navigate]);

  // A 401 during use ends the session with a clear message.
  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (session) { wasSignedIn.current = true; return; }
    if (!wasSignedIn.current) return;
    wasSignedIn.current = false;
    if (auth.clearedBy() === "unauthorized") setMessage(strings.signIn.sessionEnded);
  }, [session]);

  if (!isDeskRoute(route)) return pageFor(route);
  if (!config) return <Splash />;

  if (!session) {
    const startSignIn = () => {
      setMessage(undefined);
      void login(config).catch(() => setMessage(strings.signIn.failed));
    };
    return (
      <SignInPage product={strings.app.name} title={strings.signIn.title} subtitle={strings.signIn.subtitle}
        note={strings.signIn.note} message={message} onSignIn={startSignIn} onBack={() => navigate("/")} />
    );
  }

  const staff = staffFor(usernameOf(session.accessToken) ?? "");
  if (!staff) {
    return (
      <SignInPage product={strings.app.name} title={strings.signIn.title} subtitle={strings.signIn.notStaff}
        note={strings.signIn.note} signInLabel={strings.signIn.signOut} onSignIn={() => { void signOut(config); }} onBack={() => navigate("/")} />
    );
  }

  return (
    <DeskProvider staff={staff} api={deskApi} signOut={() => { void signOut(config); }}>
      {deskPageFor(route) ?? deskPageFor(DESK_HOME)}
    </DeskProvider>
  );
}
