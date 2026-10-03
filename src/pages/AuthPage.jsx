import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return }
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signInWithEmail(form.email, form.password)
        toast.success('Welcome back! 👋')
      } else {
        await signUpWithEmail(form.email, form.password, form.name)
        toast.success('Check your email to confirm your account! 🎉')
      }
    } catch (err) {
      console.error('Auth error:', err)
      const msg = err.message || ''
      if (msg.includes('Database error') || msg.includes('relation') || msg.includes('does not exist')) {
        toast.error('⚠️ Database not set up yet. Run the SQL migrations in your Supabase dashboard first.', { duration: 6000 })
      } else if (msg.includes('Invalid login credentials')) {
        toast.error('Wrong email or password. Did you confirm your email?')
      } else if (msg.includes('Email not confirmed')) {
        toast.error('Please check your email and click the confirmation link first.')
      } else if (msg.includes('already registered')) {
        toast.error('This email is already registered. Try signing in instead.')
        setMode('signin')
      } else {
        toast.error(msg || 'Authentication failed. Check console for details.')
      }
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    try { await signInWithGoogle() }
    catch (err) { toast.error(err.message) }
  }

  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col items-center justify-center px-5 py-10">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-brand-gradient mx-auto flex items-center justify-center mb-4 shadow-glow animate-pulse-glow">
          <Sparkles size={36} className="text-white" />
        </div>
        <h1 className="text-3xl font-display font-black text-white mb-1">
          Fin<span className="text-gradient">Craft</span>
        </h1>
        <p className="text-white/50 text-sm">Personal Wealth & Expense Tracker</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm glass-card p-6">
        {/* Tab toggle */}
        <div className="flex bg-surface-700 rounded-xl p-1 mb-5">
          {['signin', 'signup'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
                mode === m ? 'bg-brand-gradient text-white shadow-sm' : 'text-white/50'
              }`}>
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="label-text">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input id="auth-name" type="text" placeholder="Your name" value={form.name}
                  onChange={e => update('name', e.target.value)} className="input-field pl-9" />
              </div>
            </div>
          )}

          <div>
            <label className="label-text">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input id="auth-email" type="email" placeholder="your@email.com" value={form.email}
                onChange={e => update('email', e.target.value)} className="input-field pl-9" required />
            </div>
          </div>

          <div>
            <label className="label-text">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input id="auth-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={e => update('password', e.target.value)}
                className="input-field pl-9 pr-10" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button id="btn-auth-submit" type="submit" disabled={loading}
            className={`w-full btn-primary mt-1 ${loading ? 'opacity-60' : ''}`}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">or continue with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google */}
        <button id="btn-google-auth" onClick={handleGoogle}
          className="w-full btn-secondary flex items-center justify-center gap-3 opacity-50 cursor-not-allowed"
          title="Google login requires OAuth setup in Supabase dashboard"
          disabled>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-md font-bold">SETUP NEEDED</span>
        </button>

        {/* Demo mode hint */}
        <p className="text-center text-xs text-white/30 mt-4">
          No account? The app works in{' '}
          <button onClick={() => toast.success('Running in demo mode! Data is local only.')}
            className="text-brand-400 underline-offset-2 underline">
            demo mode
          </button>{' '}
          without signup.
        </p>
      </div>
    </div>
  )
}
