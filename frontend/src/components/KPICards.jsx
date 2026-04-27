import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Package, Wrench, Percent, AlertCircle, Archive } from 'lucide-react'
import { SkeletonKPI } from './ui/Skeleton'

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', stiffness: 300, damping: 22 } },
}

const borderColors = {
  success: '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
  primary: '#4f46e5',
}

function KPICard({ label, subLabel, value, icon: Icon, status, change, changeUnit, penalty }) {
  const border = borderColors[status] || borderColors.primary
  const bg     = { success: 'bg-emerald-50 dark:bg-emerald-900/20', warning: 'bg-amber-50 dark:bg-amber-900/20', danger: 'bg-red-50 dark:bg-red-900/20', primary: 'bg-primary-50 dark:bg-primary-900/20' }[status]
  const text   = { success: 'text-emerald-600 dark:text-emerald-400', warning: 'text-amber-600 dark:text-amber-400', danger: 'text-red-600 dark:text-red-400', primary: 'text-primary-600 dark:text-primary-400' }[status]
  const chg    = parseFloat(change)

  return (
    <motion.div
      variants={item}
      className="relative overflow-hidden rounded-2xl p-5 border"
      style={{
        background:   'var(--bg-card)',
        borderColor:  'var(--border)',
        borderLeft:   `3px solid ${border}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          {subLabel && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{subLabel}</p>}
          <motion.p
            className={`text-xl font-bold mt-1.5 ${text}`}
            key={value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {value}
          </motion.p>
        </div>
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${bg}`}>
          <Icon className={`w-4 h-4 ${text}`} />
        </div>
      </div>

      {/* Change indicator */}
      {change !== null && !isNaN(chg) && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${chg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
          {chg >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(chg).toFixed(1)}{changeUnit} vs mois préc.
        </div>
      )}

      {/* Penalty sub-info */}
      {penalty && (
        <p className="text-xs mt-1.5 font-medium text-red-500 dark:text-red-400">{penalty}</p>
      )}
    </motion.div>
  )
}

export default function KPICards({ results }) {
  const { latest, previous } = useMemo(() => {
    if (!results?.length) return { latest: null, previous: null }
    const live = results.filter(r => !r.isHistorical)
    return {
      latest:   live.length > 0 ? live[live.length - 1]  : results[results.length - 1],
      previous: live.length > 1 ? live[live.length - 2]  : null,
    }
  }, [results])

  if (!latest) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => <SkeletonKPI key={i} />)}
      </div>
    )
  }

  const d  = (curr, prev) => prev != null ? ((curr - prev) / Math.abs(prev || 1) * 100).toFixed(1) : null
  const mh = latest.machine_health ?? 100
  const sf = latest.stock_final  ?? 0
  const sm = latest.stock_mp     ?? 0
  const ts = latest.taux_service ?? 0
  const rt = latest.rupture      ?? 0
  const ss = latest.stock_securite ?? 800

  const kpis = [
    {
      label: 'Taux de Service', value: `${ts.toFixed(1)} %`, icon: Percent,
      status: ts >= 95 ? 'success' : ts >= 80 ? 'warning' : 'danger',
      change: previous ? (ts - previous.taux_service).toFixed(1) : null, changeUnit: 'pts',
    },
    {
      label: 'Profit du mois', value: `${latest.profit >= 0 ? '+' : ''}${latest.profit?.toLocaleString('fr-FR') ?? 0} €`,
      icon: DollarSign,
      status: latest.profit >= 0 ? 'success' : 'danger',
      change: d(latest.profit, previous?.profit), changeUnit: '%',
    },
    {
      label: 'Santé Machine', value: `${mh} %`, icon: Wrench,
      status: mh >= 70 ? 'success' : mh >= 40 ? 'warning' : 'danger',
      change: previous ? (mh - (previous.machine_health ?? 100)).toFixed(1) : null, changeUnit: 'pts',
    },
    {
      label: 'Stock PF', subLabel: `Sécurité: ${ss.toLocaleString('fr-FR')} u`,
      value: `${sf.toLocaleString('fr-FR')} u`, icon: Archive,
      status: sf >= ss ? 'success' : sf > 0 ? 'warning' : 'danger',
      change: d(sf, previous?.stock_final ?? 0), changeUnit: '%',
    },
    {
      label: 'Stock MP', subLabel: 'Matières Premières',
      value: `${sm.toLocaleString('fr-FR')} u`, icon: Package,
      status: sm >= 1500 ? 'success' : sm >= 500 ? 'warning' : 'danger',
      change: d(sm, previous?.stock_mp ?? 0), changeUnit: '%',
    },
    {
      label: 'Rupture ce mois', value: `${rt.toLocaleString('fr-FR')} u`, icon: AlertCircle,
      status: rt === 0 ? 'success' : rt < 300 ? 'warning' : 'danger',
      change: null,
      penalty: rt > 0 ? `Pénalité : −${(rt * 9).toLocaleString('fr-FR')} €` : null,
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-3 gap-4"
    >
      {kpis.map(kpi => <KPICard key={kpi.label} {...kpi} />)}
    </motion.div>
  )
}
