import axios from 'axios'

// =============================================================================
// SUPPLY CHAIN SIMULATOR — MOCK ENGINE
// =============================================================================

const SUPPLIERS = [
  { id: 1, nom: 'Fournisseur A (Low Cost)',  cout_unitaire: 4.90,  delai_moyen: 14, fiabilite: 0.80, capacite_max: 12000 },
  { id: 2, nom: 'Fournisseur B (Balanced)',  cout_unitaire: 6.65,  delai_moyen: 10, fiabilite: 0.91, capacite_max: 9000  },
  { id: 3, nom: 'Fournisseur C (Premium)',   cout_unitaire: 8.40,  delai_moyen: 6,  fiabilite: 0.97, capacite_max: 7000  },
]

const SEASONAL_FACTORS = [0.72, 0.68, 0.85, 0.92, 1.00, 1.12, 1.22, 1.28, 1.15, 1.05, 1.35, 1.45]

const BASE_DEMAND         = 5000
const DEFAULT_SELL_PRICE  = 20
const PROD_UNIT_COST      = 3.50   // was 5.00  (×0.7)
const STORAGE_FG          = 0.56   // was 0.80  (×0.7)
const STORAGE_RM          = 0.21   // was 0.30  (×0.7)
const STOCKOUT_PENALTY    = 9.00   // kept — overridden per difficulty below
const BASE_BREAKDOWN_PROB = 0.18

// Coût par intervention selon la stratégie (stable, déterministe)
// Type = correctif (réactif) < préventif (planifié) < prédictif (technologique)
export const MAINT_COST_PER_INTERVENTION = {
  corrective: 250,   // cheap, reactive — repair team on standby
  preventive: 700,   // scheduled inspections + parts replacement
  predictive: 1600,  // IoT sensors + analysis + specialist team
}

// Max breakdown reduction per intervention (effectiveness per type)
const MAINT_EFFECTIVENESS_PER_FREQ = {
  corrective: 0.03,  // 3% risk reduction per intervention (low)
  preventive: 0.07,  // 7% per planned inspection
  predictive: 0.12,  // 12% per predictive cycle (high)
}

// ── DIFFICULTY PRESETS ────────────────────────────────────────────────────────
export const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Facile', emoji: '🟢',
    description: 'Marché très stable. Idéal pour découvrir le jeu.',
    shockMin: 0.98, shockMax: 1.02,           // ±2% only
    events: { spike: 0, crash: 0, trend: 0 },  // no market events
    stockoutPenalty: 1.5,   // was 2  (×0.7)
    baseBreakdownProb: 0,                      // no breakdowns
    deliveryGuaranteed: true,                  // always full delivery
    supplierStrikeProb: 0,
    initialMP: 6000, initialPF: 3500, initialHealth: 95,
  },
  normal: {
    label: 'Normal', emoji: '🟡',
    description: 'Quelques aléas. Bonne gestion récompensée.',
    shockMin: 0.90, shockMax: 1.10,            // ±10%
    events: { spike: 0.02, crash: 0.04, trend: 0.07 },
    stockoutPenalty: 3.5,   // was 5  (×0.7)
    baseBreakdownProb: 0.07,                   // rare breakdowns
    deliveryGuaranteed: false,
    supplierStrikeProb: 0.02,
    initialMP: 3500, initialPF: 2200, initialHealth: 85,
  },
  hard: {
    label: 'Difficile', emoji: '🔴',
    description: 'Volatilité réaliste. Pour gestionnaires expérimentés.',
    shockMin: 0.75, shockMax: 1.28,            // ±25-28%
    events: { spike: 0.06, crash: 0.11, trend: 0.19 },
    stockoutPenalty: 6.3,   // was 9  (×0.7)
    baseBreakdownProb: 0.18,
    deliveryGuaranteed: false,
    supplierStrikeProb: 0.06,
    initialMP: 2100, initialPF: 1200, initialHealth: 71,
  },
}

function getSeasonalFactor(n) {
  return SEASONAL_FACTORS[(n - 1) % 12]
}

