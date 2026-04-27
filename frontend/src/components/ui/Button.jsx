import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const variants = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 shadow-sm focus:ring-primary-500',
  secondary: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400',
  ghost:     'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-slate-400',
  danger:    'bg-red-500 text-white hover:bg-red-600 shadow-sm focus:ring-red-500',
  success:   'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm focus:ring-emerald-500',
}

const sizes = {
  sm:  'px-3 py-1.5 text-xs gap-1.5',
  md:  'px-4 py-2.5 text-sm gap-2',
  lg:  'px-6 py-3 text-base gap-2.5',
}

export default function Button({
  children,
  variant = 'primary',
  size    = 'md',
  loading = false,
  disabled,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!(disabled || loading) ? { scale: 1.02 } : {}}
      whileTap={!(disabled || loading) ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={[
        'inline-flex items-center justify-center font-medium rounded-xl',
        'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
      {children}
    </motion.button>
  )
}
