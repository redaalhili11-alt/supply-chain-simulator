/**
 * Moteur de simulation Supply Chain
 * Logique économique et gestion des événements aléatoires
 */

class SimulationEngine {
  constructor() {
    // Paramètres de base
    this.baseDemand = 5000;           // Demande de base mensuelle
    this.demandVolatility = 0.15;     // Volatilité de la demande (15%)
    this.seasonality = [0.9, 0.85, 1.0, 1.05, 1.1, 1.15, 1.1, 1.0, 0.95, 1.0, 1.2, 1.3]; // Saisonnalité par mois

    // Coûts fixes
    this.fixedProductionCost = 5000;  // Coût fixe production/mois
    this.variableProductionCost = 5;  // Coût variable/unité
    this.storageCostPerUnit = 0.5;    // Coût stockage/unité/mois
    this.storageFixedCost = 1000;     // Coût fixe entrepôt

    // Paramètres transports
    this.transportModes = {
      'maritime': { costPerUnit: 0.8, speed: 30, reliability: 0.9 },
      'routier': { costPerUnit: 1.2, speed: 5, reliability: 0.95 },
      'aerien': { costPerUnit: 3.5, speed: 2, reliability: 0.98 }
    };

    // Fournisseurs
    this.suppliers = {
      1: { name: 'Fournisseur A', cost: 8.5, baseDelay: 14, reliability: 0.85, maxCapacity: 10000 },
      2: { name: 'Fournisseur B', cost: 10.0, baseDelay: 10, reliability: 0.92, maxCapacity: 8000 },
      3: { name: 'Fournisseur C', cost: 12.5, baseDelay: 7, reliability: 0.97, maxCapacity: 6000 }
    };

    // Événements aléatoires
    this.events = [
      { name: 'Crise fournisseur', probability: 0.05, impact: { delayMultiplier: 2, costMultiplier: 1.3 } },
      { name: 'Pic de demande', probability: 0.08, impact: { demandMultiplier: 1.4 } },
      { name: 'Grève transport', probability: 0.04, impact: { transportMultiplier: 1.5, delayAdd: 5 } },
      { name: 'Panne machine', probability: 0.06, impact: { productionReduction: 0.3 } },
      { name: 'Concurrence agressive', probability: 0.07, impact: { pricePressure: 0.9 } },
      { name: 'Tendance positive', probability: 0.1, impact: { demandMultiplier: 1.2 } },
      { name: 'Inflation matières', probability: 0.06, impact: { costMultiplier: 1.25 } },
      { name: null, probability: 0.54, impact: {} } // Aucun événement
    ];
  }

  /**
   * Génère la demande du marché avec saisonnalité et aléa
   */
  generateDemand(month, marketingBudget = 0, price = 20, promotion = false) {
    const seasonFactor = this.seasonality[(month - 1) % 12];
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * this.demandVolatility;

    // Impact du prix (élasticité -1.5)
    const basePrice = 20;
    const priceFactor = Math.pow(basePrice / price, 1.5);

    // Impact marketing (ROI dégressif)
    const marketingFactor = 1 + Math.log1p(marketingBudget / 1000) * 0.1;

    // Impact promotion
    const promotionFactor = promotion ? 1.3 : 1.0;

    const demand = Math.round(
      this.baseDemand * seasonFactor * randomFactor * priceFactor * marketingFactor * promotionFactor
    );

    return Math.max(0, demand);
  }

  /**
   * Détermine l'événement aléatoire du mois
   */
  generateEvent() {
    const rand = Math.random();
    let cumulative = 0;

    for (const event of this.events) {
      cumulative += event.probability;
      if (rand <= cumulative) {
        return event;
      }
    }

    return this.events[this.events.length - 1];
  }

  /**
   * Calcule les délais fournisseurs avec aléa
   */
  calculateSupplierDelay(supplierId, event = null) {
    const supplier = this.suppliers[supplierId] || this.suppliers[2];
    let delay = supplier.baseDelay;

    // Variabilité normale (±20%)
    delay *= (0.8 + Math.random() * 0.4);

    // Fiabilité du fournisseur
    if (Math.random() > supplier.reliability) {
      delay *= 1.5; // Retard supplémentaire si non fiable
    }

    // Impact événement
    if (event?.impact?.delayMultiplier) {
      delay *= event.impact.delayMultiplier;
    }
    if (event?.impact?.delayAdd) {
      delay += event.impact.delayAdd;
    }

    return Math.round(delay);
  }