// Breakdown probability: frequence × effectiveness per strategy reduces the base risk
function calcBreakdownProb(frequence, strategy, utilization, baseProb) {
  const eff     = MAINT_EFFECTIVENESS_PER_FREQ[strategy] ?? 0.03
  const maxRed  = Math.min(frequence * eff, 1.0)   // e.g. corrective 10 × 0.03 = 30% max
  let utilP = 1.0
  if (utilization >= 95)      utilP = 2.8
  else if (utilization >= 90) utilP = 2.0
  else if (utilization >= 80) utilP = 1.4
  else if (utilization >= 70) utilP = 1.1
  return Math.max(0.01, Math.min(0.90, baseProb * (1 - maxRed) * utilP))
}

function updateMachineHealth(health, utilization, frequence, strategy, breakdown) {
  // Healing power: type matters a lot — predictive maintains better
  const healPerFreq = { corrective: 0.5, preventive: 1.5, predictive: 2.5 }[strategy] ?? 0.5
  const healing = frequence * healPerFreq                  // e.g. preventive 5× = +7.5 pts
  const wear    = utilization * 0.15
  return Math.max(5, Math.min(100, health + healing - wear - (breakdown ? 18 : 0)))
}

// 3 pre-game months so users have context to analyse
function generateHistoricalContext() {
  return [
    {
      month: -2, label: 'N-3', isHistorical: true,
      demande_reelle: 4820, ventes: 4520, rupture: 300,
      chiffre_affaires: 90400, cout_total: 78600,
      cout_matieres: 35000, cout_production: 22600, cout_maintenance: 3200,
      cout_stockage: 4800, cout_rupture: 2700, cout_marketing: 5000,
      profit: 11800, stock_final: 650, stock_mp: 1800,
      taux_service: 93.8, machine_health: 85, production_reelle: 4700,
      breakdownOccurred: false, stock_securite: 500, budget_maintenance: 3000,
      evenement: '📦 Stock de sécurité atteint — quelques ruptures en fin de mois.',
      penaltyDetails: {
        rupture:            { units: 300,  costPerUnit: 9, total: 2700 },
        breakdown:          { occurred: false, capacityLost: 0, productionLost: 0 },
        maintenanceOverrun: { budgeted: 3000, actual: 3200, delta: 200 },
      },
    },
    {
      month: -1, label: 'N-2', isHistorical: true,
      demande_reelle: 5300, ventes: 3900, rupture: 1400,
      chiffre_affaires: 78000, cout_total: 74500,
      cout_matieres: 28000, cout_production: 19500, cout_maintenance: 9200,
      cout_stockage: 2100, cout_rupture: 12600, cout_marketing: 5000,
      profit: 3500, stock_final: 0, stock_mp: 350,
      taux_service: 73.6, machine_health: 61, production_reelle: 3100,
      breakdownOccurred: true, stock_securite: 500, budget_maintenance: 3000,
      evenement: '🔧 Panne Ligne B — capacité réduite à 52%. 🚫 Pénurie MP : production arrêtée prématurément.',
      penaltyDetails: {
        rupture:            { units: 1400, costPerUnit: 9, total: 12600 },
        breakdown:          { occurred: true, capacityLost: 0.48, productionLost: 1800 },
        maintenanceOverrun: { budgeted: 3000, actual: 9200, delta: 6200 },
      },
    },
    {
      month: 0, label: 'N-1', isHistorical: true,
      demande_reelle: 4350, ventes: 4350, rupture: 0,
      chiffre_affaires: 87000, cout_total: 69000,
      cout_matieres: 31500, cout_production: 21750, cout_maintenance: 3800,
      cout_stockage: 7200, cout_rupture: 0, cout_marketing: 5000,
      profit: 18000, stock_final: 1200, stock_mp: 2100,
      taux_service: 100, machine_health: 71, production_reelle: 4500,
      breakdownOccurred: false, stock_securite: 500, budget_maintenance: 3000,
      evenement: null,
      penaltyDetails: {
        rupture:            { units: 0, costPerUnit: 9, total: 0 },
        breakdown:          { occurred: false, capacityLost: 0, productionLost: 0 },
        maintenanceOverrun: { budgeted: 3000, actual: 3800, delta: 800 },
      },
    },
  ]
}

