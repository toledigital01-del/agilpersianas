import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, RotateCcw, Wrench, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/ia")({
  component: AdminAIChat,
});

type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
type Message = {
  role: "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
};

const STORAGE_KEY = "agil-admin-ai-conv-v1";
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`;

const SUGGESTIONS = [
  "Liste os 5 últimos leads",
  "Quais são os produtos inativos?",
  "Resumo das métricas do mês",
  "Reescreve a descrição do produto cortina-rolo-blackout em tom premium",
];

function loadConv(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function AdminAIChat() {
  const [messages, setMessages] = useState<Message[]>(() => loadConv());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    const userMsg: Message = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { toast.error("Faça login novamente."); setBusy(false); return; }
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ messages: next.map(stripUI) }),
      });
      const j = await res.json();
      if (!res.ok) { toast.error(j?.error ?? "Erro na IA"); setBusy(false); return; }
      setMessages([...next, ...(j.messages ?? [])]);
    } catch (e) {
      toast.error("Falha de rede: " + (e instanceof Error ? e.message : ""));
    } finally { setBusy(false); setTimeout(() => inputRef.current?.focus(), 50); }
  }

  function reset() {
    if (!confirm("Limpar toda a conversa?")) return;
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-9rem)] flex flex-col">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> AGIL Admin AI
          </h1>
          <p className="text-sm text-muted-foreground">Assistente operacional. Pode editar produtos, conteúdo do site e consultar dados — com sua confirmação.</p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-4 w-4" /> Nova conversa</Button>
      </header>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10 space-y-4">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center"><Sparkles className="h-7 w-7 text-white" /></div>
              <div>
                <p className="font-display text-lg">Como posso ajudar?</p>
                <p className="text-sm text-muted-foreground">Peça para listar dados, alterar produtos ou ajustar o site.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-left text-sm rounded-lg border bg-muted/30 hover:bg-muted px-3 py-2 transition">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => <MessageBubble key={i} m={m} />)}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Pensando…</div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="border-t p-3 flex gap-2 bg-card"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Peça algo… (ex: 'Mostre os pedidos pagos do mês')"
            rows={1}
            disabled={busy}
            className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
          />
          <Button type="submit" disabled={busy || !input.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function stripUI(m: Message): Message {
  // Backend expects standard chat fields only
  if (m.role === "assistant") return { role: "assistant", content: m.content, tool_calls: m.tool_calls };
  if (m.role === "tool") return { role: "tool", content: m.content, tool_call_id: m.tool_call_id, name: m.name };
  return { role: m.role, content: m.content };
}

function MessageBubble({ m }: { m: Message }) {
  if (m.role === "tool") {
    let parsed: any = null;
    try { parsed = JSON.parse(m.content ?? "null"); } catch { /* ignore */ }
    const needsConfirm = parsed && typeof parsed === "object" && parsed.requires_confirmation;
    return (
      <div className="ml-8 text-xs">
        <div className="inline-flex items-center gap-1.5 text-muted-foreground"><Wrench className="h-3 w-3" /> {m.name}</div>
        {needsConfirm ? (
          <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 text-amber-900 dark:text-amber-200 max-w-xl">
            <div className="font-medium text-xs mb-1">⏳ Aguardando sua confirmação</div>
            <pre className="text-[11px] whitespace-pre-wrap font-mono opacity-80 max-h-40 overflow-auto">{JSON.stringify(parsed.preview ?? parsed, null, 2)}</pre>
          </div>
        ) : (
          <details className="mt-1 max-w-xl">
            <summary className="text-muted-foreground cursor-pointer hover:text-foreground">resultado</summary>
            <pre className="mt-1 rounded-md bg-muted/50 p-2 text-[11px] whitespace-pre-wrap font-mono max-h-40 overflow-auto">{m.content}</pre>
          </details>
        )}
      </div>
    );
  }

  const isUser = m.role === "user";
  const hasContent = m.content && m.content.trim().length > 0;
  if (!hasContent && m.role === "assistant" && m.tool_calls?.length) {
    return (
      <div className="text-xs text-muted-foreground ml-1">
        <Wrench className="inline h-3 w-3 mr-1" /> chamando {m.tool_calls.map((t) => t.function.name).join(", ")}…
      </div>
    );
  }
  if (!hasContent) return null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        {m.content}
      </div>
    </div>
  );
}