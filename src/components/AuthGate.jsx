import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Button, ErrorMessage, Spinner } from './ui'

export default function AuthGate({ children }) {
  const { session, loading, signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [submitting, setSub]    = useState(false)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-parchment-50">
      <Spinner className="w-8 h-8 text-parchment-400" />
    </div>
  )

  if (session) return children

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSub(true); setError(null)
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    setSub(false)
  }

  return (
    <div className="min-h-screen bg-parchment-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🍳</span>
          <h1 className="font-display text-3xl text-nook-dark">CookNook</h1>
          <p className="text-nook-muted text-sm mt-1 font-body">Your family kitchen, organised.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-parchment-200 p-6 space-y-4 shadow-sm">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoFocus />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          <ErrorMessage message={error} />
          <Button type="submit" variant="primary" className="w-full justify-center" disabled={submitting}>
            {submitting ? <><Spinner className="w-4 h-4 mr-2 inline" />Signing in…</> : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
