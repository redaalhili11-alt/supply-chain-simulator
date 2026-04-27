import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { simulationAPI, DIFFICULTY_CONFIG } from '../services/api'
import { SkeletonCard } from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import {
  Plus, Play, BarChart3, Calendar, CheckCircle,
  Clock, Sparkles, TrendingUp, Target, Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div variants={item} className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <motion.p
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  )
}

function SimCard({ sim, onClick }) {
  const pct  = Math.round(((sim.current_month - 1) / sim.total_months) * 100)
  const done = sim.status === 'completed'

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)' }}
      onClick={onClick}
      className="card cursor-pointer flex flex-col gap-4 group"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>
            {sim.name}
          </h3>
          <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Calendar className="w-3 h-3" />
            {new Date(sim.created_at).toLocaleDateString('fr-FR')}
            {sim.difficulty && (
              <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                sim.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                sim.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {DIFFICULTY_CONFIG[sim.difficulty]?.label}
              </span>
            )}
          </p>
        </div>
        <span className={`badge flex-shrink-0 ${done ? 'badge-success' : 'badge-warning'}`}>
          {done ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          {done ? 'Terminée' : 'En cours'}
        </span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          <span>{sim.current_month - 1} / {sim.total_months} mois</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: done ? 'var(--success)' : 'var(--primary)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className={`w-full text-sm font-medium flex items-center justify-center gap-2 py-1.5 rounded-lg transition-colors
          ${done
            ? 'text-primary-600 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20'
            : 'text-emerald-600 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20'
          }`}>
          {done
            ? <><BarChart3 className="w-4 h-4" /> Voir résultats</>
            : <><Play className="w-4 h-4" /> Continuer</>
          }
        </div>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [simulations,  setSimulations]  = useState([])
  const [showModal,    setShowModal]    = useState(false)
  const [newSimName,   setNewSimName]   = useState('')
  const [totalMonths,  setTotalMonths]  = useState(12)
  const [difficulty,   setDifficulty]   = useState('normal')
  const [loading,      setLoading]      = useState(true)
  const [creating,     setCreating]     = useState(false)
  const navigate = useNavigate()

  const loadSimulations = useCallback(async () => {
    try {
      const { data } = await simulationAPI.list()
      setSimulations(data)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSimulations() }, [loadSimulations])

  const createSimulation = async () => {
    if (!newSimName.trim()) return
    setCreating(true)
    try {
      const { data } = await simulationAPI.create({ name: newSimName, totalMonths, difficulty })
      toast.success('Simulation créée !')
      setShowModal(false)
      navigate(`/simulation/${data.id}`)
    } catch {
      toast.error('Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  const stats = [
    { icon: BarChart3,    label: 'Total simulations', value: simulations.length,                                        color: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600' },
    { icon: Clock,        label: 'En cours',          value: simulations.filter(s => s.status === 'active').length,    color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' },
    { icon: CheckCircle,  label: 'Terminées',         value: simulations.filter(s => s.status === 'completed').length, color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' },
  ]

  return (
    <div className="space-y-8">
      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Mes Simulations
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Gérez et analysez vos scénarios supply chain
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="md">
          <Plus className="w-4 h-4" />
          Nouvelle simulation
        </Button>
      </motion.div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </motion.div>

      {/* ── Simulation Cards ─────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : simulations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card text-center py-16 flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Aucune simulation
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Créez votre première simulation pour commencer à jouer
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Créer ma première simulation
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {simulations.map((sim) => (
            <SimCard
              key={sim.id}
              sim={sim}
              onClick={() =>
                sim.status === 'completed'
                  ? navigate(`/results/${sim.id}`)
                  : navigate(`/simulation/${sim.id}`)
              }
            />
          ))}
        </motion.div>
      )}

      {/* ── New Simulation Modal ──────────────────────────────────────── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle Simulation">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nom de la simulation
            </label>
            <input
              type="text"
              className="input-field"
              value={newSimName}
              onChange={(e) => setNewSimName(e.target.value)}
              placeholder="Ex : Stratégie Q1 2025"
              onKeyDown={(e) => e.key === 'Enter' && createSimulation()}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Durée —&nbsp;
              <span className="font-bold text-primary-600">{totalMonths} mois</span>
            </label>
            <input
              type="range" min="5" max="12" value={totalMonths}
              onChange={(e) => setTotalMonths(Number(e.target.value))}
              className="slider"
              style={{ background: `linear-gradient(to right, #4f46e5 ${Math.round(((totalMonths-5)/7)*100)}%, #e2e8f0 ${Math.round(((totalMonths-5)/7)*100)}%)` }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>5 mois</span><span>12 mois</span>
            </div>
          </div>

          {/* Difficulty picker */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <Shield className="w-4 h-4 inline mr-1" /> Niveau de difficulté
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  className={`rounded-xl p-3 text-left border-2 transition-all duration-150 ${
                    difficulty === key
                      ? key === 'easy'   ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                        : key === 'hard' ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                        : 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                  style={{ background: difficulty === key ? undefined : 'var(--bg-subtle)' }}
                >
                  <div className="text-lg mb-1">{cfg.emoji}</div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{cfg.label}</div>
                  <div className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{cfg.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={createSimulation}
              loading={creating}
              disabled={!newSimName.trim()}
              className="flex-1"
            >
              <Sparkles className="w-4 h-4" />
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
