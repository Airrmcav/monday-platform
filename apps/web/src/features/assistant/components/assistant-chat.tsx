"use client";

import { Bot, LoaderCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { sendAssistantMessageAction } from "../actions/send-assistant-message-action";
import type { AssistantMessage } from "../schemas/assistant-chat.schema";

const suggestions = [
  "¿Qué tareas tengo pendientes?",
  "¿Qué tareas están bloqueadas o vencidas?",
  "¿Cuáles son mis próximas reuniones?",
];

export default function AssistantChat() {
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function openPanel() {
    setIsOpen(true);
  }

  function closePanel() {
    setIsOpen(false);
  }

  function submitMessage(messageText = draft) {
    const content = messageText.trim();
    if (!content || isPending) return;

    const previousMessages = messages;
    const requestMessages = [
      ...previousMessages.slice(-11),
      { role: "user" as const, content },
    ];
    setError("");
    setDraft("");

    startTransition(async () => {
      const result = await sendAssistantMessageAction(requestMessages);
      if (!result.success) {
        setDraft(content);
        setError(result.error);
        return;
      }
      setMessages([
        ...previousMessages,
        { role: "user", content },
        { role: "assistant", content: result.text },
      ]);
    });
  }

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending, isOpen]);

  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    } else if (wasOpenRef.current) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <div
        id="assistant-chat"
        role="dialog"
        aria-modal="false"
        aria-labelledby="assistant-chat-title"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed bottom-4 right-4 z-50 flex h-[min(36rem,calc(100dvh-2rem))] w-[min(24rem,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface text-foreground shadow-2xl transition duration-200 ease-out motion-reduce:transition-none sm:bottom-6 sm:right-6 ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-95 opacity-0"
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Bot aria-hidden="true" size={20} />
            </span>
            <div className="min-w-0">
              <h2
                id="assistant-chat-title"
                className="text-sm font-semibold leading-tight"
              >
                Asistente MYCAV
              </h2>
              <p className="text-xs text-muted-foreground">
                Consulta tus tareas y reuniones
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar asistente"
            onClick={closePanel}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div
          aria-live="polite"
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        >
          {messages.length === 0 ? (
            <div className="my-auto">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Sparkles aria-hidden="true" size={22} />
              </div>
              <h3 className="text-center text-base font-semibold">
                ¿En qué te puedo ayudar?
              </h3>
              <p className="mx-auto mt-1.5 max-w-xs text-center text-sm leading-6 text-muted-foreground">
                Pregunta sobre el estado de tus tareas, prioridades, bloqueos o
                próximas reuniones.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={isPending}
                    onClick={() => submitMessage(suggestion)}
                    className="cursor-pointer rounded-xl border border-border/70 px-3 py-2.5 text-left text-sm transition hover:border-primary/30 hover:bg-primary-soft/50 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                  message.role === "user"
                    ? "self-end rounded-br-md bg-primary text-white whitespace-pre-wrap"
                    : "self-start rounded-bl-md border border-border/60 bg-surface-muted"
                }`}
              >
                {message.role === "user" ? (
                  message.content
                ) : (
                  <div className="wrap-break-word [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-semibold">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))
          )}

          {isPending && (
            <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-md border border-border/60 bg-surface-muted px-3.5 py-2.5 text-sm text-muted-foreground">
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={16}
              />
              Consultando tus datos…
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border/60 px-3 py-3">
          <p className="mb-2 px-1 text-[11px] leading-4 text-muted-foreground">
            Las consultas envían a Gemini un resumen limitado de tus tareas y
            reuniones. Evita compartir datos sensibles.
          </p>
          {error && (
            <p role="alert" className="mb-2 px-1 text-sm text-danger">
              {error}
            </p>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitMessage();
            }}
            className="flex items-end gap-2 rounded-2xl border border-border bg-surface px-3 py-1.5 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submitMessage();
                }
              }}
              aria-label="Escribe tu pregunta"
              placeholder="Escribe tu pregunta…"
              maxLength={2000}
              rows={1}
              disabled={isPending}
              className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Enviar pregunta"
              disabled={isPending || !draft.trim()}
              className="mb-0.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={17}
                />
              ) : (
                <Send aria-hidden="true" size={17} />
              )}
            </button>
          </form>
        </div>
      </div>
      {!isOpen && (
        <button
          ref={triggerRef}
          type="button"
          aria-label="Abrir asistente MYCAV"
          aria-controls="assistant-chat"
          title="Asistente MYCAV"
          onClick={openPanel}
          className="fixed bottom-4 right-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:bottom-6 sm:right-6"
        >
          <Sparkles aria-hidden="true" size={22} />
        </button>
      )}
    </>
  );
}