function simulateMonth(sim, decisions) {
  const { appro, production, maintenance, distribution, marketing, stock } = decisions

  const supplier       = SUPPLIERS.find(s => s.id === Number(appro.fournisseurId)) ?? SUPPLIERS[1]
  const rawOrdered     = Number(appro.quantiteCommandee)
  const prodRequested  = Number(production.volumeProduction)
  const utilization    = Number(maintenance.machineUtilization ?? 80)
  const maintFrequence = Math.max(1, Math.min(10, Number(maintenance.frequence ?? 5)))
  const maintStrategy  = maintenance.strategy ?? 'corrective'
  // Computed maintenance budget: frequence × cost per intervention (type drives the price)
  const maintBudget    = maintFrequence * (MAINT_COST_PER_INTERVENTION[maintStrategy] ?? 250)

  // Stock decisions (locked until round 4)
  const stockSecurite = Number(stock?.stockSecurite ?? 800)
  const lot           = Number(stock?.lotEconomique ?? 0)
  // EOQ — round up to nearest multiple
  const effectiveOrder = lot > 0 ? Math.ceil(rawOrdered / lot) * lot : rawOrdered

  // Strategy decisions
  const achatStrategie  = appro.strategie   ?? 'fixe'       // fixe | point_commande | eoq
  const prodStrategie   = production.strategie ?? 'continu'  // continu | lot_debut | mts
  const reorderPoint    = Number(appro.pointCommande ?? 1500)
  const reorderQty      = Number(appro.quantiteReappro ?? rawOrdered)
  const stockCible      = Number(production.stockCible ?? 3000)  // for mts strategy

  // Warehouse reservation (Gestion des Stocks)
  const capaciteReservee = Number(stock?.capaciteReservee ?? 2000) // reserved units

  // Marketing / Distribution defaults
  const sellPrice   = marketing?.prixUnitaire   ?? DEFAULT_SELL_PRICE
  const mktBudget   = marketing?.budgetMarketing ?? 5000
  const promoActive = marketing?.promotionActive ?? false
  const transport   = distribution?.modeTransport       ?? 'routier'
  const network     = distribution?.reseauDistribution  ?? 'national'

  const transportCost = { maritime: 0.56, routier: 0.84, aerien: 2.45 }[transport] ?? 0.84
  const networkBonus  = { regional: 0.90, national: 1.00, international: 1.15 }[network] ?? 1.00
  const mktBoost      = Math.min(1 + (mktBudget / 500) * 0.01, 1.30)
  const promoDemand   = promoActive ? 1.25 : 1.0
  const promoMargin   = promoActive ? 0.85 : 1.0
  const priceElastic  = Math.pow(DEFAULT_SELL_PRICE / sellPrice, 1.5)

  const monthNum = sim.current_month
  const events   = []

  // ── 0. DIFFICULTY CONFIG ──────────────────────────────────────────────────
  const diff = DIFFICULTY_CONFIG[sim.difficulty ?? 'normal']

  // ── 1. RECEIVE RAW MATERIALS (ordered last month) ────────────────────────
  const pendingArrival = sim.pendingRawMaterial ?? 0
  let actualArrival    = pendingArrival

  if (pendingArrival > 0 && !diff.deliveryGuaranteed) {
    const roll = Math.random()
    if (roll > supplier.fiabilite) {
      const ratio   = 0.55 + Math.random() * 0.40
      actualArrival = Math.round(pendingArrival * ratio)
      events.push(`⚠️ Livraison partielle : ${Math.round(ratio*100)}% reçus (${actualArrival.toLocaleString()} / ${pendingArrival.toLocaleString()} u)`)
    }
  }
  sim.rawMaterialStock = (sim.rawMaterialStock ?? 0) + actualArrival

  // ── 2. PURCHASING STRATEGY — determine this month's order ────────────────
  let effectiveOrderFinal = effectiveOrder  // default: 'fixe'
  if (achatStrategie === 'point_commande') {
    // Order reorderQty only if MP stock < reorder point
    effectiveOrderFinal = sim.rawMaterialStock < reorderPoint ? reorderQty : 0
    if (effectiveOrderFinal === 0)
      events.push(`📌 Stock MP (${sim.rawMaterialStock.toLocaleString()} u) ≥ point de commande (${reorderPoint.toLocaleString()} u) — pas de commande ce mois.`)
  } else if (achatStrategie === 'eoq') {
    // Auto EOQ = sqrt(2*annual_demand*order_cost / holding_cost)
    const annualDemand = BASE_DEMAND * 12
    const orderCost    = 500
    const holdingCost  = STORAGE_RM * 12
    const eoqAuto = Math.round(Math.sqrt((2 * annualDemand * orderCost) / holdingCost))
    effectiveOrderFinal = eoqAuto
    events.push(`📊 Stratégie EOQ : commande automatique de ${eoqAuto.toLocaleString()} u.`)
  }

  // Place the new order (arrives next month)
  let nextPending = effectiveOrderFinal
  if (Math.random() < diff.supplierStrikeProb) {
    nextPending = 0
    events.push(`🚫 Grève fournisseur : aucune livraison prévue le mois prochain !`)
  }
  sim.pendingRawMaterial = nextPending

  // ── 3. MAINTENANCE COST (frequence × tarif par type, ±5% variance) ────────────────
  const nominalCost     = maintBudget  // already = frequence × cost/intervention
  const variance        = diff.baseBreakdownProb === 0 ? 1.0 : 0.95 + Math.random() * 0.10  // ±5%
  const healthPenalty   = 1 + Math.max(0, (60 - sim.machineHealth) / 200)
  const actualMaintCost = Math.round(nominalCost * variance * healthPenalty)
  const maintOverrun    = actualMaintCost - nominalCost

  if (maintOverrun > nominalCost * 0.05)
    events.push(`💸 Coût maintenance : ${actualMaintCost.toLocaleString()}€ (prévu : ${nominalCost.toLocaleString()}€, santé machine faible)`)  

  // ── 4. MACHINE BREAKDOWN ───────────────────────────────────────────────────
  const breakdownProb     = calcBreakdownProb(maintFrequence, maintStrategy, utilization, diff.baseBreakdownProb)
  const breakdownOccurred = diff.baseBreakdownProb === 0 ? false : Math.random() < breakdownProb
  let capacityFactor      = 1.0
  let productionLost      = 0

  if (breakdownOccurred) {
    // Normal: mild capacity reduction (60-90%). Hard: severe (25-70%).
    const minCap = diff.baseBreakdownProb <= 0.10 ? 0.60 : 0.25
    capacityFactor = minCap + Math.random() * (1 - minCap) * 0.5
    const machines = ['Machine A', 'Ligne B', 'Convoyeur C', 'Presse D', 'Robot E']
    events.push(`🔧 Panne ${machines[Math.floor(Math.random()*5)]} — capacité réduite à ${Math.round(capacityFactor*100)}%`)
  }


  // ── 5. PRODUCTION STRATEGY ────────────────────────────────────────────────
  let prodTarget = prodRequested
  if (prodStrategie === 'mts') {
    // Make-to-stock: produce enough to reach target PF stock
    const needed = Math.max(0, stockCible - (sim.finishedGoodsStock ?? 0))
    prodTarget = needed
  }
  const maxWithCapacity  = Math.round(prodTarget * (utilization / 100) * capacityFactor)
  const actualProduction = Math.min(maxWithCapacity, sim.rawMaterialStock)
  productionLost         = maxWithCapacity - actualProduction
  sim.rawMaterialStock  -= actualProduction

  // ── 6. DEMAND — monthly total + 6 intra-month ticks ──────────────────────
  const seasonal    = getSeasonalFactor(monthNum)
  const randomShock = diff.shockMin + Math.random() * (diff.shockMax - diff.shockMin)

  let demandMult = 1.0
  const roll = Math.random()
  if (roll < diff.events.spike) {
    demandMult = 1.50 ; events.push(`📈 Pic de demande exceptionnel ! +50% ce mois.`)
  } else if (roll < diff.events.crash) {
    demandMult = 0.55 ; events.push(`📉 Ralentissement marché — demande réduite de 45%.`)
  } else if (roll < diff.events.trend) {
    demandMult = 1.20 ; events.push(`📣 Tendance positive du marché ce mois (+20%).`)
  }

  const demande = Math.max(500, Math.round(
    BASE_DEMAND * seasonal * randomShock * demandMult * mktBoost * promoDemand * priceElastic * networkBonus
  ))

  // Generate 6 intra-month demand ticks
  const TICKS = 6
  const rawTicks    = Array.from({ length: TICKS }, () => 0.70 + Math.random() * 0.60)
  const tickSum     = rawTicks.reduce((a, b) => a + b, 0)
  const demandTicks = rawTicks.map(v => Math.round(demande * v / tickSum))
  demandTicks[TICKS - 1] += demande - demandTicks.reduce((a, b) => a + b, 0) // correct drift

  // Production distribution ticks
  const prodPerTick = prodStrategie === 'lot_debut'
    ? [actualProduction, 0, 0, 0, 0, 0]
    : Array(TICKS).fill(Math.round(actualProduction / TICKS))

  // Stock evolution through the 6 ticks (for charts only)
  const stockPFTicks = []
  const stockMPTicks = []
  const prodTicks    = []
  const initialPF    = sim.finishedGoodsStock ?? 0
  let runningPF      = initialPF + actualProduction   // total available at start
  let runningMP      = sim.rawMaterialStock

  for (let t = 0; t < TICKS; t++) {
    runningPF = Math.max(0, runningPF - demandTicks[t])  // each tick consumes demand
    stockPFTicks.push(Math.round(runningPF))
    stockMPTicks.push(Math.max(0, Math.round(runningMP)))
    prodTicks.push(prodPerTick[t])
  }

  // ── 7. SALES & STOCKOUTS ──────────────────────────────────────────────────
  const initialAvailable = initialPF + actualProduction
  const ventes  = Math.min(demande, initialAvailable)
  const rupture = Math.max(0, demande - ventes)
  sim.finishedGoodsStock = Math.max(0, initialAvailable - ventes)

  if (rupture > 300)
    events.push(`❌ Rupture : ${rupture.toLocaleString()} unités non livrées — pénalité ${Math.round(rupture * diff.stockoutPenalty).toLocaleString()} €`)
  if (sim.finishedGoodsStock < stockSecurite)
    events.push(`⚠️ Stock PF (${sim.finishedGoodsStock.toLocaleString()} u) sous le stock de sécurité (${stockSecurite.toLocaleString()} u)`)

  // ── 8. WAREHOUSE RESERVATION COST ────────────────────────────────────────
  const peakStock    = Math.max(...stockPFTicks)
  const overageUnits = Math.max(0, peakStock - capaciteReservee)
  const coutEntrepot = Math.round(
    capaciteReservee * STORAGE_FG +         // fixed reservation cost
    overageUnits     * STORAGE_FG * 2.5     // overage penalty (×2.5)
  )
  if (overageUnits > 0)
    events.push(`🏭 Capacité entrepôt dépassée : pic à ${peakStock.toLocaleString()} u (réservé : ${capaciteReservee.toLocaleString()} u) — surcoût ${Math.round(overageUnits * STORAGE_FG * 1.5)} €`)

  // ── 9. COSTS ──────────────────────────────────────────────────────────────
  const coutMP      = effectiveOrderFinal * supplier.cout_unitaire
  const coutProd    = actualProduction * PROD_UNIT_COST
  const coutStockRM = sim.rawMaterialStock * STORAGE_RM
  const coutRupture = rupture * diff.stockoutPenalty
  const coutTransport = ventes * transportCost
  const coutMarketing = mktBudget
  const coutTotal   = coutMP + coutProd + actualMaintCost + coutEntrepot + coutStockRM + coutRupture + coutTransport + coutMarketing

  // ── 10. REVENUE, PROFIT & PERFORMANCE BONUS ───────────────────────────────
  const ca          = ventes * sellPrice * promoMargin
  const profit      = ca - coutTotal
  const tauxService = demande > 0 ? (ventes / demande) * 100 : 100
  const performanceBonus = tauxService >= 95 && profit > 0 && !breakdownOccurred

  // ── 11. MACHINE HEALTH ────────────────────────────────────────────────────
  sim.machineHealth = updateMachineHealth(sim.machineHealth, utilization, maintFrequence, maintStrategy, breakdownOccurred)

  // ── 12. ADVANCE MONTH ─────────────────────────────────────────────────────
  sim.current_month++
  const isLastMonth = sim.current_month > sim.total_months
  if (isLastMonth) sim.status = 'completed'

  const penaltyDetails = {
    rupture:            { units: rupture, costPerUnit: diff.stockoutPenalty, total: Math.round(coutRupture) },
    breakdown:          { occurred: breakdownOccurred, capacityLost: breakdownOccurred ? (1 - capacityFactor) : 0, productionLost },
    maintenanceOverrun: { budgeted: maintBudget, actual: actualMaintCost, delta: Math.max(0, maintOverrun) },
    warehouse:          { reserved: capaciteReservee, peak: peakStock, overage: overageUnits },
  }

  return {
    isLastMonth,
    monthData: {
      month:             monthNum,
      demande_reelle:    demande,
      ventes,
      rupture,
      chiffre_affaires:  Math.round(ca),
      cout_total:        Math.round(coutTotal),
      cout_matieres:     Math.round(coutMP),
      cout_production:   Math.round(coutProd),
      cout_maintenance:  actualMaintCost,
      budget_maintenance: nominalCost,
      cout_stockage:     Math.round(coutEntrepot + coutStockRM),
      cout_rupture:      Math.round(coutRupture),
      cout_marketing:    Math.round(coutMarketing),
      profit:            Math.round(profit),
      stock_final:       sim.finishedGoodsStock,
      stock_mp:          sim.rawMaterialStock,
      stock_securite:    stockSecurite,
      taux_service:      Math.round(tauxService * 10) / 10,
      machine_health:    Math.round(sim.machineHealth),
      production_reelle: actualProduction,
      breakdownOccurred,
      performanceBonus,
      evenement:         events.length > 0 ? events.join(' | ') : null,
      penaltyDetails,
      demandTicks,
      stockPFTicks,
      stockMPTicks,
      prodTicks,
    },
  }
}


