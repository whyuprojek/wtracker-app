"use client"

import { useState, useEffect } from "react"
import { 
  User, 
  Target, 
  Trash2, 
  ShieldCheck, 
  Info, 
  ChevronRight, 
  Save,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { supabase } from "@/lib/supabase" // Import Supabase

export default function SettingsPage() {
  const [userName, setUserName] = useState("Trader Utama")
  const [dailyTarget, setDailyTarget] = useState(100000)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [saveStatus, setSaveStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false) // State loading saat menghapus data

  useEffect(() => {
    const savedName = localStorage.getItem("user_name_v3")
    if (savedName) setUserName(savedName)
    
    const savedTarget = localStorage.getItem("target_v3")
    if (savedTarget) setDailyTarget(Number(savedTarget))
  }, [])

  const handleSave = () => {
    localStorage.setItem("user_name_v3", userName)
    localStorage.setItem("target_v3", dailyTarget.toString())
    setSaveStatus(true)
    setTimeout(() => setSaveStatus(false), 2000)
  }

  // --- FUNGSI HAPUS DATA TOTAL (LOKAL & CLOUD) ---
  const resetAllData = async () => {
    setIsDeleting(true)

    // 1. Eksekusi Hapus di Supabase (Awan)
    // Logika .not('id', 'is', null) akan memilih dan menghapus SEMUA baris di tabel
    const { error } = await supabase
      .from('trades_v3')
      .delete()
      .not('id', 'is', null)

    if (error) {
      alert("Gagal menghapus data di server cloud! Error: " + error.message)
      setIsDeleting(false)
      return
    }

    // 2. Eksekusi Hapus di Local Storage (HP/Browser)
    localStorage.clear()
    
    // 3. Muat Ulang Halaman
    window.location.reload()
  }

  return (
    <div className="animate-in fade-in duration-300 p-6 relative min-h-screen bg-[#f4f7fb] pb-32 text-slate-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-slate-800">Settings</h1>
        {saveStatus && (
          <span className="bg-green-100 text-green-600 text-[10px] font-black px-3 py-1 rounded-full animate-bounce">
            SAVED!
          </span>
        )}
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-[#5468ff] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <User size={32} />
          </div>
          <div>
            <h2 className="font-black text-lg">Trading Profile</h2>
            <p className="text-xs font-bold text-slate-400">Manage your identity</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Display Name</label>
            <input 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none font-bold text-slate-700 focus:ring-2 focus:ring-[#5468ff] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Global Preferences */}
      <div className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-slate-100">
        <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-6 ml-1">Preferences</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-[#5468ff] rounded-xl"><Target size={20}/></div>
              <div>
                <p className="text-sm font-black">Daily Profit Target</p>
                <p className="text-[10px] font-bold text-slate-400">Used for progress bars</p>
              </div>
            </div>
            <input 
              type="number"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(Number(e.target.value))}
              className="w-24 bg-slate-50 p-2 rounded-xl text-right font-black text-[#5468ff] outline-none"
            />
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-500 rounded-xl"><ShieldCheck size={20}/></div>
              <div>
                <p className="text-sm font-black">Biometric Lock</p>
                <p className="text-[10px] font-bold text-slate-400">Pro feature (Coming soon)</p>
              </div>
            </div>
            <div className="w-10 h-5 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-[32px] p-6 mb-8 shadow-sm border border-slate-100">
        <h3 className="font-black text-sm uppercase tracking-widest text-red-400 mb-6 ml-1">Danger Zone</h3>
        <button 
          onClick={() => setShowResetConfirm(true)}
          className="w-full flex items-center justify-between p-4 bg-red-50 rounded-2xl text-red-500 group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <Trash2 size={20} />
            <span className="text-sm font-black">Clear All Data</span>
          </div>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Save Button */}
      <button 
        onClick={handleSave}
        className="w-full bg-[#5468ff] text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <Save size={20} />
        Save Settings
      </button>

      {/* App Info */}
      <div className="mt-8 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-300 mb-1">
          <Info size={14} />
          <p className="text-[10px] font-bold uppercase tracking-widest">WTracker - v3.0.1 (Cloud Sync)</p>
        </div>
        <p className="text-[9px] text-slate-300 font-medium italic">Connected securely to Supabase Database</p>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in">
          <div className="bg-white p-8 rounded-[40px] w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Are you sure?</h3>
            <p className="text-sm font-bold text-slate-400 mb-8">This will permanently delete ALL data from Local Storage and the Cloud Database. This action cannot be undone.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={resetAllData}
                disabled={isDeleting}
                className={`w-full text-white py-4 rounded-2xl font-black shadow-lg shadow-red-100 flex items-center justify-center gap-2 ${isDeleting ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500'}`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Deleting from Cloud...
                  </>
                ) : (
                  "Yes, Delete Everything"
                )}
              </button>
              <button 
                onClick={() => setShowResetConfirm(false)}
                disabled={isDeleting}
                className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}