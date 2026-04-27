import { useMemo } from 'react'
import {
  ComposedChart, LineChart, BarChart, AreaChart,
  Line, Bar, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const COLORS = {
  ca:         '#3b82f6',
  profit:     '#10b981',
  costs:      '#ef4444',
  service:    '#8b5cf6',
  demand:     '#3b82f6',
  ventes:     '#10b981',
  rupture:    '#ef4444',
  stockFG:    '#3b82f6',
  stockMP:    '#f59e0b',
  securite:   '#ef4444',
  health:     '#8b5cf6',
}

const fmtEur  = (v) => `${Number(v).toLocaleString('fr-FR')} €`
const fmtPct  = (v) => `${Number(v).toFixed(1)} %`
const fmtUnit = (v) => `${Number(v).toLocaleString('fr-FR')} u`

// ─── 1. Monthly Financial Chart (dual Y-axis: € + service %) ─────────────────
export function MonthlyChart({ results }) {
  const data = useMemo(() => results.map(r => ({
    mois:    r.isHistorical ? r.label : `M${r.month}`,
    ca:      r.chiffre_affaires,
    profit:  r.profit,
    couts:   r.cout_total,
    service: r.taux_service,
    hist:    !!r.isHistorical,
  })), [results])

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Évolution Financière + Taux de Service</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="mois" stroke="#6b7280" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="eur" stroke="#6b7280" tickFormatter={v => `${(v/1000).toFixed(0)}k€`} />
          <YAxis yAxisId="pct" orientation="right" domain={[0,100]} stroke="#8b5cf6" tickFormatter={v=>`${v}%`} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
            formatter={(value, name) => {
              if (name === 'Service (%)') return [fmtPct(value), name]
              return [fmtEur(value), name]
            }}
          />
          <Legend />
          <Line yAxisId="eur" type="monotone" dataKey="ca"     name="CA"           stroke={COLORS.ca}     strokeWidth={2} dot={false} />
          <Line yAxisId="eur" type="monotone" dataKey="profit" name="Profit"        stroke={COLORS.profit} strokeWidth={2} dot={false} />
          <Line yAxisId="eur" type="monotone" dataKey="couts"  name="Coûts totaux" stroke={COLORS.costs}  strokeWidth={2} dot={false} />
          <Line yAxisId="pct" type="monotone" dataKey="service" name="Service (%)" stroke={COLORS.service} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
          <ReferenceLine yAxisId="pct" y={95} stroke="#8b5cf6" strokeDasharray="3 3" label={{ value: '95%', position: 'right', fontSize: 10, fill: '#8b5cf6' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── 2. Cost Breakdown — % Table (replaces pie chart) ────────────────────────
export function CostBreakdown({ results }) {
  const items = useMemo(() => {
    if (!results.length) return []
    const r = results.filter(x => !x.isHistorical).slice(-1)[0]
    if (!r) return []
    const rows = [
      { label: 'Matières Premières', value: r.cout_matieres   ?? 0, color: '#3b82f6' },
      { label: 'Production',         value: r.cout_production ?? 0, color: '#10b981' },
      { label: 'Maintenance',        value: r.cout_maintenance ?? 0, color: '#f59e0b' },
      { label: 'Stockage',           value: r.cout_stockage   ?? 0, color: '#8b5cf6' },
      { label: 'Transport',          value: (r.cout_total - (r.cout_matieres??0) - (r.cout_production??0) - (r.cout_maintenance??0) - (r.cout_stockage??0) - (r.cout_rupture??0) - (r.cout_marketing??0)), color: '#06b6d4' },
      { label: 'Rupture (pénalité)',  value: r.cout_rupture   ?? 0, color: '#ef4444' },
      { label: 'Marketing',          value: r.cout_marketing  ?? 0, color: '#ec4899' },
    ].filter(x => x.value > 0)
    const total = rows.reduce((s, x) => s + x.value, 0)
    return rows.map(x => ({ ...x, pct: total > 0 ? (x.value / total) * 100 : 0 }))
  }, [results])

  const total = items.reduce((s, x) => s + x.value, 0)

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Répartition des Coûts — Dernier mois</h3>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                <span className="font-medium">{item.label}</span>
                <span>{item.value.toLocaleString('fr-FR')} € <span className="font-bold" style={{color: item.color}}>({item.pct.toFixed(1)}%)</span></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-800">
            <span>Total</span>
            <span>{total.toLocaleString('fr-FR')} €</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 3. Demand Fluctuation Chart (6 intra-month ticks per month) ─────────────
export function DemandFluctuationChart({ results }) {
  const data = useMemo(() => {
    const points = []
    results.forEach(r => {
      const label = r.isHistorical ? r.label : `M${r.month}`
      const monthTotal = r.demande_reelle  // full monthly demand — shown as reference
      if (r.demandTicks && r.demandTicks.length) {
        r.demandTicks.forEach((d, t) => {
          const stockAtTick = r.stockPFTicks?.[t] ?? r.stock_final
          points.push({
            mois:         `${label}.${t + 1}`,
            demande:      d,                              // sub-period demand
            ventes:       Math.min(d, stockAtTick + d),  // sub-period sales
            rupture:      Math.max(0, d - stockAtTick),  // sub-period rupture
            demandeTotal: monthTotal,               // full monthly demand as flat reference
            isTick:       true,
          })
        })
      } else {
        points.push({ mois: label, demande: r.demande_reelle, ventes: r.ventes, rupture: r.rupture ?? 0, demandeTotal: r.demande_reelle, isTick: false })
      }
    })
    return points
  }, [results])

  const tickFormatter = (v) => v.endsWith('.1') || !v.includes('.') ? v.replace('.1', '') : ''

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-1">Fluctuation de la Demande (6 points/mois)</h3>
      <p className="text-xs text-gray-400 mb-4">Chaque mois décomposé en 6 périodes — <span className="text-purple-500 font-medium">ligne violette pointillée = demande mensuelle totale</span> — zone rouge = ruptures</p>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="mois" stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={tickFormatter} />
          <YAxis stroke="#6b7280" tickFormatter={fmtUnit} width={70} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
            formatter={(value, name) => [fmtUnit(value), name]}
          />
          <Legend />
          <Bar  dataKey="rupture"      name="Rupture"                    fill={COLORS.rupture}  opacity={0.55} />
          <Line type="monotone" dataKey="demande"      name="Demande / période"    stroke={COLORS.demand}  strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ventes"       name="Ventes / période"     stroke={COLORS.ventes}  strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="demandeTotal" name="Demande mensuelle totale" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6 3" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}


// ─── 4. Stock Evolution Chart (6 intra-month ticks per month) ──────────────
export function StockEvolutionChart({ results }) {
  const data = useMemo(() => {
    const points = []
    results.forEach(r => {
      const label = r.isHistorical ? r.label : `M${r.month}`
      if (r.stockPFTicks && r.stockPFTicks.length) {
        r.stockPFTicks.forEach((pf, t) => {
          points.push({
            mois:    `${label}.${t + 1}`,
            stockFG: pf,
            stockMP: r.stockMPTicks?.[t] ?? r.stock_mp,
            securite: r.stock_securite,
          })
        })
      } else {
        points.push({ mois: label, stockFG: r.stock_final ?? 0, stockMP: r.stock_mp ?? 0, securite: r.stock_securite ?? 800 })
      }
    })
    return points
  }, [results])

  const tickFormatter = (v) => v.endsWith('.1') || !v.includes('.') ? v.replace('.1', '') : ''

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-1">Évolution des Stocks (6 points/mois)</h3>
      <p className="text-xs text-gray-400 mb-4">Fluctuation intra-mensuelle — ligne rouge pointillée = stock de sécurité</p>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="mois" stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={tickFormatter} />
          <YAxis stroke="#6b7280" tickFormatter={fmtUnit} width={70} />
          <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v, name) => [fmtUnit(v), name]} />
          <Legend />
          <Area type="monotone" dataKey="stockFG"  name="Stock PF"         stroke={COLORS.stockFG}  fill={COLORS.stockFG}  fillOpacity={0.2} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="stockMP"  name="Stock MP"         stroke={COLORS.stockMP}  strokeWidth={2} dot={false} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="securite" name="Stock sécurité" stroke={COLORS.securite} strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── 5. Machine Health Chart ─────────────────────────────────────────────────
export function MachineHealthChart({ results }) {
  const data = useMemo(() => results.map(r => ({
    mois:   r.isHistorical ? r.label : `M${r.month}`,
    health: r.machine_health ?? 100,
    panne:  r.breakdownOccurred ? 100 : null,
  })), [results])

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-1">Santé Machine</h3>
      <p className="text-xs text-gray-400 mb-4">Les barres rouges indiquent un mois avec panne.</p>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="mois" stroke="#6b7280" tick={{ fontSize: 11 }} />
          <YAxis domain={[0,100]} stroke="#6b7280" tickFormatter={v=>`${v}%`} />
          <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v, name) => [`${v}%`, name]} />
          <Legend />
          <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Critique', fontSize: 10, fill: '#f59e0b', position: 'insideTopRight' }} />
          <Bar  dataKey="panne"  name="Panne"          fill="#fca5a5" fillOpacity={0.5} radius={[3,3,0,0]} />
          <Line dataKey="health" name="Santé (%)"      stroke={COLORS.health} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
