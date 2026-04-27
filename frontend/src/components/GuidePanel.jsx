import { useState } from 'react'
import { BookOpen, X, ChevronDown, ChevronRight, Target, Package, Factory, Wrench, BarChart3, Lightbulb } from 'lucide-react'

const SECTIONS = [
  {
    id:   'how',
    icon: Target,
    title: 'Comment jouer',
    color: 'blue',
    content: [
      { step: '1', text: 'Chaque mois vous prenez des décisions pour 3 départements : Approvisionnement, Production et Maintenance.' },
      { step: '2', text: 'Vous commandez des matières premières (MP) — elles arrivent le mois suivant. Anticipez la demande !' },
      { step: '3', text: 'Vous définissez le volume à produire. La production est limitée par les MP disponibles et la santé machine.' },
      { step: '4', text: 'Après 3 mois, Finance, Distribution et Marketing se débloquent. Optimisez prix, transport et budget.' },
      { step: '5', text: 'À la fin de la simulation, vous recevez un score sur 100 basé sur le service client, la rentabilité et l\'efficacité.' },
    ],
  },
  {
    id:   'kpis',
    icon: BarChart3,
    title: 'Métriques clés',
    color: 'green',
    content: [
      { label: 'Taux de Service',   desc: 'Part de la demande satisfaite. < 80% = pénalité de score importante. Cible : ≥ 95%.' },
      { label: 'Profit du mois',    desc: 'CA − tous les coûts. Un mois négatif n\'est pas catastrophique si les stocks s\'améliorent.' },
      { label: 'Santé Machine',     desc: 'Diminue avec l\'usure et les pannes. < 50% = risque élevé. Montez le budget maintenance.' },
      { label: 'Stock PF',          desc: 'Produits Finis disponibles. Trop haut = coûts de stockage élevés. Trop bas = ruptures.' },
      { label: 'Stock MP',          desc: 'Matières Premières. S\'il est à 0, la production s\'arrête le mois suivant.' },
      { label: 'Rupture',           desc: `Unités non livrées. Chaque unité coûte 9 €. C'est la pénalité la plus coûteuse.` },
    ],
  },
  {
    id:   'appro',
    icon: Package,
    title: 'Approvisionnement',
    color: 'orange',
    content: [
      { label: 'Fournisseur',          desc: 'A = pas cher mais peu fiable (80%). B = équilibré. C = cher mais très fiable (97%). Choisissez selon votre tolérance au risque.' },
      { label: 'Volume commandé',      desc: 'Les MP arrivent le mois SUIVANT. Si vous prévoyez un pic de demande dans 2 mois, commandez maintenant.' },
      { label: 'Fiabilité fournisseur',desc: 'Un fournisseur à 80% de fiabilité a 20% de chance de livraison partielle (45–90% seulement).' },
      { label: 'Lot économique (EOQ)', desc: 'Commandez en multiples de ce nombre pour optimiser les coûts de passation de commande. 0 = désactivé.' },
    ],
  },
  {
    id:   'prod',
    icon: Factory,
    title: 'Production',
    color: 'blue',
    content: [
      { label: 'Volume de production', desc: 'Ce que vous demandez à l\'usine. La production réelle peut être inférieure si les MP manquent ou si une panne survient.' },
      { label: 'Coût de transformation', desc: '5 €/unité produite — fixe. Produire moins est parfois plus rentable si la demande est faible.' },
      { label: 'Lien avec Maintenance', desc: 'Le taux d\'utilisation machine (décidé en Maintenance) multiplie le volume demandé. 80% d\'utilisation × 5000 = 4000 max.' },
    ],
  },
  {
    id:   'maint',
    icon: Wrench,
    title: 'Maintenance',
    color: 'red',
    content: [
      { label: 'Budget',             desc: 'Plus il est élevé, moins les pannes sont fréquentes. Mais le coût réel varie selon la stratégie.' },
      { label: 'Corrective',         desc: 'On répare après la panne. Coût réel imprévisible (×0.5 à ×1.9 du budget). Probabilité panne élevée.' },
      { label: 'Préventive',         desc: 'Entretien planifié. Coût stable (×0.9 à ×1.2). Risque modéré. Bon compromis.' },
      { label: 'Prédictive',         desc: 'Capteurs + IA. Coût très stable (×0.93 à ×1.07). Risque très faible. Stratégie idéale mais coûteuse.' },
      { label: 'Taux d\'utilisation',desc: 'Au-delà de 90%, l\'usure s\'accélère fortement. Une machine à 100% est 2.8× plus susceptible de tomber en panne.' },
    ],
  },
  {
    id:   'tips',
    icon: Lightbulb,
    title: 'Conseils & Erreurs courantes',
    color: 'purple',
    content: [
      { tip: '⚡', text: 'Commandez toujours des MP 1 à 2 mois à l\'avance. Ne réagissez pas, anticipez.' },
      { tip: '⚡', text: 'Gardez un stock de sécurité PF ≥ 500 u pour absorber les pics de demande imprévus.' },
      { tip: '⚡', text: 'Si la santé machine descend sous 60%, passez en maintenance préventive immédiatement.' },
      { tip: '❌', text: 'Ne commandez pas exactement la quantité que vous pensez vendre — il peut y avoir des événements.' },
      { tip: '❌', text: 'Ne mettez pas la maintenance à 0€ — les coûts de réparation correctifs sont souvent bien plus élevés.' },
      { tip: '❌', text: 'Ne produisez pas au maximum (100% utilisation) sans avoir un bon budget maintenance.' },
    ],
  },
]

export default function GuidePanel({ isOpen, onClose }) {
  const [expanded, setExpanded] = useState('how')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end" onClick={onClose}>
      <div
        className="relative bg-white h-full w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-600 to-primary-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-lg">Guide du Jeu</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Intro */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-900">
            Vous êtes le responsable supply chain d'une usine. Chaque mois, prenez les bonnes décisions pour maximiser le profit et le service client sur {' '}
            <span className="font-bold">toute la durée de la simulation</span>.
          </p>
        </div>

        {/* Accordion sections */}
        <div className="flex-1 overflow-y-auto">
          {SECTIONS.map(section => {
            const Icon   = section.icon
            const isOpen = expanded === section.id
            return (
              <div key={section.id} className="border-b border-gray-100">
                <button
                  className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : section.id)}
                >
                  <div className={`p-1.5 rounded-lg bg-${section.color}-50`}>
                    <Icon className={`w-4 h-4 text-${section.color}-600`} />
                  </div>
                  <span className="font-semibold text-gray-800 flex-1">{section.title}</span>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 space-y-3">
                    {section.id === 'how' && section.content.map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{item.step}</div>
                        <p className="text-sm text-gray-700">{item.text}</p>
                      </div>
                    ))}

                    {section.id === 'kpis' && section.content.map((item, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-bold text-gray-900 mb-0.5">{item.label}</p>
                        <p className="text-xs text-gray-600">{item.desc}</p>
                      </div>
                    ))}

                    {(section.id === 'appro' || section.id === 'prod' || section.id === 'maint') && section.content.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-xs font-bold text-gray-500 w-32 flex-shrink-0 pt-0.5">{item.label}</span>
                        <p className="text-xs text-gray-700">{item.desc}</p>
                      </div>
                    ))}

                    {section.id === 'tips' && section.content.map((item, i) => (
                      <div key={i} className={`flex gap-2 p-2 rounded-lg ${item.tip === '⚡' ? 'bg-green-50' : 'bg-red-50'}`}>
                        <span className="text-base">{item.tip}</span>
                        <p className="text-xs text-gray-700">{item.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
