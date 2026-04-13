// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
    ember:     'btn-ember',
  }
  return (
    <button className={`${variants[variant]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`} {...props}>
      {children}
    </button>
  )
}

// ── Badge / Tag ───────────────────────────────────────────────────────────────
export function Tag({ children, variant = 'default' }) {
  return (
    <span className={variant === 'season' ? 'tag-season' : 'tag-default'}>
      {children}
    </span>
  )
}

// ── Loading spinner ───────────────────────────────────────────────────────────
export function Spinner({ className = '' }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="w-8 h-8 text-parchment-400" />
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="font-display text-xl text-nook-dark mb-2">{title}</h3>
      {description && <p className="text-sm text-nook-muted mb-6 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────
export function SectionHeading({ children, sub }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-3xl text-nook-dark">{children}</h1>
      {sub && <p className="text-nook-muted text-sm mt-1 font-body">{sub}</p>}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider() {
  return <hr className="border-parchment-200 my-6" />
}

// ── Inline error ──────────────────────────────────────────────────────────────
export function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <div className="rounded-lg bg-ember-500/10 border border-ember-500/20 px-4 py-3 text-sm text-ember-600 font-body">
      {message}
    </div>
  )
}
