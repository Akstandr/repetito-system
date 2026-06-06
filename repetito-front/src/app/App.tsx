import { useEffect, useState } from "react";
import { LandingPage, TutorCardDetailsPage } from "../features/landing";
import { AccountPage } from "../features/account/AccountPage";

function getCurrentPath() {
  return window.location.pathname;
}

function getChatConversationId(path: string) {
  const match = path.match(/^\/(?:account|profile)\/chat\/(\d+)$/);
  if (!match) {
    return null;
  }

  const conversationId = Number(match[1]);
  return Number.isFinite(conversationId) ? conversationId : null;
}

function getTutorCardId(path: string) {
  const match = path.match(/^\/tutor-cards\/(\d+)$/);
  if (!match) {
    return null;
  }

  const cardId = Number(match[1]);
  return Number.isFinite(cardId) ? cardId : null;
}

export default function App() {
  const [path, setPath] = useState(getCurrentPath);

  useEffect(() => {
    function handleNavigation() {
      setPath(getCurrentPath());
    }

    window.addEventListener("popstate", handleNavigation);

    return () => window.removeEventListener("popstate", handleNavigation);
  }, []);

  if (
    path === "/account" ||
    path === "/profile" ||
    path.startsWith("/account/") ||
    path.startsWith("/profile/")
  ) {
    return <AccountPage initialConversationId={getChatConversationId(path)} routePath={path} />;
  }

  const tutorCardId = getTutorCardId(path);
  if (tutorCardId !== null) {
    return <TutorCardDetailsPage cardId={tutorCardId} />;
  }

  return <LandingPage />;
}
