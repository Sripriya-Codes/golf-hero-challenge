'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [allScores, setAllScores] = useState<any[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, totalPool: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchAdminData()
      setLoading(false)
    })
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      alert("Login failed: " + error.message)
    } else {
      setSession(data.session)
      fetchAdminData()
    }
  }

  async function fetchAdminData() {
    const { data } = await supabase.from('scores').select('*')
    if (data) {
      setAllScores(data)
      setStats({
        totalUsers: new Set(data.map(s => s.id)).size,
        totalPool: data.length * 20 * 0.4 // 40% of sub fee to prize pool
      })
    }
  }

  const runDraw = () => {
    if (allScores.length === 0) return alert("No scores to draw from!")
    const winner = allScores[Math.floor(Math.random() * allScores.length)]
    alert(`🏆 DRAW RESULT: Score ID ${winner.id} (Value: ${winner.score_value}) is the winner!`)
  }

  if (loading) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>

  // --- LOGIN UI (The Gatekeeper) ---
  if (!session) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-8 text-white">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
          <h1 className="text-2xl font-black mb-6 text-center">ADMIN ACCESS</h1>
          <div className="space-y-4">
            <input 
              type="email" placeholder="Admin Email" 
              className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" placeholder="Password" 
              className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded-lg font-bold transition-all">
              Login to Dashboard
            </button>
          </div>
        </form>
      </main>
    )
  }

  // --- ADMIN UI (The Dashboard) ---
  return (
    <main className="min-h-screen bg-slate-900 p-8 text-white font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-slate-700 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">ADMIN CONTROL</h1>
            <button 
              onClick={() => supabase.auth.signOut().then(() => setSession(null))} 
              className="text-[10px] uppercase font-bold text-slate-500 hover:text-white mt-2"
            >
              Sign Out Account
            </button>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Prize Pool</p>
              <p className="text-xl font-black text-green-400">${stats.totalPool.toFixed(2)}</p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
            <h2 className="text-sm font-bold mb-4 text-blue-400 uppercase">Draw Management</h2>
            <p className="text-xs text-slate-400 mb-6">Execute the monthly prize draw based on current subscriber scores.</p>
            <button onClick={runDraw} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition-all">
              RUN MONTHLY DRAW
            </button>
          </div>

          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
            <h2 className="text-sm font-bold mb-4 text-blue-400 uppercase">System Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Active Subscribers:</span>
                <span className="font-bold">1</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Charity Total:</span>
                <span className="font-bold text-pink-400">${(allScores.length * 2).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-sm font-bold uppercase text-slate-400">Score Management (All Users)</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-700/50 text-slate-400">
              <tr>
                <th className="p-4">Score</th>
                <th className="p-4">Charity</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {allScores.map(s => (
                <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-4 font-bold">{s.score_value}</td>
                  <td className="p-4">{s.charity_name}</td>
                  <td className="p-4 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  )
}