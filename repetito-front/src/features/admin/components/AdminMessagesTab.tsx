import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, Check, CheckCheck, Loader2, Send } from "lucide-react";
import { MARKETPLACE_API_BASE_URL, formatErrorMessage, getAuthHeaders, readErrorMessage } from "../../../shared/api";
import { useAutoClearMessage } from "../../../shared/useAutoClearMessage";
import { chatDateKey, formatChatDate, formatChatTime, useConversationMessages } from "../../../shared/useConversationMessages";

interface Conversation {
  id: number;
  counterpartFirstName: string;
  counterpartLastName: string;
  counterpartType: "STUDENT" | "TUTOR" | "ADMIN" | "USER";
  lastMessageText: string | null;
  unreadMessagesCount: number;
}

const typeLabel = (type: Conversation["counterpartType"]) => {
  if (type === "STUDENT") return "Ученик";
  if (type === "TUTOR") return "Репетитор";
  if (type === "ADMIN") return "Администратор";
  return "Пользователь";
};

interface Props {
  currentUserId: number;
  initialConversationId: number | null;
  onConversationChange: (id: number | null) => void;
}

export function AdminMessagesTab({ currentUserId, initialConversationId, onConversationChange }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(initialConversationId);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useAutoClearMessage(error, setError);

  const loadConversations = useCallback(async () => {
    const response = await fetch(`${MARKETPLACE_API_BASE_URL}/conversations/my`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error(await readErrorMessage(response, "Не удалось загрузить диалоги"));
    setConversations(await response.json());
  }, []);

  const {
    messages,
    isInitialLoading,
    isLoadingOlder,
    isSending,
    hasMore,
    isNearBottom,
    newMessagesCount,
    error: messageError,
    realtimeError,
    scrollRef,
    handleScroll,
    scrollToBottom,
    sendMessage,
  } = useConversationMessages(selectedId, () => { void loadConversations(); });

  useEffect(() => { setSelectedId(initialConversationId); }, [initialConversationId]);
  useEffect(() => {
    setLoading(true);
    loadConversations()
      .catch((reason) => setError(formatErrorMessage(reason instanceof Error ? reason.message : "", "Не удалось загрузить диалоги")))
      .finally(() => setLoading(false));
  }, [loadConversations]);

  async function send() {
    if (await sendMessage(text)) setText("");
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;
  const selected = conversations.find((item) => item.id === selectedId);

  return (
    <section className="flex min-h-[calc(100dvh-12rem)] flex-col overflow-hidden lg:h-[calc(100dvh-12rem)] lg:min-h-0">
      {error && <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {!selectedId ? (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {conversations.length ? conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => { setSelectedId(conversation.id); onConversationChange(conversation.id); }}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border p-4 text-left transition hover:bg-secondary"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{conversation.counterpartFirstName} {conversation.counterpartLastName}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {typeLabel(conversation.counterpartType)} · {conversation.lastMessageText || "Нет сообщений"}
                </span>
              </span>
              {conversation.unreadMessagesCount > 0 && (
                <span className="rounded-full bg-destructive px-2 py-1 text-xs text-destructive-foreground">{conversation.unreadMessagesCount}</span>
              )}
            </button>
          )) : <div className="rounded-xl bg-secondary p-5 text-sm text-muted-foreground">Диалогов пока нет.</div>}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-4 flex flex-none items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setSelectedId(null); onConversationChange(null); }}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm transition hover:bg-secondary"
            >
              <ArrowLeft size={15} /> К диалогам
            </button>
            {selected && (
              <div className="min-w-0 text-right">
                <div className="truncate font-medium">{selected.counterpartFirstName} {selected.counterpartLastName}</div>
                <div className="text-xs text-muted-foreground">{typeLabel(selected.counterpartType)}</div>
              </div>
            )}
          </div>

          {(messageError || realtimeError) && (
            <div className="mb-3 flex-none rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {messageError || realtimeError}
            </div>
          )}

          <div className="relative min-h-0 flex-1">
            <div ref={scrollRef} onScroll={handleScroll} className="h-full space-y-3 overflow-y-auto rounded-xl border border-border p-4">
              {isLoadingOlder && <div className="py-2 text-center text-xs text-muted-foreground">Загружаем предыдущие сообщения...</div>}
              {!isInitialLoading && messages.length > 0 && !hasMore && <div className="py-2 text-center text-xs text-muted-foreground">Начало переписки</div>}
              {isInitialLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Загружаем сообщения...</div>
              ) : messages.length ? messages.map((message, index) => {
              const mine = message.senderUserId === currentUserId;
              const showDate = index === 0 || chatDateKey(messages[index - 1].createdAt) !== chatDateKey(message.createdAt);
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="my-4 flex items-center gap-3" role="separator">
                      <span className="h-px flex-1 bg-border" />
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">{formatChatDate(message.createdAt)}</span>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] break-words rounded-2xl px-4 py-3 text-sm sm:max-w-[75%] ${mine ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      <div className="mb-1 text-xs opacity-70">{message.senderFirstName} {message.senderLastName}</div>
                      {message.text}
                      <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] opacity-70">
                        <time dateTime={message.createdAt}>{formatChatTime(message.createdAt)}</time>
                        {mine ? (message.readAt ? <CheckCheck size={13} /> : <Check size={13} />) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
              }) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Сообщений пока нет. Напишите первым.</div>}
            </div>

            {!isNearBottom && (
              <button type="button" onClick={() => scrollToBottom("smooth")} className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs text-primary-foreground shadow-lg transition hover:bg-primary/90">
                <ArrowDown size={15} /> {newMessagesCount > 0 ? `Новые сообщения: ${newMessagesCount}` : "Прокрутить вниз"}
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-none flex-col gap-2 border-t border-border pt-3 sm:flex-row">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Напишите сообщение..."
              className="min-h-12 max-h-32 min-w-0 flex-1 resize-y rounded-xl border border-border bg-input-background p-3 text-foreground"
            />
            <button
              type="button"
              disabled={isSending || !text.trim()}
              onClick={() => void send()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={15} /> {isSending ? "Отправляем..." : "Отправить"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
