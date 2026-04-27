import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authAPI } from '../services/api'
import { Box, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { data } = await authAPI.login({ email: formData.email, password: formData.password })
        login(data.token, data.user)
        toast.success('Connexion réussie !')
        navigate('/')
      } else {
        await authAPI.register(formData)
        toast.success('Compte créé ! Vous pouvez vous connecter.')
        setIsLogin(true)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <Box className="w-12 h-12 text-primary-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Supply Chain Simulator</h1>
            <p className="text-gray-500 mt-2">Simulez et optimisez votre supply chain</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                className="input-field"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : null}
              {isLogin ? 'Se connecter' : 'Créer un compte'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-600 font-medium hover:underline"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
