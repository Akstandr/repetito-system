import { useCallback, useEffect, useRef, useState } from "react";
import { MARKETPLACE_API_BASE_URL, formatErrorMessage, getAuthHeaders, readErrorMessage } from "./api";

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderUserId: number;
  senderAccountId: number | null;
  senderFirstName: string;
  senderLastName: string;
  senderType: "STUDENT" | "TUTOR" | "ADMIN" | "USER";
  text: string;
  readAt: string | null;
  createdAt: string;
}

interface MessagePage {
  items: ChatMessage[];
  hasMore: boolean;
  nextCursor: number | null;
}

export function chatDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function formatChatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatChatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (chatDateKey(value) === chatDateKey(today.toISOString())) return "Сегодня";
  if (chatDateKey(value) === chatDateKey(yesterday.toISOString())) return "Вчера";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  }).format(date);
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return Array.from(byId.values()).sort((left, right) => left.id - right.id);
}

export function useConversationMessages(conversationId: number | null, onActivity?: () => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const loadingOlderRef = useRef(false);
  const hasMoreRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const onActivityRef = useRef(onActivity);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { onActivityRef.current = onActivity; }, [onActivity]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    window.requestAnimationFrame(() => {
      const element = scrollRef.current;
      if (!element) return;
      element.scrollTo({ top: element.scrollHeight, behavior });
      nearBottomRef.current = true;
      setIsNearBottom(true);
      setNewMessagesCount(0);
    });
  }, []);

  const fetchPage = useCallback(async (beforeMessageId?: number) => {
    if (!conversationId) return null;
    const params = new URLSearchParams({ limit: "30" });
    if (beforeMessageId) params.set("beforeMessageId", String(beforeMessageId));
    const response = await fetch(`${MARKETPLACE_API_BASE_URL}/conversations/${conversationId}/messages?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await readErrorMessage(response, "Не удалось загрузить сообщения"));
    return (await response.json()) as MessagePage;
  }, [conversationId]);

  const loadInitial = useCallback(async () => {
    if (!conversationId) return;
    setIsInitialLoading(true);
    setError(null);
    try {
      const page = await fetchPage();
      if (!page) return;
      setMessages(page.items);
      setHasMore(page.hasMore);
      setNewMessagesCount(0);
      scrollToBottom();
      onActivityRef.current?.();
    } catch (reason) {
      setError(formatErrorMessage(reason instanceof Error ? reason.message : "", "Не удалось загрузить сообщения"));
    } finally {
      setIsInitialLoading(false);
    }
  }, [conversationId, fetchPage, scrollToBottom]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || loadingOlderRef.current || !hasMoreRef.current || messagesRef.current.length === 0) return;
    const element = scrollRef.current;
    const previousHeight = element?.scrollHeight ?? 0;
    const previousScrollTop = element?.scrollTop ?? 0;
    loadingOlderRef.current = true;
    setIsLoadingOlder(true);
    try {
      const page = await fetchPage(messagesRef.current[0].id);
      if (!page) return;
      setMessages((current) => mergeMessages(page.items, current));
      setHasMore(page.hasMore);
      window.requestAnimationFrame(() => {
        if (element) {
          element.scrollTop = previousScrollTop + element.scrollHeight - previousHeight;
        }
      });
    } catch (reason) {
      setError(formatErrorMessage(reason instanceof Error ? reason.message : "", "Не удалось загрузить предыдущие сообщения"));
    } finally {
      loadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  }, [conversationId, fetchPage]);

  const refreshLatest = useCallback(async () => {
    if (!conversationId) return;
    try {
      const page = await fetchPage();
      if (!page) return;
      const knownIds = new Set(messagesRef.current.map((message) => message.id));
      const added = page.items.filter((message) => !knownIds.has(message.id)).length;
      setMessages((current) => mergeMessages(current, page.items));
      setRealtimeError(null);
      if (added > 0) {
        if (nearBottomRef.current) scrollToBottom("smooth");
        else setNewMessagesCount((count) => count + added);
      }
      onActivityRef.current?.();
    } catch {
      setRealtimeError("Не удалось обновить сообщения. Повторяем подключение...");
    }
  }, [conversationId, fetchPage, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!conversationId) return false;
    const normalized = text.trim();
    if (!normalized) {
      setError("Нельзя отправить пустое сообщение");
      return false;
    }
    setIsSending(true);
    setError(null);
    try {
      const response = await fetch(`${MARKETPLACE_API_BASE_URL}/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ text: normalized }),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, "Не удалось отправить сообщение"));
      const created = (await response.json()) as ChatMessage;
      setMessages((current) => mergeMessages(current, [created]));
      if (nearBottomRef.current) scrollToBottom("smooth");
      else setNewMessagesCount((count) => count + 1);
      onActivityRef.current?.();
      return true;
    } catch (reason) {
      setError(formatErrorMessage(reason instanceof Error ? reason.message : "", "Не удалось отправить сообщение"));
      return false;
    } finally {
      setIsSending(false);
    }
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    setMessages([]);
    setHasMore(false);
    setNewMessagesCount(0);
    setError(null);
    setRealtimeError(null);
    nearBottomRef.current = true;
    setIsNearBottom(true);
    if (conversationId) void loadInitial();
  }, [conversationId, loadInitial]);

  useEffect(() => {
    if (!conversationId) return;
    const timer = window.setInterval(() => void refreshLatest(), 3000);
    return () => window.clearInterval(timer);
  }, [conversationId, refreshLatest]);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    nearBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    setIsNearBottom(nearBottomRef.current);
    if (nearBottomRef.current) setNewMessagesCount(0);
    if (element.scrollTop < 80) void loadOlder();
  }, [loadOlder]);

  return {
    messages,
    isInitialLoading,
    isLoadingOlder,
    isSending,
    hasMore,
    isNearBottom,
    newMessagesCount,
    error,
    realtimeError,
    scrollRef,
    handleScroll,
    scrollToBottom,
    sendMessage,
  };
}
