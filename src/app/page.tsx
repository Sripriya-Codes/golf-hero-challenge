 'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function GolfHero() {
  const [score, setScore] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [winner, setWinner] = useState<any>(null)
  
  const [charity, setCharity] = useState('UNICEF')
  const [charityPercent, setCharityPercent] = useState(10)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    fetchScores()
  }, [])

  async function fetchScores() {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.error("Fetch Error:", error.message)
    if (data) setHistory(data)
  }

  const calculateLifetime = () => {
    const monthsActive = new Set(history.map(item => {
      const d = new Date(item.created_at);
      return `${d.getMonth()}-${d.getFullYear()}`;
    })).size || 1;

    const monthlyAmount = 20 * (charityPercent / 100);
    return (monthsActive * monthlyAmount).toFixed(2);
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  async function submitScore(e: React.FormEvent) {
    e.preventDefault()
    if (!score) return
    const scoreInt = parseInt(score)
    if (scoreInt < 1 || scoreInt > 45) {
      alert("Invalid Score: Stableford format requires a score between 1 and 45.")
      return
    }
    const today = new Date().toDateString()
    const hasEntryToday = history.some(item => 
      new Date(item.created_at).toDateString() === today
    )
    if (hasEntryToday) {
      alert("Only one score entry is permitted per date. Please delete today's entry if you need to correct it.");
      return
    }

    setLoading(true)
    try {
      if (history.length >= 5) {
        const oldestScore = history[history.length - 1]
        await supabase.from('scores').delete().eq('id', oldestScore.id)
      }
      const { error } = await supabase.from('scores').insert([
        { score_value: scoreInt, charity_name: charity }
      ])
      if (error) {
        alert("Error saving score: " + error.message)
      } else {
        setScore('')
        setShowToast(true) 
        setTimeout(() => setShowToast(false), 3000) 
        await fetchScores()
      }
    } catch (err) {
      console.error("Submission error:", err)
    } finally {
      setLoading(false)
    }
  }

  function pickWinner() {
    if (history.length === 0) return
    const randomIndex = Math.floor(Math.random() * history.length)
    setWinner(history[randomIndex])
  }

  
  async function deleteScore(id: string) {
    const { error } = await supabase.from('scores').delete().eq('id', id)
    if (error) {
      alert("Error deleting: " + error.message)
    } else {
      await fetchScores()
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 font-sans relative">
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-bounce border-2 border-blue-400 font-bold">
          ✅ Score Saved Successfully!
        </div>
      )}

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 items-start justify-center">
        <div className="max-w-md w-full space-y-6">
          <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-black text-blue-600 tracking-tighter">GOLF HERO</h1>
              <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-bold">Subscription Status: ACTIVE</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500 font-medium">Subscription Charity %:</span>
                <span className="font-bold text-blue-600">{charityPercent}%</span>
              </div>
              <input
                type="range" min="10" max="100"
                value={charityPercent}
                onChange={(e) => setCharityPercent(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[10px] text-slate-400 italic">
                Monthly impact: ${(20 * (charityPercent/100)).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
            <form onSubmit={submitScore} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Gross Score</label>
                  <input
                    type="number" value={score} onChange={(e) => setScore(e.target.value)}
                    placeholder="72"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl focus:border-blue-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Charity</label>
                  <select
                    value={charity} onChange={(e) => setCharity(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl font-bold text-sm"
                  >
                    <option value="UNICEF">UNICEF 🌍</option>
                    <option value="Red Cross">Red Cross 🏥</option>
                    <option value="Save the Children">Save the Children 🧸</option>
                  </select>
                </div>
              </div>
              <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                SUBMIT SCORE
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <button
              onClick={pickWinner}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-3 rounded-2xl transition-all shadow-md mb-6 flex items-center justify-center gap-2 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1"
            >
              <span>🏆</span> PICK LUCKY WINNER <span>🏆</span>
            </button>
            
            {winner && (
              <div className="text-center mb-8 p-4 bg-yellow-50 rounded-2xl border-2 border-yellow-200 animate-pulse">
                <p className="text-xs font-bold text-yellow-700 uppercase">Current Winner</p>
                <p className="text-4xl font-black text-yellow-900">{winner.score_value}</p>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Rolling 5 History</h3>
              {history.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-2xl font-black text-slate-800">{item.score_value}</span>
                      <p className="text-[9px] font-bold text-blue-500 uppercase">{item.charity_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">
                      {formatTime(item.created_at)}
                    </span>
                    <button 
                      onClick={() => deleteScore(item.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      title="Delete entry"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full md:w-64 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-2xl sticky top-6">
          <div className="mb-8">
            <h2 className="text-xl font-black">LIFETIME IMPACT</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Total Contributed</p>
              <p className="text-4xl font-black tracking-tighter">${calculateLifetime()}</p>
            </div>
            <div className="pt-4 border-t border-blue-400/30">
              <p className="text-[10px] font-medium opacity-80 leading-relaxed italic">
                "Small contributions over time create waves of change. Thank you for your continued support."
              </p>
            </div>
            <div className="bg-blue-900/30 p-3 rounded-xl border border-blue-400/20">
               <p className="text-[10px] font-bold uppercase opacity-60">Impact Level</p>
               <p className="text-sm font-bold">Champion Donor 🎖️</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}