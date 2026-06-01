"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUmamiOverview, useUmamiRealtime } from "@/hooks/use-admin-teams";
import { UmamiSessions } from "./admin-umami-sessions";
import type {
  UmamiMetricRow,
  UmamiOverview,
  UmamiRange,
  UmamiTotals,
} from "@/lib/api/admin";

const RANGES: Array<{ key: UmamiRange; label: string }> = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
];

const PAGEVIEWS_COLOR = "#0165b7";
const SESSIONS_COLOR = "#059177";

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("pt-BR");
}

function bounceRate(stats: UmamiTotals): number {
  if (stats.visits === 0) return 0;
  return (stats.bounces / stats.visits) * 100;
}

function formatAxisTime(iso: string, range: UmamiRange): string {
  // Umami returns "YYYY-MM-DD HH:mm:ss" (space). Safari rejects that — normalize to ISO.
  const date = new Date(iso.includes("T") ? iso : iso.replace(" ", "T"));
  if (range === "24h") {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", timeZone: "America/Belem" });
  }
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Belem",
  });
}

function countryFlag(code: string): string {
  if (code.length !== 2) return "";
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + code.toUpperCase().charCodeAt(0) - 65,
    base + code.toUpperCase().charCodeAt(1) - 65,
  );
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  const up = change >= 0;
  return (
    <span
      className={`text-xs font-medium tabular-nums ${up ? "text-secondary-100" : "text-red-600"}`}
    >
      {up ? "↑" : "↓"} {Math.abs(change).toFixed(0)}% vs período anterior
    </span>
  );
}

function StatCard({
  label,
  value,
  current,
  previous,
  hint,
}: {
  label: string;
  value: string;
  current?: number;
  previous?: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-950/10 bg-white px-4 py-5">
      <p className="truncate text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-900">{value}</p>
      {current !== undefined && previous !== undefined ? (
        <p className="mt-1">
          <Delta current={current} previous={previous} />
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-neutral-400">{hint}</p>
      ) : null}
    </div>
  );
}

