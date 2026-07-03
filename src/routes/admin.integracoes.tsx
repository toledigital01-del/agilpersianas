import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  PlayCircle,
  ExternalLink,
  KeyRound,
  Truck,
  ShieldCheck,
  Copy,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  checkAsaas,
  checkFrenet,
  type AsaasCheckResult,
  type FrenetCheckResult,
} from "@/lib/integrations.functions";
import { useSiteSetting } from "@/hooks/use-site-setting";

export const Route = createFileRoute("/admin/integracoes")({ component: IntegrationsPage });

type LogEntry = { ts: string; level: "info" | "ok" | "warn" | "error"; msg: string };

function IntegrationsPage() {
  const runAsaas = useServerFn(checkAsaas);
  const runFrenet = useServerFn(checkFrenet);

  const [asaas, setAsaas] = useState<AsaasCheckResult | null>(null);
  const [frenet, setFrenet] = useState<FrenetCheckResult | null>(null);
  const [busy, setBusy] = useState<"asaas" | "frenet" | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  function log(level: LogEntry["level"], msg: string) {
    setLogs((l) =>
      [{ ts: new Date().toLocaleTimeString("pt-BR"), level, msg }, ...l].slice(0, 50),
    );
  }

  async function testAsaas() {
    setBusy("asaas");
    log("info", "Iniciando teste de conexão com Asaas (sandbox + produção)...");
    try {
      const r = await runAsaas();
      setAsaas(r);
      if (!r.hasKey) log("error", "ASAAS_API_KEY não configurada");
      else if (!r.detectedEnv) log("error", "Chave inválida nos dois ambientes");
      else if (!r.matches)
        log(
          "warn",
          `ASAAS_ENV="${r.configuredEnv ?? "vazio"}" não bate com a chave (${r.detectedEnv})`,
        );
      else log("ok", `Asaas conectado em ${r.detectedEnv.toUpperCase()}`);
      r.errors.forEach((e) => log("error", e));
      log("info", `Sandbox: ${r.details.sandbox.message} (HTTP ${r.details.sandbox.status})`);
      log(
        "info",
        `Produção: ${r.details.production.message} (HTTP ${r.details.production.status})`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      log("error", `Falha ao testar Asaas: ${msg}`);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  async function testFrenet() {
    setBusy("frenet");
    log("info", "Testando conexão com Frenet...");
    try {
      const r = await runFrenet();
      setFrenet(r);
      if (r.ok) log("ok", `Frenet: ${r.message}`);
      else log("error", `Frenet: ${r.message}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      log("error", `Falha ao testar Frenet: ${msg}`);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  function copy(value: string) {
    navigator.clipboard.writeText(value).then(() => toast.success("Copiado"));
  }

  return (
    <div className="space-y-6 max-w-[1100px]">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Integrações</div>
        <h1 className="font-display text-3xl mt-1">Pagamentos e Frete</h1>
        <p className="text-muted-foreground mt-1">
          Configure e teste as chaves Asaas (PIX/boleto/cartão) e Frenet (cálculo de frete) em um
          só lugar.
        </p>
      </div>

      {/* ========== ASAAS ========== */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl">Asaas — Pagamentos</h2>
              <p className="text-sm text-muted-foreground">
                PIX, boleto e cartão. Detectamos automaticamente se sua chave é sandbox ou
                produção.
              </p>
            </div>
          </div>
          <Button onClick={testAsaas} disabled={busy === "asaas"}>
            {busy === "asaas" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Testar conexão
          </Button>
        </div>

        <StatusPanel asaas={asaas} />

        <div className="mt-6 border-t pt-6">
          <h3 className="font-medium mb-3">Passo a passo para descobrir seus valores</h3>
          <ol className="space-y-3 text-sm">
            <Step n={1}>
              Acesse o painel do Asaas:{" "}
              <a
                className="text-primary underline inline-flex items-center gap-1"
                href="https://www.asaas.com/login"
                target="_blank"
                rel="noreferrer"
              >
                www.asaas.com/login <ExternalLink className="h-3 w-3" />
              </a>{" "}
              (use{" "}
              <a
                className="text-primary underline inline-flex items-center gap-1"
                href="https://sandbox.asaas.com/login"
                target="_blank"
                rel="noreferrer"
              >
                sandbox.asaas.com <ExternalLink className="h-3 w-3" />
              </a>{" "}
              se quiser apenas testar).
            </Step>
            <Step n={2}>
              No menu, clique no seu nome (canto superior direito) →{" "}
              <strong>Integrações</strong> → <strong>Integração via API</strong>.
            </Step>
            <Step n={3}>
              Copie a <strong>Chave de API (access_token)</strong>. Guarde como{" "}
              <code className="px-1.5 py-0.5 rounded bg-muted text-xs">ASAAS_API_KEY</code>.
            </Step>
            <Step n={4}>
              Defina <code className="px-1.5 py-0.5 rounded bg-muted text-xs">ASAAS_ENV</code> com
              um destes valores exatos:
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => copy("sandbox")}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background hover:bg-muted text-xs"
                >
                  <code>sandbox</code> <Copy className="h-3 w-3" />
                </button>
                <span className="text-xs text-muted-foreground self-center">
                  ↳ se a chave veio de <em>sandbox.asaas.com</em>
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => copy("production")}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background hover:bg-muted text-xs"
                >
                  <code>production</code> <Copy className="h-3 w-3" />
                </button>
                <span className="text-xs text-muted-foreground self-center">
                  ↳ se a chave veio de <em>www.asaas.com</em> (cobranças reais)
                </span>
              </div>
            </Step>
            <Step n={5}>
              Não tem certeza qual ambiente usar? Salve qualquer valor e clique em{" "}
              <strong>Testar conexão</strong> acima — o sistema detecta automaticamente e te diz o
              valor correto.
            </Step>
          </ol>
        </div>
      </Card>

      {/* ========== FRENET ========== */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl">Frenet — Cálculo de frete</h2>
              <p className="text-sm text-muted-foreground">
                Cotações em tempo real para a calculadora de frete dos produtos.
              </p>
            </div>
          </div>
          <Button onClick={testFrenet} disabled={busy === "frenet"}>
            {busy === "frenet" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Testar conexão
          </Button>
        </div>

        <FrenetStatus frenet={frenet} />

        <ShippingOriginConfig />

        <div className="mt-6 border-t pt-6">
          <h3 className="font-medium mb-3">Passo a passo</h3>
          <ol className="space-y-3 text-sm">
            <Step n={1}>
              Entre em{" "}
              <a
                className="text-primary underline inline-flex items-center gap-1"
                href="https://painel.frenet.com.br"
                target="_blank"
                rel="noreferrer"
              >
                painel.frenet.com.br <ExternalLink className="h-3 w-3" />
              </a>
              .
            </Step>
            <Step n={2}>
              Vá em <strong>Minha Conta</strong> → <strong>Token API</strong>. Copie o token
              gerado.
            </Step>
            <Step n={3}>
              Salve como{" "}
              <code className="px-1.5 py-0.5 rounded bg-muted text-xs">FRENET_TOKEN</code> nas
              secrets do projeto.
            </Step>
            <Step n={4}>
              Clique em <strong>Testar conexão</strong> para validar.
            </Step>
          </ol>
        </div>
      </Card>

      {/* ========== LOGS ========== */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-xl">Logs detalhados</h2>
            <p className="text-sm text-muted-foreground">
              Histórico dos testes realizados nesta sessão.
            </p>
          </div>
          {logs.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setLogs([])}>
              Limpar
            </Button>
          )}
        </div>
        {logs.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
            Nenhum teste executado ainda. Clique em <strong>Testar conexão</strong> acima.
          </div>
        ) : (
          <div className="font-mono text-xs space-y-1.5 max-h-80 overflow-y-auto">
            {logs.map((l, i) => (
              <div
                key={i}
                className={`flex gap-2 px-3 py-1.5 rounded ${
                  l.level === "error"
                    ? "bg-destructive/10 text-destructive"
                    : l.level === "warn"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : l.level === "ok"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted/50"
                }`}
              >
                <span className="opacity-60 shrink-0">{l.ts}</span>
                <span className="uppercase font-bold shrink-0 w-12">{l.level}</span>
                <span className="break-all">{l.msg}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </div>
      <div className="flex-1 pt-0.5">{children}</div>
    </li>
  );
}

function StatusPanel({ asaas }: { asaas: AsaasCheckResult | null }) {
  if (!asaas) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-muted/40 text-sm text-muted-foreground flex items-center gap-2">
        <KeyRound className="h-4 w-4" />
        Clique em <strong>Testar conexão</strong> para verificar o status atual.
      </div>
    );
  }

  const ok = asaas.matches === true;
  const warn = asaas.matches === false && !!asaas.detectedEnv;
  const error = !asaas.detectedEnv;

  return (
    <div className="mt-4 space-y-3">
      <div
        className={`p-4 rounded-lg border-2 ${
          ok
            ? "border-emerald-500/40 bg-emerald-500/5"
            : warn
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-destructive/40 bg-destructive/5"
        }`}
      >
        <div className="flex items-start gap-3">
          {ok ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          ) : warn ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <div className="font-medium">{asaas.recommendation}</div>
            {asaas.account?.name && (
              <div className="text-xs text-muted-foreground mt-1">
                Conta: <strong>{asaas.account.name}</strong>
                {asaas.account.email && <> · {asaas.account.email}</>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <EnvCard
          label="ASAAS_ENV configurado"
          value={asaas.configuredEnv ?? "(vazio)"}
          variant={asaas.configuredEnv ? "info" : "warn"}
        />
        <EnvCard
          label="Detectado pela chave"
          value={asaas.detectedEnv ?? "—"}
          variant={asaas.detectedEnv ? "ok" : "error"}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <EndpointStatus name="Sandbox" detail={asaas.details.sandbox} />
        <EndpointStatus name="Produção" detail={asaas.details.production} />
      </div>
    </div>
  );
}

function FrenetStatus({ frenet }: { frenet: FrenetCheckResult | null }) {
  if (!frenet) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-muted/40 text-sm text-muted-foreground flex items-center gap-2">
        <KeyRound className="h-4 w-4" />
        Clique em <strong>Testar conexão</strong> para verificar.
      </div>
    );
  }
  return (
    <div
      className={`mt-4 p-4 rounded-lg border-2 ${
        frenet.ok
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-destructive/40 bg-destructive/5"
      }`}
    >
      <div className="flex items-start gap-3">
        {frenet.ok ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive mt-0.5" />
        )}
        <div>
          <div className="font-medium">{frenet.message}</div>
          <div className="text-xs text-muted-foreground mt-1">{frenet.recommendation}</div>
        </div>
      </div>
    </div>
  );
}

function EnvCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "ok" | "warn" | "error" | "info";
}) {
  const styles = {
    ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    error: "bg-destructive/10 text-destructive border-destructive/30",
    info: "bg-muted text-foreground border-border",
  }[variant];
  return (
    <div className={`p-3 rounded-lg border ${styles}`}>
      <div className="text-xs uppercase tracking-wider opacity-70">{label}</div>
      <div className="font-mono text-sm font-semibold mt-1">{value}</div>
    </div>
  );
}

function EndpointStatus({
  name,
  detail,
}: {
  name: string;
  detail: { status: number; message: string };
}) {
  const ok = detail.status === 200;
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{name}</span>
        <Badge variant={ok ? "default" : "secondary"} className="text-[10px]">
          HTTP {detail.status || "—"}
        </Badge>
      </div>
      <div className="text-sm mt-1">{detail.message}</div>
    </div>
  );
}

function ShippingOriginConfig() {
  const { value, setValue, save, loading, saving } = useSiteSetting<{ origin_cep: string }>(
    "shipping",
    { origin_cep: "36080220" },
  );

  const maskCep = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="font-medium mb-1">CEP de origem (remetente)</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Endereço de onde os pedidos são despachados. Usado como <code>SellerCEP</code> nas cotações
        Frenet.
      </p>
      <div className="flex gap-2 items-end max-w-md">
        <div className="flex-1">
          <Label htmlFor="origin-cep" className="text-xs text-muted-foreground">
            CEP de origem
          </Label>
          <Input
            id="origin-cep"
            value={maskCep(value.origin_cep ?? "")}
            onChange={(e) => setValue({ ...value, origin_cep: e.target.value.replace(/\D/g, "") })}
            placeholder="00000-000"
            inputMode="numeric"
            disabled={loading}
            className="mt-1"
          />
        </div>
        <Button
          onClick={async () => {
            const digits = (value.origin_cep ?? "").replace(/\D/g, "");
            if (digits.length !== 8) {
              toast.error("Informe um CEP válido (8 dígitos)");
              return;
            }
            await save({ origin_cep: digits });
          }}
          disabled={loading || saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>
    </div>
  );
}