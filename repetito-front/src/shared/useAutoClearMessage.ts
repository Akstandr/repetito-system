import { useEffect } from "react";

export function useAutoClearMessage(
  message: string | null,
  clearMessage: (value: string | null) => void,
  delayMs = 5000,
) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => clearMessage(null), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [clearMessage, delayMs, message]);
}