function computeFinalScore(results) {
  if (!results?.length) return { total: 0, rentabilite: 0, serviceClient: 0, efficacite: 0, avgService: 0 }
  const liveResults = results.filter(r => !r.isHistorical)
  if (!liveResults.length) return { total: 0, rentabilite: 0, serviceClient: 0, efficacite: 0, avgService: 0 }

  const avgService       = liveResults.reduce((s, r) => s + r.taux_service, 0) / liveResults.length
  const serviceScore     = Math.round((avgService / 100) * 40)

  const totalProfit = liveResults.reduce((s, r) => s + r.profit, 0)
  const totalCA     = liveResults.reduce((s, r) => s + r.chiffre_affaires, 0)
  const margin      = totalCA > 0 ? totalProfit / totalCA : -1
  const rentScore   = Math.max(0, Math.round(Math.min((margin / 0.20) * 40, 40)))

  const breakdowns    = liveResults.filter(r => r.breakdownOccurred).length
  const heavyStockout = liveResults.filter(r => r.rupture > 300).length
  const efficScore    = Math.max(0, 20 - breakdowns * 3 - heavyStockout * 2)

  return {
    total:         Math.min(100, serviceScore + rentScore + efficScore),
    rentabilite:   Math.min(100, Math.round((rentScore / 40) * 100)),
    serviceClient: Math.min(100, Math.round((serviceScore / 40) * 100)),
    efficacite:    Math.min(100, efficScore * 5),
    avgService:    Math.round(avgService * 10) / 10,
  }
}

