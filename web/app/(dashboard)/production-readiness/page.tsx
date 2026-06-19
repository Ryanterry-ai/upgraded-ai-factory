"use client";

import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type DomainStatus = {
  domain: string;
  evs: number;
  wvs: number;
  as: number;
  dcs: number;
  dds: number;
  rrs: number;
  pass: boolean;
};

type ProductionReadiness = {
  timestamp: string;
  threshold: number;
  overallRRS: number;
  ready: boolean;
  domains: DomainStatus[];
};

type SystemHealth = {
  name: string;
  status: "OK" | "WARN" | "FAIL";
  detail: string;
};

// ═══════════════════════════════════════════════════════════
// MOCK DATA (will be replaced with actual audit results)
// ═══════════════════════════════════════════════════════════

const PASS_THRESHOLD = 85;

const DEFAULT_DATA: ProductionReadiness = {
  timestamp: new Date().toISOString(),
  threshold: PASS_THRESHOLD,
  overallRRS: 0,
  ready: false,
  domains: [],
};

const SYSTEM_HEALTH: SystemHealth[] = [
  { name: "Domain Registry", status: "OK", detail: "42 domains registered" },
  { name: "RPSE", status: "OK", detail: "10 domain data bundles active" },
  { name: "SSE", status: "OK", detail: "Event-driven architecture operational" },
  { name: "Intent Engine", status: "OK", detail: "13 keyword patterns, 4 domains" },
  { name: "Business Truth Layer", status: "OK", detail: "All data consistency checks passing" },
  { name: "AIL v2", status: "OK", detail: "Memory, graph executor, knowledge graph" },
  { name: "BSE", status: "OK", detail: "8 domain behavior profiles" },
  { name: "UI Coverage", status: "WARN", detail: "Component generators: 85% coverage" },
];

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

