import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { simulationAPI } from '../services/api'
import { useSimStore } from '../store/useSimStore'
import KPICards from '../components/KPICards'
import {
  MonthlyChart, CostBreakdown, DemandFluctuationChart,
  StockEvolutionChart, MachineHealthChart,
} from '../components/Charts'
import DecisionControls from '../components/DecisionControls'
import GuidePanel from '../components/GuidePanel'
import Button from '../components/ui/Button'
import {
  AlertTriangle, CheckCircle, ArrowRight, BarChart3,
  Loader2, BookOpen, ChevronDown, ChevronUp, History,
  LineChart, Sliders,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Penalty Panel ────────────────────────────────────────────────────────────
function PenaltyPanel({ result }) {
  if (!result?.penaltyDetails) return null
  const { rupture, breakdown, maintenanceOverrun } = result.penaltyDetails
  const hasPenalties = rupture.total > 0 || breakdown.occurred || maintenanceOverrun.delta > 0
  if (!hasPenalties) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="rounded-xl border-l-4 border-red-400 p-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <h4 className="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4" /> Pénalités — Mois {result.month}
      </h4>
      <div className="space-y-2 text-sm">
        {rupture.total > 0 && (
          <div className="flex justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">❌ Rupture</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {rupture.units.toLocaleString('fr-FR')} u × {rupture.costPerUnit} €/u
              </p>
            </div>
            <span className="font-bold text-red-600 dark:text-red-400">−{rupture.total.toLocaleString('fr-FR')} €</span>
          </div>
        )}
        {breakdown.occurred && (
          <div className="flex justify-between p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">🔧 Panne machine</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Capacité perdue : {Math.round(breakdown.capacityLost * 100)}% → {breakdown.productionLost.toLocaleString()} u perdues
              </p>
            </div>
            <span className="font-bold text-amber-600 dark:text-amber-400">⚠️</span>
          </div>
        )}
        {maintenanceOverrun.delta > 0 && (
          <div className="flex justify-between p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <div>
              <p className="font-medium text-orange-700 dark:text-orange-400">💸 Dépassement maintenance</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Prévu {maintenanceOverrun.budgeted.toLocaleString('fr-FR')} € → Réel {maintenanceOverrun.actual.toLocaleString('fr-FR')} €
              </p>
            </div>
            <span className="font-bold text-orange-600 dark:text-orange-400">−{maintenanceOverrun.delta.toLocaleString('fr-FR')} €</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Historical Context ───────────────────────────────────────────────────────
function HistoricalContext({ data }) {
  const [open, setOpen] = useState(true)
  if (!data?.length) return null
  return (
    <div className="card">
      <button className="w-full flex items-center justify-between" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary-500" />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Contexte de Départ — 3 mois précédents
          </span>
          <span className="badge badge-neutral">Hérité</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
               : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    {['Mois','Demande','Ventes','Rupture','Profit','Stock PF','Stock MP','Service','Machine','Événement'].map(h => (
                      <th key={h} className="py-2 px-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="py-2 px-2 font-semibold" style={{ color: 'var(--text-primary)' }}>{r.label}</td>
                      <td className="py-2 px-2" style={{ color: 'var(--text-secondary)' }}>{r.demande_reelle?.toLocaleString('fr-FR')}</td>
                      <td className="py-2 px-2" style={{ color: 'var(--text-secondary)' }}>{r.ventes?.toLocaleString('fr-FR')}</td>
                      <td className={`py-2 px-2 font-medium ${r.rupture > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {r.rupture > 0 ? r.rupture.toLocaleString('fr-FR') : '0'}
                      </td>
                      <td className={`py-2 px-2 font-medium ${r.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {r.profit >= 0 ? '+' : ''}{r.profit?.toLocaleString('fr-FR')} €
                      </td>
                      <td className="py-2 px-2" style={{ color: 'var(--text-secondary)' }}>{r.stock_final?.toLocaleString('fr-FR')}</td>
                      <td className="py-2 px-2" style={{ color: 'var(--text-secondary)' }}>{r.stock_mp?.toLocaleString('fr-FR')}</td>
                      <td className={`py-2 px-2 font-medium ${r.taux_service >= 95 ? 'text-emerald-500' : r.taux_service >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                        {r.taux_service?.toFixed(1)}%
                      </td>
                      <td className={`py-2 px-2 ${r.machine_health >= 70 ? 'text-emerald-500' : r.machine_health >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {r.machine_health}% {r.breakdownOccurred && '⚠️'}
                      </td>
                      <td className="py-2 px-2 max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>{r.evenement ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs italic" style={{ color: 'var(--text-muted)' }}>
                💡 Machine héritée à {data[data.length - 1]?.machine_health}% — Stock PF : {data[data.length - 1]?.stock_final?.toLocaleString('fr-FR')} u
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ChartsSection({ allData }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <MonthlyChart results={allData} />
      <CostBreakdown results={allData} />
      <DemandFluctuationChart results={allData} />
      <StockEvolutionChart results={allData} />
      <div className="xl:col-span-2">
        <MachineHealthChart results={allData} />
      </div>
    </div>
  )
}



export default function Simulation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [guideOpen,   setGuideOpen]   = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [submitting,  setSubmitting]  = useState(false)

  const {
    simulation, results, historicalData, lastResult,
    setAllData, appendResult, updateMonth, markCompleted,
  } = useSimStore()

  useEffect(() => {
    simulationAPI.get(id)
      .then(({ data }) => setAllData({
        simulation:        data,
        results:           data.results           ?? [],
        historicalContext: data.historicalContext ?? [],
      }))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setPageLoading(false))
  }, [id])

  const handleSubmit = useCallback(async (decisions) => {
    setSubmitting(true)
    try {
      const { data } = await simulationAPI.submitDecisions(id, decisions)
      appendResult(data.results)
      updateMonth(data.nextMonth)

      if (data.isLastMonth) {
        markCompleted()
        toast.success('🎉 Simulation terminée !')
        setTimeout(() => navigate(`/results/${id}`), 2000)
      } else {
        const icon = data.results.breakdownOccurred ? '🔧' : data.results.rupture > 0 ? '⚠️' : '✅'
        toast.success(`${icon} Mois ${data.month} terminé`)
      }
    } catch (err) {
      toast.error(err?.message || 'Erreur lors de la simulation')
    } finally {
      setSubmitting(false)
    }
  }, [id])

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Chargement de la simulation…</p>
      </div>
    )
  }
  if (!simulation) {
    return (
      <div className="card text-center py-14 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Simulation non trouvée</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Cette simulation n'existe pas ou a été effacée. Retournez au Dashboard.
          </p>
        </div>
        <Button onClick={() => navigate('/')}>← Retour au Dashboard</Button>
      </div>
    )
  }

  const allData = [...historicalData, ...results]
  const pct = Math.round(((simulation.current_month - 1) / simulation.total_months) * 100)

  return (
    <>
      <GuidePanel isOpen={guideOpen} onClose={() => setGuideOpen(false)} />

      {/* ── Progress Header (full width) ──────────────────────────── */}
      <div className="mb-6 card-flat flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {simulation.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
              <motion.div
                className="h-full bg-primary-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
              Mois {simulation.current_month}/{simulation.total_months} · {pct}%
            </span>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setGuideOpen(true)}>
          <BookOpen className="w-3.5 h-3.5" /> Guide
        </Button>
      </div>

      {/* ── Vertical layout: Analysis on top, Decisions below ──── */}
      <div className="space-y-6">

        {/* ── ANALYSIS (full width) ────────────────────────────── */}
        <motion.div
          className="space-y-5"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-primary-500" />
            <span className="section-label">Analyse</span>
          </div>

          {lastResult?.evenement && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 p-4 rounded-xl border-l-4 border-amber-400"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-amber-700 dark:text-amber-400">
                  Résultat mois {lastResult.month}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {lastResult.evenement.replace(' | ', ' — ')}
                </p>
              </div>
            </motion.div>
          )}

          <PenaltyPanel result={lastResult} />
          <KPICards results={allData} />
          <HistoricalContext data={historicalData} />

          {results.length > 0 ? (
            <ChartsSection allData={allData} />
          ) : (
            <div className="card text-center py-10" style={{ color: 'var(--text-muted)' }}>
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Les graphiques apparaîtront après votre première décision</p>
            </div>
          )}
        </motion.div>

        {/* ── DECISIONS (full width, below) ────────────────────── */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary-500" />
            <span className="section-label">Décisions — Mois {simulation.current_month}</span>
          </div>

          {simulation.status === 'active' ? (
            <DecisionControls
              onSubmit={handleSubmit}
              currentMonth={simulation.current_month}
              loading={submitting}
            />
          ) : (
            <div className="card bg-emerald-50 dark:bg-emerald-900/20 text-center py-8">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Simulation Terminée !
              </h2>
              <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
                Tous les mois ont été simulés.
              </p>
              <Button onClick={() => navigate(`/results/${id}`)}>
                Voir les résultats <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>

      </div>
    </>
  )
}