function buildRecommendations(results, score) {
  const live = results.filter(r => !r.isHistorical)
  const recs = []
  const breakdowns = live.filter(r => r.breakdownOccurred).length
  const stockouts  = live.filter(r => r.rupture > 200).length

  if (breakdowns >= 3)
    recs.push({ category: 'Maintenance', type: 'critical', message: `${breakdowns} pannes détectées. Passez en maintenance préventive ou prédictive et augmentez le budget.` })
  else if (breakdowns > 0)
    recs.push({ category: 'Maintenance', type: 'warning',  message: `${breakdowns} panne(s) survenue(s). Votre stratégie peut encore être optimisée.` })
  else
    recs.push({ category: 'Maintenance', type: 'success',  message: `Aucune panne ! Excellente gestion de la maintenance.` })

  if (stockouts >= 3)
    recs.push({ category: 'Approvisionnement', type: 'critical', message: `${stockouts} mois de rupture. Commandez plus de matières premières ou changez de fournisseur.` })
  else if (stockouts > 0)
    recs.push({ category: 'Stock', type: 'warning', message: `Quelques ruptures détectées. Augmentez votre stock de sécurité ou le volume d'achat.` })

  if (score.avgService >= 95)
    recs.push({ category: 'Service Client', type: 'success', message: `Taux de service exceptionnel de ${score.avgService}%.` })
  else if (score.avgService < 80)
    recs.push({ category: 'Service Client', type: 'critical', message: `Taux de service de ${score.avgService}% — insuffisant. La production et les achats doivent être revus.` })

  const totalProfit = live.reduce((s, r) => s + r.profit, 0)
  if (totalProfit < 0)
    recs.push({ category: 'Finance', type: 'critical', message: `Simulation déficitaire (${totalProfit.toLocaleString('fr-FR')} €). Réduisez les coûts et les ruptures.` })

  return recs
}