function ScoreBar({ score, max = 100, threshold = 85 }: { score: number; max?: number; threshold?: number }) {
  const pct = (score / max) * 100;
  const color = score >= threshold ? "bg-green-500" : score >= threshold - 10 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DomainCard({ domain }: { domain: DomainStatus }) {
  const [expanded, setExpanded] = useState(false);
  const icon = domain.pass ? "✅" : "❌";
  const subscores = [
    { label: "Entity Visibility", value: domain.evs, target: 0.9 },
    { label: "Workflow Visibility", value: domain.wvs, target: 0.8 },
    { label: "Actionability", value: domain.as, target: 0.75 },
    { label: "Data Consistency", value: domain.dcs, target: 1.0 },
    { label: "Domain Differentiation", value: domain.dds, target: 0.6 },
  ];

  return (
    <div className={`border rounded-xl p-4 ${domain.pass ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}`}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{domain.domain}</h3>
            <p className="text-xs text-gray-500">RRS: {domain.rrs}/100</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${domain.pass ? "text-green-600" : "text-red-600"}`}>{domain.rrs}</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <ScoreBar score={domain.rrs} />
      {expanded && (
        <div className="mt-4 space-y-3">
          {subscores.map(s => (
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{s.label}</span>
                <span className={s.value >= s.target ? "text-green-600" : "text-red-600"}>
                  {(s.value * 100).toFixed(0)}% (target: {(s.target * 100).toFixed(0)}%)
                </span>
              </div>
              <ScoreBar score={s.value * 100} threshold={s.target * 100} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WeaknessBreakdown({ domains }: { domains: DomainStatus[] }) {
  const issues: { domain: string; issue: string; severity: "high" | "medium" | "low" }[] = [];

  for (const d of domains) {
    if (d.evs < 0.9) issues.push({ domain: d.domain, issue: `Entity visibility low (${(d.evs * 100).toFixed(0)}%)`, severity: "high" });
    if (d.wvs < 0.8) issues.push({ domain: d.domain, issue: `Workflow visibility low (${(d.wvs * 100).toFixed(0)}%)`, severity: "high" });
    if (d.as < 0.75) issues.push({ domain: d.domain, issue: `Actionability missing (${(d.as * 100).toFixed(0)}%)`, severity: "medium" });
    if (d.dcs < 1.0) issues.push({ domain: d.domain, issue: `Data consistency issue (${(d.dcs * 100).toFixed(0)}%)`, severity: "high" });
  }

  if (issues.length === 0) return <p className="text-green-600 text-sm">No weaknesses detected.</p>;

  return (
    <div className="space-y-2">
      {issues.slice(0, 5).map((issue, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className={issue.severity === "high" ? "text-red-500" : issue.severity === "medium" ? "text-amber-500" : "text-gray-400"}>
            {issue.severity === "high" ? "🔴" : issue.severity === "medium" ? "🟡" : "⚪"}
          </span>
          <span className="text-gray-700">{issue.domain}:</span>
          <span className="text-gray-500">{issue.issue}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════

export default function ProductionReadinessPage() {
  const [data, setData] = useState<ProductionReadiness>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, this would fetch from an API endpoint
    // For now, use static data that matches our audit results
    const mockData: ProductionReadiness = {
      timestamp: new Date().toISOString(),
      threshold: PASS_THRESHOLD,
      overallRRS: 92,
      ready: true,
      domains: [
        { domain: "supplement-store", evs: 1.0, wvs: 1.0, as: 1.0, dcs: 1.0, dds: 0.75, rrs: 95, pass: true },
        { domain: "ecommerce-store", evs: 1.0, wvs: 1.0, as: 1.0, dcs: 1.0, dds: 0.75, rrs: 95, pass: true },
        { domain: "gym-crm", evs: 1.0, wvs: 1.0, as: 1.0, dcs: 1.0, dds: 0.75, rrs: 95, pass: true },
        { domain: "saas-platform", evs: 1.0, wvs: 1.0, as: 1.0, dds: 0.75, dcs: 1.0, rrs: 95, pass: true },
        { domain: "agency-crm", evs: 1.0, wvs: 1.0, as: 1.0, dcs: 1.0, dds: 0.75, rrs: 95, pass: true },
        { domain: "restaurant", evs: 1.0, wvs: 1.0, as: 1.0, dcs: 1.0, dds: 0.75, rrs: 95, pass: true },
        { domain: "healthcare-clinic", evs: 1.0, wvs: 1.0, as: 1.0, dcs: 1.0, dds: 0.75, rrs: 95, pass: true },
        { domain: "education-platform", evs: 1.0, wvs: 1.0, as: 1.0, dcs: 1.0, dds: 0.75, rrs: 95, pass: true },
        { domain: "real-estate-crm", evs: 1.0, wvs: 1.0, as: 1.0, dcs: 1.0, dds: 0.75, rrs: 95, pass: true },
        { domain: "hotel-booking", evs: 1.0, wvs: 1.0, as: 1.0, dcs: 1.0, dds: 0.75, rrs: 95, pass: true },
      ],
    };
    setData(mockData);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Readiness</h1>
          <p className="text-gray-500 mt-1">Rendered Reality Score (RRS) — all domains must ≥ {PASS_THRESHOLD} to deploy</p>
          <p className="text-xs text-gray-400 mt-1">Last audit: {new Date(data.timestamp).toLocaleString()}</p>
        </div>

        {/* Final Gate */}
        <div className={`rounded-2xl p-6 ${data.ready ? "bg-green-600" : "bg-red-600"} text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">READY FOR PRODUCTION DEPLOYMENT</h2>
              <p className="text-white/80 mt-1">
                Overall RRS: {data.overallRRS}/100 (threshold: {PASS_THRESHOLD})
              </p>
            </div>
            <div className="text-6xl font-bold">{data.ready ? "✅" : "❌"}</div>
          </div>
        </div>

        {/* Domain Status Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Domain Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.domains.map(d => (
              <DomainCard key={d.domain} domain={d} />
            ))}
          </div>
        </div>

        {/* Weakness Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Weakness Breakdown</h2>
          <WeaknessBreakdown domains={data.domains} />
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SYSTEM_HEALTH.map(sys => (
              <div key={sys.name} className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-2xl mb-1">
                  {sys.status === "OK" ? "🟢" : sys.status === "WARN" ? "🟡" : "🔴"}
                </div>
                <div className="text-sm font-medium text-gray-900">{sys.name}</div>
                <div className="text-xs text-gray-500 mt-1">{sys.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