function RankedList({
  title,
  rows,
  emptyLabel = "Sem dados no período.",
  renderName,
}: {
  title: string;
  rows: UmamiMetricRow[];
  emptyLabel?: string;
  renderName?: (name: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div>
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">{emptyLabel}</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {rows.map((row) => (
              <li key={row.name} className="relative flex items-center gap-3 px-4 py-2.5">
                <div
                  className="absolute inset-y-0 left-0 bg-primary-100/5"
                  style={{ width: `${(row.value / max) * 100}%` }}
                />
                <span className="relative z-10 flex-1 truncate text-sm text-neutral-700">
                  {renderName ? renderName(row.name) : row.name}
                </span>
                <span className="relative z-10 shrink-0 text-sm font-medium tabular-nums text-neutral-900">
                  {formatNumber(row.value)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const FUNNEL_LABELS: Record<string, string> = {
  "solution-viewed": "Viu solução",
  "vote-token-requested": "Pediu código",
  "vote-submitted": "Votou",
};

function VoteFunnel({ steps }: { steps: UmamiOverview["funnel"] }) {
  if (steps.length === 0) return null;
  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-neutral-900">Funil de voto</h2>
      <div className="mt-3 space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
        {steps.map((step, i) => (
          <div key={step.value}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-neutral-700">{FUNNEL_LABELS[step.value] ?? step.value}</span>
              <span className="tabular-nums font-medium text-neutral-900">
                {formatNumber(step.visitors)}
                {i > 0 && step.dropoff > 0 ? (
                  <span className="ml-2 text-xs font-normal text-red-600">
                    ↓ {(step.dropoff * 100).toFixed(0)}%
                  </span>
                ) : null}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-primary-100"
                style={{ width: `${Math.max(2, step.remaining * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const VITAL_THRESHOLDS: Record<string, { good: number; poor: number; unit: "ms" | "score" }> = {
  LCP: { good: 2500, poor: 4000, unit: "ms" },
  INP: { good: 200, poor: 500, unit: "ms" },
  CLS: { good: 0.1, poor: 0.25, unit: "score" },
  FCP: { good: 1800, poor: 3000, unit: "ms" },
  TTFB: { good: 800, poor: 1800, unit: "ms" },
};

function formatVital(value: number, unit: "ms" | "score"): string {
  if (unit === "score") return value.toFixed(3);
  return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;
}

function vitalColor(label: string, value: number): string {
  const t = VITAL_THRESHOLDS[label];
  if (!t || value === 0) return "text-neutral-900";
  if (value <= t.good) return "text-secondary-100";
  if (value >= t.poor) return "text-red-600";
  return "text-amber-600";
}

function WebVitals({ vitals }: { vitals: UmamiOverview["webVitals"] }) {
  if (vitals.count === 0) return null;
  const entries: Array<{ label: string; value: number }> = [
    { label: "LCP", value: vitals.lcp },
    { label: "INP", value: vitals.inp },
    { label: "CLS", value: vitals.cls },
    { label: "FCP", value: vitals.fcp },
    { label: "TTFB", value: vitals.ttfb },
  ];
  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-neutral-900">
        Core Web Vitals <span className="font-normal text-neutral-400">(p75 · {formatNumber(vitals.count)} amostras)</span>
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {entries.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-neutral-950/10 bg-white px-4 py-4">
            <p className="text-xs font-medium text-neutral-500">{label}</p>
            <p className={`mt-1 text-xl font-semibold tabular-nums ${vitalColor(label, value)}`}>
              {formatVital(value, VITAL_THRESHOLDS[label]?.unit ?? "ms")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConversionByTeam({ rows }: { rows: UmamiOverview["conversionByTeam"] }) {
  if (rows.length === 0) return null;
  const maxVotes = Math.max(1, ...rows.map((r) => r.votes));
  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-neutral-900">Conversão por equipe</h2>
      <p className="mt-0.5 text-xs text-neutral-400">Visitas na solução → votos (via eventos).</p>
      <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 border-b border-neutral-100 px-4 py-2 text-[11px] font-medium text-neutral-400">
          <span>Equipe</span>
          <span className="text-right tabular-nums">Views</span>
          <span className="text-right tabular-nums">Votos</span>
          <span className="text-right tabular-nums">Conv.</span>
        </div>
        <ul className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <li key={row.team} className="relative grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-4 py-2.5">
              <div
                className="absolute inset-y-0 left-0 bg-secondary-100/5"
                style={{ width: `${(row.votes / maxVotes) * 100}%` }}
              />
              <span className="relative z-10 truncate text-sm text-neutral-700">{row.team}</span>
              <span className="relative z-10 text-right text-sm tabular-nums text-neutral-500">{formatNumber(row.views)}</span>
              <span className="relative z-10 text-right text-sm font-medium tabular-nums text-neutral-900">{formatNumber(row.votes)}</span>
              <span className="relative z-10 text-right text-sm font-medium tabular-nums text-secondary-100">
                {(row.rate * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Campaigns({ utm }: { utm: UmamiOverview["utm"] }) {
  if (utm.source.length === 0 && utm.medium.length === 0 && utm.campaign.length === 0) return null;
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <RankedList title="UTM source" rows={utm.source} />
      <RankedList title="UTM medium" rows={utm.medium} />
      <RankedList title="UTM campaign" rows={utm.campaign} />
    </div>
  );
}

export function AdminUmami() {
  const [range, setRange] = useState<UmamiRange>("7d");
  const { data, isLoading, isError } = useUmamiOverview(range);
  const { data: realtime } = useUmamiRealtime();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
            Análise Umami
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Tráfego, páginas, origens e eventos · fonte: Umami.
          </p>
        </div>
        {realtime ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary-100/30 bg-secondary-100/5 px-3 py-1.5 text-xs font-medium text-secondary-100">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary-100 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-secondary-100" />
            </span>
            {formatNumber(realtime.online)} online agora
          </span>
        ) : null}
      </div>

      <div className="mt-4 inline-flex rounded-lg border border-neutral-200 bg-white p-0.5">
        {RANGES.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setRange(option.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              range === option.key
                ? "bg-primary-100 text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-200" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-neutral-200" />
        </div>
      ) : isError || !data ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-800">
          Não foi possível carregar os dados do Umami. Verifique se as variáveis{" "}
          <code className="font-mono">UMAMI_API_URL</code>,{" "}
          <code className="font-mono">UMAMI_USERNAME</code>,{" "}
          <code className="font-mono">UMAMI_PASSWORD</code> e{" "}
          <code className="font-mono">UMAMI_WEBSITE_ID</code> estão configuradas no
          servidor.
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Visualizações"
              value={formatNumber(data.stats.pageviews)}
              current={data.stats.pageviews}
              previous={data.stats.comparison?.pageviews}
            />
            <StatCard
              label="Visitantes"
              value={formatNumber(data.stats.visitors)}
              current={data.stats.visitors}
              previous={data.stats.comparison?.visitors}
            />
            <StatCard
              label="Visitas"
              value={formatNumber(data.stats.visits)}
              current={data.stats.visits}
              previous={data.stats.comparison?.visits}
            />
            <StatCard
              label="Taxa de rejeição"
              value={`${bounceRate(data.stats).toFixed(0)}%`}
              hint="Visitas de página única."
            />
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-neutral-900">
              Visualizações e visitas ao longo do tempo
            </h2>
            <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-4">
              {data.series.length === 0 ? (
                <p className="py-12 text-center text-sm text-neutral-500">
                  Sem dados no período.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PAGEVIEWS_COLOR} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={PAGEVIEWS_COLOR} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={SESSIONS_COLOR} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={SESSIONS_COLOR} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="t"
                      tickFormatter={(value: string) => formatAxisTime(value, range)}
                      tick={{ fontSize: 11, fill: "#8d8d8d" }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#8d8d8d" }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      allowDecimals={false}
                    />
                    <Tooltip
                      labelFormatter={(label) => formatAxisTime(String(label), range)}
                      formatter={(value, name) => [
                        formatNumber(Number(value)),
                        String(name) === "pageviews" ? "Visualizações" : "Visitas",
                      ]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e7e7e7", fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pageviews"
                      stroke={PAGEVIEWS_COLOR}
                      strokeWidth={2}
                      fill="url(#pv)"
                    />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke={SESSIONS_COLOR}
                      strokeWidth={2}
                      fill="url(#ss)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <VoteFunnel steps={data.funnel} />

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RankedList title="Páginas mais vistas" rows={data.topPages} />
            <RankedList
              title="Origens de tráfego"
              rows={data.referrers}
              emptyLabel="Apenas tráfego direto no período."
              renderName={(name) => name || "(direto)"}
            />
            <RankedList
              title="Países"
              rows={data.countries}
              renderName={(name) => `${countryFlag(name)} ${name}`.trim()}
            />
            <RankedList title="Cidades" rows={data.cities} />
            <RankedList title="Regiões" rows={data.regions} />
            <RankedList title="Idioma do navegador" rows={data.languages} />
            <RankedList title="Navegadores" rows={data.browsers} />
            <RankedList title="Sistemas operacionais" rows={data.os} />
            <RankedList title="Dispositivos" rows={data.devices} />
          </div>

          <ConversionByTeam rows={data.conversionByTeam} />

          <WebVitals vitals={data.webVitals} />
          <Campaigns utm={data.utm} />

          <div className="mt-8">
            <RankedList
              title="Eventos personalizados"
              rows={data.events}
              emptyLabel="Nenhum evento registrado no período."
            />
          </div>

          <UmamiSessions range={range} />
        </>
      )}
    </div>
  );
}
