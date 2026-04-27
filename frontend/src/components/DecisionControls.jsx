import { useState, useEffect } from 'react'
import { Factory, Package, Wrench, DollarSign, Truck, Megaphone, Lock, AlertTriangle, Unlock, Info } from 'lucide-react'
import { simulationAPI } from '../services/api'

// ─── Reusable UI atoms ────────────────────────────────────────────────────────

function SliderControl({ label, value, min, max, step, onChange, unit = '', info }) {
  const pct = Math.round(((value - min) / (max - min)) * 100)
  const bg  = `linear-gradient(to right, #4f46e5 ${pct}%, #e2e8f0 ${pct}%)`

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
        <span className="text-sm font-bold text-primary-600">{value.toLocaleString('fr-FR')}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
        style={{ background: bg }}
      />
      {info && <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{info}</p>}
    </div>
  )
}

function ActiveSection({ title, icon: Icon, color = 'primary', isNew = false, infoContent, children }) {
  const [showInfo, setShowInfo] = useState(false)
  return (
    <div className={`card border-2 transition-colors ${isNew ? 'border-green-300' : 'border-transparent hover:border-primary-100'}`}>
      <div className="flex items-center gap-2 mb-5">
        <div className={`p-2 rounded-lg bg-${color}-50`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
        {infoContent && (
          <button onClick={() => setShowInfo(s => !s)} className="ml-1 text-gray-400 hover:text-primary-600 transition-colors">
            <Info className="w-4 h-4" />
          </button>
        )}
        {isNew
          ? <span className="ml-auto text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Unlock className="w-3 h-3" /> Débloqué !</span>
          : <span className="ml-auto text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Actif</span>
        }
      </div>
      {showInfo && infoContent && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900 space-y-1.5">
          {infoContent.map((line, i) => (
            <p key={i}><span className="font-semibold">{line.label}:</span> {line.desc}</p>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

function LockedSection({ title, icon: Icon, color = 'gray', remainingRounds }) {
  return (
    <div className="relative card border-2 border-dashed border-gray-200 overflow-hidden select-none">
      {/* Blurred placeholder */}
      <div className="opacity-20 pointer-events-none filter blur-[2px]">
        <div className="flex items-center gap-2 mb-5">
          <div className={`p-2 rounded-lg bg-${color}-50`}>
            <Icon className={`w-5 h-5 text-${color}-400`} />
          </div>
          <h3 className="font-semibold text-lg text-gray-400">{title}</h3>
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-full mb-3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 backdrop-blur-sm rounded-xl">
        <div className="bg-gray-100 rounded-full p-3 mb-3">
          <Lock className="w-7 h-7 text-gray-500" />
        </div>
        <p className="text-sm font-bold text-gray-700">{title}</p>
        <p className="text-xs text-gray-500 mt-1">
          Disponible dans{' '}
          <span className="font-bold text-primary-600">{remainingRounds} mois</span>
        </p>
        <div className="mt-3 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Valeurs par défaut appliquées
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const UNLOCK_ROUND = 3   // departments unlock after this many completed rounds

export default function DecisionControls({ onSubmit, currentMonth, loading, compact = false }) {
  const [suppliers, setSuppliers] = useState([])

  // unlocked = user has completed ≥ UNLOCK_ROUND months, so currentMonth > UNLOCK_ROUND
  const isUnlocked = currentMonth > UNLOCK_ROUND
  const remainingRounds = Math.max(0, UNLOCK_ROUND - currentMonth + 1)

  const [decisions, setDecisions] = useState({
    appro: { fournisseurId: 2, quantiteCommandee: 5000, strategie: 'fixe', pointCommande: 1500, quantiteReappro: 5000 },
    production: { volumeProduction: 5000, strategie: 'continu', stockCible: 3000 },
    maintenance: { frequence: 5, strategy: 'preventive', machineUtilization: 75 },
    stock: { stockSecurite: 800, lotEconomique: 0, capaciteReservee: 3000 },
    finance:      { budgetGlobal: 50000, objectif: 'profit' },
    distribution: { modeTransport: 'routier', reseauDistribution: 'national' },
    marketing:    { prixUnitaire: 20, budgetMarketing: 5000, promotionActive: false },
  })

  useEffect(() => {
    simulationAPI.getSuppliers()
      .then(({ data }) => setSuppliers(data))
      .catch(() => setSuppliers([
        { id: 1, nom: 'Fournisseur A (Low Cost)',  cout_unitaire: 7.00,  fiabilite: 0.80 },
        { id: 2, nom: 'Fournisseur B (Balanced)',  cout_unitaire: 9.50,  fiabilite: 0.91 },
        { id: 3, nom: 'Fournisseur C (Premium)',   cout_unitaire: 12.00, fiabilite: 0.97 },
      ]))
  }, [])

  const set = (section, field, value) =>
    setDecisions(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }))

  const selectedSupplier = suppliers.find(s => s.id === Number(decisions.appro.fournisseurId))
  const estimatedMatCost = selectedSupplier
    ? (decisions.appro.quantiteCommandee * selectedSupplier.cout_unitaire).toLocaleString('fr-FR')
    : '—'

  // Live maintenance cost + breakdown probability preview
  const TARIFS = { corrective: 250, preventive: 700, predictive: 1600 }
  const EFFICACITE = { corrective: 0.03, preventive: 0.07, predictive: 0.12 }
  const { frequence: mFreq = 5, strategy: mStrat = 'preventive', machineUtilization: mUtil = 75 } = decisions.maintenance
  const coutMaintEstime = mFreq * (TARIFS[mStrat] ?? 250)
  const maxRed = Math.min(mFreq * (EFFICACITE[mStrat] ?? 0.03), 1.0)
  let utilP = 1.0
  if (mUtil >= 95) utilP = 2.8
  else if (mUtil >= 90) utilP = 2.0
  else if (mUtil >= 80) utilP = 1.4
  else if (mUtil >= 70) utilP = 1.1
  const calcBreakdownProbPreview = Math.round(Math.max(1, Math.min(90, 0.07 * (1 - maxRed) * utilP * 100)))

  const breakdownColor =
    calcBreakdownProbPreview >= 40 ? 'text-red-600 bg-red-50 border-red-200'    :
    calcBreakdownProbPreview >= 20 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                     'text-green-600 bg-green-50 border-green-200'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Décisions — Mois {currentMonth}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Les commandes de matières premières arrivent le mois suivant.</p>
      </div>

      {/* Unlock banner — shown exactly at the unlock moment */}
      {currentMonth === UNLOCK_ROUND + 1 && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-300 rounded-xl text-green-800">
          <Unlock className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Nouveaux départements débloqués !</p>
            <p className="text-sm">Finance, Distribution et Marketing sont maintenant disponibles. Maîtrisez-les pour améliorer votre score.</p>
          </div>
        </div>
      )}

      {/* Grid — single column in compact/sidebar mode, up to 3 cols full-width */}
      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'}>

        {/* ── PURCHASING ── */}
        <ActiveSection title="Approvisionnement (MP)" icon={Package} color="orange"
          infoContent={[
            { label: 'Fournisseur',         desc: 'A = pas cher, peu fiable (80%). B = équilibré. C = cher, très fiable (97%). Choisissez selon votre tolérance au risque.' },
            { label: 'Volume commandé',     desc: 'Les MP arrivent le mois SUIVANT. Anticipez la demande !' },
            { label: 'Livraison partielle', desc: 'Un fournisseur peu fiable peut ne livrer que 45–90% de votre commande.' },
            { label: 'Lot économique',      desc: 'EOQ : commandez en multiples de ce nombre. 0 = désactivé.' },
          ]}
        >
          <div className="mb-5">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Fournisseur</label>
            <select
              value={decisions.appro.fournisseurId}
              onChange={(e) => set('appro', 'fournisseurId', Number(e.target.value))}
              className="input-field"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nom} — {s.cout_unitaire}€/u — Fiab. {Math.round(s.fiabilite * 100)}%
                </option>
              ))}
            </select>
            {selectedSupplier && (
              <div className="mt-2 flex gap-2 text-xs flex-wrap">
                <span className={`px-2 py-0.5 rounded-full font-medium ${selectedSupplier.fiabilite >= 0.95 ? 'bg-green-100 text-green-700' : selectedSupplier.fiabilite >= 0.90 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  Fiabilité {Math.round(selectedSupplier.fiabilite * 100)}%
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {selectedSupplier.cout_unitaire}€/u
                </span>
              </div>
            )}
          </div>
          {/* Strategy selector */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Stratégie d'achat</label>
            <select
              value={decisions.appro.strategie}
              onChange={(e) => set('appro', 'strategie', e.target.value)}
              className="input-field"
            >
              <option value="fixe">Fixe — je définis la quantité chaque mois</option>
              <option value="point_commande">Point de commande — commande auto quand stock MP &lt; seuil</option>
              <option value="eoq">EOQ automatique — quantité économique calculée</option>
            </select>
          </div>

          {decisions.appro.strategie === 'fixe' && (
            <SliderControl
              label="Volume commandé (MP)"
              value={decisions.appro.quantiteCommandee}
              min={500} max={12000} step={100} unit=" u"
              onChange={(v) => set('appro', 'quantiteCommandee', v)}
              info="⚠️ Livraison le mois prochain. Planifiez à l’avance !"
            />
          )}
          {decisions.appro.strategie === 'point_commande' && (<>
            <SliderControl
              label="Point de commande (seuil MP)"
              value={decisions.appro.pointCommande}
              min={200} max={5000} step={100} unit=" u"
              onChange={(v) => set('appro', 'pointCommande', v)}
              info="Commande déclenchée automatiquement quand le stock MP tombe sous ce seuil."
            />
            <SliderControl
              label="Quantité à commander"
              value={decisions.appro.quantiteReappro}
              min={500} max={12000} step={100} unit=" u"
              onChange={(v) => set('appro', 'quantiteReappro', v)}
              info="Quantité commandée à chaque déclenchement."
            />
          </>)}
          {decisions.appro.strategie === 'eoq' && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-xs text-orange-800">
              📊 Le système calcule automatiquement la quantité économique (EOQ) chaque mois.
            </div>
          )}

          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-xs text-orange-800 font-medium mt-2">
            💰 Coût estimé : <span className="font-bold">{estimatedMatCost} €</span>
            <span className="text-orange-500 font-normal"> (payé maintenant)</span>
          </div>
        </ActiveSection>

        {/* ── PRODUCTION ── */}
        <ActiveSection title="Production" icon={Factory} color="blue"
          infoContent={[
            { label: 'Volume demandé',       desc: 'La production réelle peut être inférieure si les MP manquent ou si une panne survient.' },
            { label: 'Coût transformation', desc: '5 €/unité produite. La production partielle due à une panne coûte quand même.' },
            { label: 'Utilisation machine', desc: 'Définie dans Maintenance. 80% d\'utilisation × 5000 demandés = 4000 unités max possible.' },
          ]}
        >
          {/* Production strategy */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Stratégie de production</label>
            <select
              value={decisions.production.strategie}
              onChange={(e) => set('production', 'strategie', e.target.value)}
              className="input-field"
            >
              <option value="continu">Continue — production répartie sur le mois</option>
              <option value="lot_debut">Lot unique — toute la production dès le début du mois</option>
              <option value="mts">Make-to-Stock — produire jusqu’au stock cible</option>
            </select>
          </div>

          {decisions.production.strategie !== 'mts' ? (
            <SliderControl
              label="Volume de production demandé"
              value={decisions.production.volumeProduction}
              min={500} max={10000} step={100} unit=" u"
              onChange={(v) => set('production', 'volumeProduction', v)}
              info="Limité par les MP disponibles et la santé machine."
            />
          ) : (
            <SliderControl
              label="Stock cible (PF)"
              value={decisions.production.stockCible}
              min={500} max={8000} step={100} unit=" u"
              onChange={(v) => set('production', 'stockCible', v)}
              info="Le système produit le nécessaire pour atteindre ce niveau de stock PF."
            />
          )}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800 space-y-1">
            <p>🏗️ <strong>Attention :</strong> une panne peut réduire la production réelle.</p>
            <p>📦 Transformation des MP en produits finis (3.50 €/unité).</p>
          </div>
        </ActiveSection>

        {/* ── MAINTENANCE ── */}
        <ActiveSection title="Maintenance" icon={Wrench} color="red"
          infoContent={[
            { label: 'Corrective',     desc: '250 €/intervention. On répare après la panne. Peu efficace, risque élevé. Réduction du risque : 3%/intervention.' },
            { label: 'Préventive',    desc: '700 €/intervention. Inspections planifiées. Bon compromis. Réduction : 7%/intervention.' },
            { label: 'Prédictive',   desc: '1 600 €/intervention. Capteurs IoT + spécialistes. Très efficace. Réduction : 12%/intervention.' },
            { label: 'Fréquence',    desc: 'Nombre d’interventions programmées par mois (1 = minimal, 10 = maximum). Le coût total = fréquence × tarif.' },
            { label: 'Utilisation',   desc: 'Au-delà de 90%, le risque de panne est ×2 à ×2.8 plus élevé.' },
          ]}
        >
          {/* Maintenance type */}
          <div className="mb-5">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Type de maintenance</label>
            <select
              value={decisions.maintenance.strategy}
              onChange={(e) => set('maintenance', 'strategy', e.target.value)}
              className="input-field"
            >
              <option value="corrective">Corrective — 250 €/interv. — risque élevé</option>
              <option value="preventive">Préventive — 700 €/interv. — risque modéré</option>
              <option value="predictive">Prédictive — 1 600 €/interv. — risque faible</option>
            </select>
          </div>

          {/* Frequency slider */}
          <SliderControl
            label="Fréquence d’intervention (par mois)"
            value={decisions.maintenance.frequence ?? 5}
            min={1} max={10} step={1} unit=" fois/mois"
            onChange={(v) => set('maintenance', 'frequence', v)}
            info={`${mFreq} intervention${mFreq > 1 ? 's' : ''} × ${(TARIFS[mStrat] ?? 250).toLocaleString('fr-FR')} € = ${coutMaintEstime.toLocaleString('fr-FR')} €/mois`}
          />

          {/* Cost table: all three types at current frequency */}
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-200 text-xs">
            {[['corrective','Corrective','bg-red-50 text-red-700'],['preventive','Préventive','bg-amber-50 text-amber-700'],['predictive','Prédictive','bg-green-50 text-green-700']].map(([key, label, cls]) => (
              <div key={key} className={`flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-0 ${mStrat === key ? 'font-bold ring-2 ring-inset ring-primary-300' : ''}`}>
                <span className={`px-1.5 py-0.5 rounded font-medium ${cls}`}>{label}</span>
                <span className="text-gray-500">{mFreq} × {TARIFS[key].toLocaleString('fr-FR')} €</span>
                <span className="font-semibold text-gray-800">{(mFreq * TARIFS[key]).toLocaleString('fr-FR')} €</span>
              </div>
            ))}
          </div>

          {/* Utilization slider */}
          <SliderControl
            label="Taux d’utilisation machine"
            value={decisions.maintenance.machineUtilization}
            min={50} max={100} step={5} unit="%"
            onChange={(v) => set('maintenance', 'machineUtilization', v)}
            info="Au-delà de 90%, le risque de panne augmente fortement."
          />

          {/* Breakdown probability live display */}
          <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
            calcBreakdownProbPreview >= 30 ? 'text-red-600 bg-red-50 border-red-200' :
            calcBreakdownProbPreview >= 12 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                             'text-green-600 bg-green-50 border-green-200'
          }`}>
            <span>Probabilité de panne estimée</span>
            <span className="text-base font-bold">{calcBreakdownProbPreview}%</span>
          </div>
        </ActiveSection>

        {/* ── FINANCE ── */}
        {isUnlocked ? (
          <ActiveSection title="Finance" icon={DollarSign} color="green" isNew={currentMonth === UNLOCK_ROUND + 1}
            infoContent={[
              { label: 'Budget global',       desc: 'Plafond budgétaire mensuel. Si vos dépenses le dépassent, une pénalité s\'applique.' },
              { label: 'Objectif stratégique',desc: 'Profit : score pondéré rentabilité. Croissance : bonus CA. Service : bonus taux de service.' },
            ]}
          >
            <SliderControl
              label="Budget Global"
              value={decisions.finance.budgetGlobal}
              min={20000} max={150000} step={5000} unit=" €"
              onChange={(v) => set('finance', 'budgetGlobal', v)}
              info="Budget total mensuel disponible (Marketing + Maintenance + Achats)."
            />
            <div className="mb-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Objectif Stratégique</label>
              <select
                value={decisions.finance.objectif}
                onChange={(e) => set('finance', 'objectif', e.target.value)}
                className="input-field"
              >
                <option value="profit">Maximiser le Profit</option>
                <option value="croissance">Croissance du CA</option>
                <option value="service">Excellence Service Client</option>
              </select>
            </div>
          </ActiveSection>
        ) : (
          <LockedSection title="Finance" icon={DollarSign} color="green" remainingRounds={remainingRounds} />
        )}

        {/* ── DISTRIBUTION ── */}
        {isUnlocked ? (
          <ActiveSection title="Distribution" icon={Truck} color="cyan" isNew={currentMonth === UNLOCK_ROUND + 1}
            infoContent={[
              { label: 'Maritime', desc: '0.8 €/u — le moins cher, mais délai 30j et risques de retard.' },
              { label: 'Routier',  desc: '1.2 €/u — standard. Délai 5j, fiable.' },
              { label: 'Aérien',   desc: '3.5 €/u — très rapide (2j), très coûteux.' },
              { label: 'Réseau',   desc: 'International = +15% de demande potentielle mais coûts logistiques plus élevés.' },
            ]}
          >
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Mode de Transport</label>
              <select
                value={decisions.distribution.modeTransport}
                onChange={(e) => set('distribution', 'modeTransport', e.target.value)}
                className="input-field"
              >
                <option value="maritime">Maritime — 0.8 €/u | Délai 30j | Risque retard</option>
                <option value="routier">Routier — 1.2 €/u | Délai 5j | Fiable</option>
                <option value="aerien">Aérien — 3.5 €/u | Délai 2j | Très rapide</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Réseau de Distribution</label>
              <select
                value={decisions.distribution.reseauDistribution}
                onChange={(e) => set('distribution', 'reseauDistribution', e.target.value)}
                className="input-field"
              >
                <option value="regional">Régional — Coût bas, portée limitée</option>
                <option value="national">National — Équilibré</option>
                <option value="international">International — Coût élevé, grande portée (+15% demande)</option>
              </select>
            </div>
          </ActiveSection>
        ) : (
          <LockedSection title="Distribution" icon={Truck} color="cyan" remainingRounds={remainingRounds} />
        )}

        {/* ── STOCK ── */}
        {isUnlocked ? (
          <ActiveSection title="Gestion des Stocks" icon={Package} color="indigo" isNew={currentMonth === UNLOCK_ROUND + 1}
            infoContent={[
              { label: 'Stock de sécurité', desc: 'Seuil d\'alerte pour les produits finis. Si le stock PF passe en dessous, une alerte apparaît. Réduit le risque de rupture.' },
              { label: 'Lot économique',    desc: 'EOQ : le système arrondit votre commande au multiple supérieur de ce nombre. Exemple : commande 3200, LOT=500 → commande effective 3500.' },
            ]}
          >
            <SliderControl
              label="Stock de sécurité (PF)"
              value={decisions.stock?.stockSecurite ?? 800}
              min={0} max={3000} step={100} unit=" u"
              onChange={(v) => set('stock', 'stockSecurite', v)}
              info="Alerte si le stock PF descend sous ce seuil."
            />
            <SliderControl
              label="Lot économique (EOQ)"
              value={decisions.stock?.lotEconomique ?? 0}
              min={0} max={2000} step={100} unit=" u"
              onChange={(v) => set('stock', 'lotEconomique', v)}
              info={`Commandes arrondies au multiple de ${decisions.stock?.lotEconomique || 'N/A'} u. 0 = désactivé.`}
            />
            {(decisions.stock?.lotEconomique ?? 0) > 0 && (
              <div className="p-2 bg-indigo-50 rounded-lg text-xs text-indigo-800">
                Commande effective : {Math.ceil((decisions.appro?.quantiteCommandee ?? 5000) / (decisions.stock.lotEconomique || 1)) * decisions.stock.lotEconomique} u
              </div>
            )}
            <SliderControl
              label="Capacité entrepôt réservée (PF)"
              value={decisions.stock?.capaciteReservee ?? 3000}
              min={500} max={8000} step={100} unit=" u"
              onChange={(v) => set('stock', 'capaciteReservee', v)}
              info={`Coût fixe : ${((decisions.stock?.capaciteReservee ?? 3000) * 0.56).toFixed(0)} €/mois. Si le stock dépasse cette capacité, surcoût ×2.5.`}
            />
          </ActiveSection>
        ) : (
          <LockedSection title="Gestion des Stocks" icon={Package} color="indigo" remainingRounds={remainingRounds} />
        )}
        )}

        {/* ── MARKETING ── */}
        {isUnlocked ? (
          <ActiveSection title="Marketing & Ventes" icon={Megaphone} color="purple" isNew={currentMonth === UNLOCK_ROUND + 1}
            infoContent={[
              { label: 'Prix unitaire',    desc: 'Élasticité −1.5 : +10% de prix = −15% de demande. Le juste prix équilibre volume et marge.' },
              { label: 'Budget marketing', desc: '+1% de demande par 500€ investis, plafonné à +30%.' },
              { label: 'Promotion',        desc: '+25% de demande mais −15% de marge par unité vendue. Attention aux ruptures !' },
            ]}
          >
            <SliderControl
              label="Prix Unitaire de Vente"
              value={decisions.marketing.prixUnitaire}
              min={10} max={45} step={0.5} unit=" €"
              onChange={(v) => set('marketing', 'prixUnitaire', v)}
              info="Élasticité prix -1.5 : +10% de prix → -15% de demande."
            />
            <SliderControl
              label="Budget Marketing"
              value={decisions.marketing.budgetMarketing}
              min={0} max={25000} step={500} unit=" €"
              onChange={(v) => set('marketing', 'budgetMarketing', v)}
              info="Augmente la demande : +1% de demande pour 500€ investis."
            />
            <div className="flex items-center gap-3 mt-1">
              <input
                type="checkbox"
                id="promo"
                checked={decisions.marketing.promotionActive}
                onChange={(e) => set('marketing', 'promotionActive', e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded"
              />
              <label htmlFor="promo" className="text-sm font-medium text-gray-700">
                Promotion active <span className="text-gray-400 font-normal">(+25% demande, −15% marge)</span>
              </label>
            </div>
          </ActiveSection>
        ) : (
          <LockedSection title="Marketing & Ventes" icon={Megaphone} color="purple" remainingRounds={remainingRounds} />
        )}

      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => onSubmit(decisions)}
          disabled={loading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 text-base px-8 py-3"
        >
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : null}
          ▶ Simuler le mois {currentMonth}
        </button>
      </div>
    </div>
  )
}
