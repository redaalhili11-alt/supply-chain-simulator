import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useThemeStore } from '../store/useThemeStore'
import {
  BarChart3, LogOut, Box, Home, Sun, Moon, Menu, X, ChevronRight,
} from 'lucide-react'

const NAV = [
  { to: '/',   icon: Home,     label: 'Dashboard' },
  { to: null,  icon: BarChart3, label: 'Simulations', isSection: true },
]

export default function Layout() {
  const { user, logout }       = useAuth()
  const navigate               = useNavigate()
  const location               = useLocation()
  const { theme, toggleTheme } = useThemeStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) { navigate('/login'); return null }

  const isActive = (to) => to && (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to))

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]"
        onClick={() => setMobileOpen(false)}
      >
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Box className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-[var(--text-primary)] leading-tight">Supply Chain</p>
          <p className="text-xs text-[var(--text-muted)]">Simulator</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="section-label px-3 mb-2">Navigation</p>
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className={`nav-item ${isActive('/') ? 'active' : ''}`}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          Dashboard
          {isActive('/') && (
            <motion.div
              layoutId="activeNavIndicator"
              className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600"
            />
          )}
        </Link>

        {location.pathname.startsWith('/simulation/') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="nav-item active"
          >
            <BarChart3 className="w-4 h-4 flex-shrink-0" />
            Simulation active
            <ChevronRight className="w-3 h-3 ml-auto" />
          </motion.div>
        )}
        {location.pathname.startsWith('/results/') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="nav-item active"
          >
            <BarChart3 className="w-4 h-4 flex-shrink-0" />
            Résultats
            <ChevronRight className="w-3 h-3 ml-auto" />
          </motion.div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-[var(--border)] pt-4 space-y-1">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="nav-item w-full text-left"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 flex-shrink-0 text-amber-400" />
            : <Moon className="w-4 h-4 flex-shrink-0" />}
          {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        </button>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-600">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)] flex-1 truncate">
            {user?.username || 'Utilisateur'}
          </span>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 fixed left-0 top-0 h-full z-40"
        style={{
          width: 'var(--sidebar-w)',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay sidebar ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 h-full z-50 lg:hidden flex flex-col"
              style={{
                width: 'var(--sidebar-w)',
                background: 'var(--bg-sidebar)',
                borderRight: '1px solid var(--border)',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-[var(--sidebar-w)] min-w-0">
        {/* Mobile topbar */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 h-14 sticky top-0 z-30 border-b"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center">
              <Box className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-[var(--text-primary)]">Supply Chain</span>
          </div>
          <button onClick={toggleTheme} className="ml-auto p-2 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
