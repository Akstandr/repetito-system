import { useEffect, useState } from "react";
import { LandingPage, PublicProfilePage, PublicProfileSearchPage, TutorCardDetailsPage } from "../features/landing";
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

function getPublicProfileId(path: string) {
  const match = path.match(/^\/profile\/(\d+)$/);
  if (!match) {
    return null;
  }

  const profileId = Number(match[1]);
  return Number.isFinite(profileId) ? profileId : null;
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

  const publicProfileId = getPublicProfileId(path);
  if (publicProfileId !== null) {
    return <PublicProfilePage accountId={publicProfileId} />;
  }

  if (path === "/search") {
    return <PublicProfileSearchPage />;
  }

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