  /**
   * Calcule le coût d'approvisionnement
   */
  calculateProcurementCost(supplierId, quantity, event = null) {
    const supplier = this.suppliers[supplierId] || this.suppliers[2];
    let unitCost = supplier.cost;

    // Impact événement coût
    if (event?.impact?.costMultiplier) {
      unitCost *= event.impact.costMultiplier;
    }

    return unitCost * quantity;
  }

  /**
   * Calcule les coûts de production
   */
  calculateProductionCost(volume, capacityUsed, event = null) {
    let effectiveVolume = volume;

    // Impact panne machine
    if (event?.impact?.productionReduction) {
      effectiveVolume *= (1 - event.impact.productionReduction);
    }

    // Surcharge si capacité > 90%
    const overloadFactor = capacityUsed > 90 ? 1 + (capacityUsed - 90) / 100 * 0.5 : 1;

    const variableCost = effectiveVolume * this.variableProductionCost * overloadFactor;
    const fixedCost = this.fixedProductionCost;

    return {
      total: variableCost + fixedCost,
      variable: variableCost,
      fixed: fixedCost,
      actualVolume: Math.round(effectiveVolume)
    };
  }

  /**
   * Calcule les coûts de stockage
   */
  calculateStorageCost(stockLevel, safetyStock) {
    const variableCost = stockLevel * this.storageCostPerUnit;
    const fixedCost = this.storageFixedCost + (safetyStock * 0.2); // Coût lié au stock de sécurité

    return {
      total: variableCost + fixedCost,
      variable: variableCost,
      fixed: fixedCost
    };
  }

  /**
   * Calcule les coûts de transport
   */
  calculateTransportCost(mode, quantity, event = null) {
    const transport = this.transportModes[mode] || this.transportModes['routier'];
    let cost = transport.costPerUnit * quantity;

    if (event?.impact?.transportMultiplier) {
      cost *= event.impact.transportMultiplier;
    }

    return {
      total: cost,
      perUnit: transport.costPerUnit,
      speed: transport.speed,
      reliability: transport.reliability
    };
  }