// =============================================================================
// STATE + PUBLIC API  (localStorage-backed so data survives page refresh)
// =============================================================================

const STORAGE_KEY = 'sc_sim_data'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { sims: [], nextId: 1 }
    return JSON.parse(raw)
  } catch { return { sims: [], nextId: 1 } }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sims: mockSimulations, nextId: nextSimId }))
  } catch { /* quota exceeded — ignore */ }
}


const API_BASE_URL = 'https://supply-chain-backend-81j4.onrender.com/'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor to add token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => Promise.reject(error))

const _init = loadState()
let mockSimulations = _init.sims
let nextSimId       = _init.nextId

export const authAPI = {
  login:    (credentials) => api.post('/auth/login', credentials),
  register: (userData)    => api.post('/auth/register', userData),
  checkHealth: () => api.get('/health')
}

export const simulationAPI = {
  create: (data) => {
    const diffKey = data.difficulty ?? 'normal'
    const diff    = DIFFICULTY_CONFIG[diffKey]
    const context = generateHistoricalContext()
    const sim = {
      id:                 nextSimId++,
      name:               data.name,
      difficulty:         diffKey,
      total_months:       data.totalMonths,
      current_month:      1,
      status:             'active',
      created_at:         new Date().toISOString(),
      results:            [],
      historicalContext:  context,
      rawMaterialStock:   diff.initialMP,
      pendingRawMaterial: 0,
      finishedGoodsStock: diff.initialPF,
      machineHealth:      diff.initialHealth,
    }
    mockSimulations.push(sim)
    saveState()
    return Promise.resolve({ data: sim })
  },

  list: () => Promise.resolve({ data: mockSimulations }),

  get: (id) => {
    const sim = mockSimulations.find(s => s.id === Number(id))
    if (!sim) return Promise.reject(new Error('Not found'))
    return Promise.resolve({ data: { ...sim } })
  },

  submitDecisions: (id, decisions) => {
    const sim = mockSimulations.find(s => s.id === Number(id))
    if (!sim) return Promise.reject(new Error('Not found'))
    const { isLastMonth, monthData } = simulateMonth(sim, decisions)
    sim.results.push(monthData)
    saveState()
    return Promise.resolve({
      data: { success: true, isLastMonth, results: monthData, month: monthData.month, nextMonth: sim.current_month },
    })
  },

  getSummary: (id) => {
    const sim = mockSimulations.find(s => s.id === Number(id))
    if (!sim) return Promise.reject(new Error('Not found'))
    const score           = computeFinalScore(sim.results)
    const recommendations = buildRecommendations(sim.results, score)
    return Promise.resolve({
      data: {
        totalMonths:    sim.total_months,
        score,
        recommendations,
        summary: {
          total_ca:     sim.results.filter(r=>!r.isHistorical).reduce((s,r)=>s+r.chiffre_affaires,0),
          total_profit: sim.results.filter(r=>!r.isHistorical).reduce((s,r)=>s+r.profit,0),
          total_couts:  sim.results.filter(r=>!r.isHistorical).reduce((s,r)=>s+r.cout_total,0),
        },
        monthlyResults:    sim.results,
        historicalContext: sim.historicalContext,
      },
    })
  },

  getSuppliers: () => Promise.resolve({ data: SUPPLIERS }),
}

export const exportAPI = {
  exportCSV: (id) => {
    const sim = mockSimulations.find(s => s.id === Number(id))
    if (!sim) return Promise.reject(new Error('Not found'))
    const header = 'Mois,Demande,Ventes,Rupture,CA,Coût Total,Profit,Stock PF,Stock MP,Taux Service,Santé Machine\n'
    const rows   = sim.results.filter(r=>!r.isHistorical).map(r =>
      `${r.month},${r.demande_reelle},${r.ventes},${r.rupture},${r.chiffre_affaires},${r.cout_total},${r.profit},${r.stock_final},${r.stock_mp},${r.taux_service},${r.machine_health}`
    ).join('\n')
    return Promise.resolve({ data: header + rows })
  },
}

export default {}
