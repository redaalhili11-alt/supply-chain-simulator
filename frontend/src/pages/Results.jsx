import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { simulationAPI, exportAPI } from '../services/api'
import { MonthlyChart, CostBreakdown, DemandFluctuationChart, StockEvolutionChart, MachineHealthChart } from '../components/Charts'
import { Download, Trophy, ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [id])

  const loadResults = async () => {
    try {
      const { data } = await simulationAPI.getSummary(id)
      setSummary(data)
      setResults(data.monthlyResults || [])
    } catch (err) {
      toast.error('Erreur lors du chargement des résultats')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await exportAPI.exportCSV(id)
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `simulation_${id}_results.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Export CSV réussi !')
    } catch (err) {
      toast.error("Erreur lors de l'export")
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warning'
    return 'text-danger'
  }

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-success" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />
      case 'critical': return <AlertTriangle className="w-5 h-5 text-danger" />
      default: return <Info className="w-5 h-5 text-info" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucun résultat disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Résultats Finaux</h1>
            <p className="text-gray-500 mt-1">Résumé de la simulation sur {summary.totalMonths} mois</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Score Global */}
      <div className={`card ${getScoreBg(summary.score.total)}`}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center">
            <Trophy className={`w-16 h-16 ${getScoreColor(summary.score.total)}`} />
            <div className={`text-5xl font-bold ${getScoreColor(summary.score.total)} mt-2`}>
              {summary.score.total}/100
            </div>
            <p className="text-gray-600 font-medium mt-1">Score Global</p>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(summary.score.rentabilite)}`}>
                {summary.score.rentabilite}
              </div>
              <p className="text-sm text-gray-600 mt-1">Rentabilité</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${summary.score.rentabilite >= 80 ? 'bg-success' : summary.score.rentabilite >= 60 ? 'bg-warning' : 'bg-danger'}`}
                  style={{ width: `${summary.score.rentabilite}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(summary.score.serviceClient)}`}>
                {summary.score.serviceClient}
              </div>
              <p className="text-sm text-gray-600 mt-1">Service Client</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${summary.score.serviceClient >= 80 ? 'bg-success' : summary.score.serviceClient >= 60 ? 'bg-warning' : 'bg-danger'}`}
                  style={{ width: `${summary.score.serviceClient}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(summary.score.efficacite)}`}>
                {summary.score.efficacite}
              </div>
              <p className="text-sm text-gray-600 mt-1">Efficacité SC</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${summary.score.efficacite >= 80 ? 'bg-success' : summary.score.efficacite >= 60 ? 'bg-warning' : 'bg-danger'}`}
                  style={{ width: `${summary.score.efficacite}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Chiffre d'affaires total</p>
          <p className="text-2xl font-bold text-primary-600">€{summary.summary.total_ca?.toLocaleString('fr-FR') || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Profit total</p>
          <p className={`text-2xl font-bold ${summary.summary.total_profit >= 0 ? 'text-success' : 'text-danger'}`}>
            €{summary.summary.total_profit?.toLocaleString('fr-FR') || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Coûts totaux</p>
          <p className="text-2xl font-bold text-danger">€{summary.summary.total_couts?.toLocaleString('fr-FR') || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Taux de service moyen</p>
          <p className="text-2xl font-bold text-info">{summary.score.avgService?.toFixed(1) || 0}%</p>
        </div>
      </div>

      {/* Recommandations */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Recommandations Stratégiques
        </h3>
        <div className="space-y-3">
          {summary.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {getRecommendationIcon(rec.type)}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{rec.category}</span>
                <p className="text-gray-800 mt-1">{rec.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart results={results} />
        <CostBreakdown results={results} />
        <DemandFluctuationChart results={results} />
        <StockEvolutionChart results={results} />
      </div>
      <MachineHealthChart results={results} />

      {/* Tableau détaillé */}
      <div className="card overflow-hidden">
        <h3 className="text-lg font-semibold mb-4">Résultats Mensuels Détaillés</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Mois</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Demande</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">CA</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Coûts</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Profit</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Stock</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Service</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Événement</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.month} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">M{result.month}</td>
                  <td className="text-right py-3 px-4">{result.demande_reelle?.toLocaleString('fr-FR')}</td>
                  <td className="text-right py-3 px-4">€{result.chiffre_affaires?.toLocaleString('fr-FR')}</td>
                  <td className="text-right py-3 px-4">€{result.cout_total?.toLocaleString('fr-FR')}</td>
                  <td className={`text-right py-3 px-4 font-medium ${result.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    €{result.profit?.toLocaleString('fr-FR')}
                  </td>
                  <td className="text-right py-3 px-4">{result.stock_final?.toLocaleString('fr-FR')}</td>
                  <td className="text-right py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.taux_service >= 95 ? 'bg-green-100 text-green-800' :
                      result.taux_service >= 80 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.taux_service?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{result.evenement || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