  /**
   * Simulation complète d'un mois
   */
  simulateMonth(month, decisions, previousState = null) {
    const event = this.generateEvent();

    // 1. Génération de la demande
    const demand = this.generateDemand(
      month,
      decisions.marketing?.budgetMarketing || 0,
      decisions.marketing?.prixUnitaire || 20,
      decisions.marketing?.promotionActive || false
    );

    // Impact événement sur demande
    const finalDemand = event.impact?.demandMultiplier 
      ? Math.round(demand * event.impact.demandMultiplier) 
      : demand;

    // 2. Approvisionnement
    const supplierId = decisions.appro?.fournisseurId || 2;
    const orderQty = decisions.appro?.quantiteCommandee || 5000;
    const supplierDelay = this.calculateSupplierDelay(supplierId, event);
    const procurementCost = this.calculateProcurementCost(supplierId, orderQty, event);

    // 3. Production
    const productionVolume = decisions.production?.volumeProduction || 5000;
    const capacityUsed = decisions.production?.capaciteUtilisee || 80;
    const production = this.calculateProductionCost(productionVolume, capacityUsed, event);

    // 4. Stock
    const previousStock = previousState?.stockFinal || 2000;
    const safetyStock = decisions.stock?.stockSecurite || 1000;
    const availableStock = previousStock + orderQty + production.actualVolume;

    // Satisfaction de la demande
    const satisfiedDemand = Math.min(finalDemand, availableStock);
    const stockOut = finalDemand > availableStock;
    const stockFinal = Math.max(0, availableStock - finalDemand);

    // 5. Distribution
    const transportMode = decisions.distribution?.modeTransport || 'routier';
    const transport = this.calculateTransportCost(transportMode, satisfiedDemand, event);

    // 6. Calculs financiers
    const price = decisions.marketing?.prixUnitaire || 20;
    const marketingBudget = decisions.marketing?.budgetMarketing || 0;

    // Impact pression concurrentielle sur prix
    const finalPrice = event.impact?.pricePressure ? price * event.impact.pricePressure : price;

    const chiffreAffaires = satisfiedDemand * finalPrice;
    const coutProduction = production.total;
    const coutStockage = this.calculateStorageCost(stockFinal, safetyStock).total;
    const coutTransport = transport.total;
    const coutMarketing = marketingBudget;
    const coutTotal = procurementCost + coutProduction + coutStockage + coutTransport + coutMarketing;
    const profit = chiffreAffaires - coutTotal;

    // 7. KPIs
    const tauxService = finalDemand > 0 ? (satisfiedDemand / finalDemand) * 100 : 100;
    const stockMoyen = (previousStock + stockFinal) / 2;
    const delaiMoyen = supplierDelay + transport.speed;

    return {
      demandeReelle: finalDemand,
      demandeSatisfaite: satisfiedDemand,
      chiffreAffaires: Math.round(chiffreAffaires * 100) / 100,
      coutProduction: Math.round(coutProduction * 100) / 100,
      coutStockage: Math.round(coutStockage * 100) / 100,
      coutTransport: Math.round(coutTransport * 100) / 100,
      coutMarketing: Math.round(coutMarketing * 100) / 100,
      coutTotal: Math.round(coutTotal * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      stockFinal: stockFinal,
      stockMoyen: Math.round(stockMoyen),
      tauxService: Math.round(tauxService * 100) / 100,
      delaiMoyen: Math.round(delaiMoyen * 100) / 100,
      evenement: event.name,
      stockOut: stockOut,
      eventDetails: event
    };
  }

  /**
   * Calcule le score global de la simulation
   */
  calculateScore(results) {
    if (results.length === 0) return { total: 0, details: {} };

    const totalProfit = results.reduce((sum, r) => sum + r.profit, 0);
    const avgService = results.reduce((sum, r) => sum + r.taux_service, 0) / results.length;
    const avgStock = results.reduce((sum, r) => sum + r.stock_moyen, 0) / results.length;
    const totalCA = results.reduce((sum, r) => sum + r.chiffre_affaires, 0);

    // Scores normalisés (0-100)
    const profitScore = Math.min(100, Math.max(0, (totalProfit / 50000) * 100));
    const serviceScore = avgService;
    const efficiencyScore = Math.min(100, Math.max(0, (totalCA / (avgStock * results.length)) * 10));

    const totalScore = (profitScore * 0.4 + serviceScore * 0.35 + efficiencyScore * 0.25);

    return {
      total: Math.round(totalScore),
      rentabilite: Math.round(profitScore),
      serviceClient: Math.round(serviceScore),
      efficacite: Math.round(efficiencyScore),
      totalProfit: Math.round(totalProfit),
      avgService: Math.round(avgService * 100) / 100,
      totalCA: Math.round(totalCA)
    };
  }

  /**
   * Génère des recommandations stratégiques
   */
  generateRecommendations(results, decisions) {
    const recommendations = [];

    const avgService = results.reduce((sum, r) => sum + r.taux_service, 0) / results.length;
    const avgStock = results.reduce((sum, r) => sum + r.stock_moyen, 0) / results.length;
    const totalStockOuts = results.filter(r => r.stock_out).length;
    const totalProfit = results.reduce((sum, r) => sum + r.profit, 0);

    if (avgService < 85) {
      recommendations.push({
        type: 'warning',
        category: 'Service Client',
        message: 'Votre taux de service est faible. Augmentez votre stock de sécurité ou choisissez un fournisseur plus fiable.'
      });
    }

    if (totalStockOuts > results.length * 0.3) {
      recommendations.push({
        type: 'critical',
        category: 'Stock',
        message: `Vous avez connu ${totalStockOuts} ruptures de stock. Envisagez une politique de réapprovisionnement plus proactive.`
      });
    }

    if (avgStock > 8000) {
      recommendations.push({
        type: 'info',
        category: 'Stock',
        message: 'Vos niveaux de stock sont élevés. Optimisez pour réduire les coûts de stockage.'
      });
    }

    if (totalProfit < 0) {
      recommendations.push({
        type: 'critical',
        category: 'Finance',
        message: 'Votre simulation est déficitaire. Révisez votre stratégie de prix et vos coûts.'
      });
    }

    if (totalProfit > 100000) {
      recommendations.push({
        type: 'success',
        category: 'Finance',
        message: 'Excellent résultat financier ! Votre stratégie est très efficace.'
      });
    }

    // Analyse des décisions
    const avgPrice = decisions.reduce((sum, d) => sum + (d.prix_unitaire || 20), 0) / decisions.length;
    if (avgPrice < 15) {
      recommendations.push({
        type: 'warning',
        category: 'Prix',
        message: 'Vos prix sont très bas. Vous pourriez augmenter vos marges sans trop impacter la demande.'
      });
    }

    return recommendations;
  }
}

module.exports = SimulationEngine;
