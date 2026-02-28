"use client"

import { useState, useEffect } from "react"
import { 
  ChevronLeft, ChevronRight, Plus, ChevronRight as ArrowIcon, 
  X, Calendar as CalendarIcon, Target as TargetIcon, Percent, Wallet, RefreshCw 
} from "lucide-react"
import { supabase } from "@/lib/supabase" // Import Supabase

type TargetMode = "Daily" | "Weekly" | "Monthly";

interface Trade {
  id: string;
  text: string;
  date: string;
  type: "win" | "loss" | "deposit" | "withdraw";
  amount: number;
}

interface TargetData {
  id: string;
  type: TargetMode;
  dateLabel: string;
  amount: number;
  rawDate: string;
  isPercent: boolean; 
  percentValue?: number; 
}

export default function TargetPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [targets, setTargets] = useState<TargetData[]>([])
  const [activeTab, setActiveTab] = useState<TargetMode>("Daily")
  const [isLoading, setIsLoading] = useState(true)
  
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [showInputForm, setShowInputForm] = useState(false)
  const [selectedType, setSelectedType] = useState<TargetMode>("Daily")
  
  const [inputDate, setInputDate] = useState("")
  const [inputAmount, setInputAmount] = useState("")
  const [isPercentMode, setIsPercentMode] = useState(false)
  const [percentInput, setPercentInput] = useState("")

  // --- SINKRONISASI DATA ---
  const fetchTrades = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('trades_v3')
      .select('*');

    if (error) {
      console.error("Error fetching trades for target:", error);
    } else if (data) {
      setTrades(data as Trade[]);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    // 1. Ambil list Target dari Local Storage
    const savedTargets = localStorage.getItem("targets_v3")
    if (savedTargets) setTargets(JSON.parse(savedTargets))
    
    // 2. Ambil riwayat Trade dari Supabase (Cloud)
    fetchTrades();
  }, [])

  // --- HITUNG SALDO SAAT INI (EQUITY) DARI CLOUD ---
  const totalDeposit = trades.filter(t => t.type === "deposit").reduce((s, t) => s + t.amount, 0)
  const totalWithdraw = trades.filter(t => t.type === "withdraw").reduce((s, t) => s + t.amount, 0)
  const netPnLGlobal = trades.reduce((sum, t) => {
    if (t.type === "win") return sum + t.amount
    if (t.type === "loss") return sum - t.amount
    return sum
  }, 0)
  const currentBalance = (totalDeposit - totalWithdraw) + netPnLGlobal

  const saveToLocal = (newTargets: TargetData[]) => {
    setTargets(newTargets)
    localStorage.setItem("targets_v3", JSON.stringify(newTargets))
  }

  const handleSaveTarget = () => {
    if (!inputDate) return
    
    let finalAmount = Number(inputAmount)
    if (isPercentMode && percentInput) {
      finalAmount = (currentBalance * Number(percentInput)) / 100
    }

    if (finalAmount <= 0) return alert("Nominal target harus lebih dari 0")

    const dateObj = new Date(inputDate)
    let label = ""
    if (selectedType === "Daily") {
      label = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    } else if (selectedType === "Monthly") {
      label = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    } else {
      label = `Minggu ke-${Math.ceil(dateObj.getDate() / 7)} ${dateObj.toLocaleDateString('id-ID', { month: 'short' })}`
    }

    const newTarget: TargetData = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2), // <--- SOLUSI AMAN
      type: selectedType,
      dateLabel: label,
      amount: finalAmount,
      rawDate: inputDate,
      isPercent: isPercentMode,
      percentValue: isPercentMode ? Number(percentInput) : undefined
    }

    saveToLocal([newTarget, ...targets])
    setShowInputForm(false)
    setInputAmount("")
    setPercentInput("")
    setInputDate("")
  }

  const calculateProgress = (target: TargetData) => {
    const targetDateObj = new Date(target.rawDate);
    targetDateObj.setHours(0, 0, 0, 0);

    const filteredTrades = trades.filter(trade => {
      const months: any = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5, 'Jul': 6, 'Agt': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11 };
      const parts = trade.date.split(' ');
      if (parts.length < 3) return false;
      const tradeDateObj = new Date(parseInt(parts[2]), months[parts[1]], parseInt(parts[0]));
      tradeDateObj.setHours(0, 0, 0, 0);

      if (target.type === "Daily") return tradeDateObj.getTime() === targetDateObj.getTime();
      if (target.type === "Monthly") return tradeDateObj.getMonth() === targetDateObj.getMonth() && tradeDateObj.getFullYear() === targetDateObj.getFullYear();
      if (target.type === "Weekly") {
        const diffDays = Math.round((tradeDateObj.getTime() - targetDateObj.getTime()) / (24 * 60 * 60 * 1000));
        return diffDays >= 0 && diffDays <= 7;
      }
      return false;
    });

    const totalPnL = filteredTrades.reduce((sum, t) => t.type === 'win' ? sum + t.amount : (t.type === 'loss' ? sum - t.amount : sum), 0);
    const progressAmount = totalPnL > 0 ? totalPnL : 0;
    const percentage = Math.min((progressAmount / target.amount) * 100, 100);
    
    return { progressAmount, percentage, totalPnL };
  }

  return (
    <div className="animate-in fade-in duration-300 p-6 relative min-h-screen bg-[#f4f7fb] pb-32 text-slate-800">
      
      {/* Saldo Info Bar */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black">Targets</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Management</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchTrades} className={`p-2 bg-white rounded-full shadow-sm text-[#5468ff] active:scale-95 transition-all ${isLoading ? 'opacity-50' : ''}`}>
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="bg-blue-50 p-1.5 rounded-lg text-[#5468ff]"><Wallet size={16}/></div>
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase">Equity</p>
              <p className="text-xs font-black text-[#5468ff]">
                {isLoading ? "Menghitung..." : `Rp ${currentBalance.toLocaleString('id-ID')}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-slate-200/50 p-1 rounded-2xl flex mb-8">
        {(["Daily", "Weekly", "Monthly"] as TargetMode[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${activeTab === tab ? "bg-[#5468ff] text-white shadow-lg" : "text-slate-400"}`}>{tab}</button>
        ))}
      </div>

      {/* List Target */}
      <div className="space-y-4">
        {targets.filter(t => t.type === activeTab).map((item) => {
          const { progressAmount, percentage, totalPnL } = calculateProgress(item);
          return (
            <div key={item.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 animate-in zoom-in-95">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-black text-slate-800">{item.dateLabel}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    {item.isPercent ? `Target: ${item.percentValue}% of Balance` : "Custom Amount"}
                  </p>
                </div>
                <button onClick={() => saveToLocal(targets.filter(t => t.id !== item.id))} className="text-slate-200 hover:text-red-500 transition-colors"><X size={18}/></button>
              </div>
              
              <div className="w-full bg-slate-100 h-2.5 rounded-full mb-3 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${percentage >= 100 ? 'bg-green-500' : 'bg-[#5468ff]'}`} style={{ width: `${percentage}%` }} />
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-slate-300 uppercase">Current PnL</p>
                  <p className={`text-xs font-black ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>Rp {totalPnL.toLocaleString('id-ID')}</p>
                </div>
                <p className="text-sm font-black text-slate-800">
                  {progressAmount.toLocaleString('id-ID')} <span className="text-slate-300 font-normal">/ Rp {item.amount.toLocaleString('id-ID')}</span>
                </p>
              </div>
            </div>
          )
        })}
        {targets.filter(t => t.type === activeTab).length === 0 && (
           <div className="text-center py-10 opacity-50">
             <TargetIcon size={40} className="mx-auto text-slate-300 mb-3" />
             <p className="font-black text-slate-400 text-sm">Belum ada target di tab ini</p>
           </div>
        )}
      </div>

      <button onClick={() => setShowTypeSelector(true)} className="fixed bottom-24 right-6 bg-[#5468ff] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all z-40">
        <Plus size={32} />
      </button>

      {/* MODAL INPUT */}
      {showInputForm && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setShowInputForm(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[101] animate-in slide-in-from-bottom-full max-w-md mx-auto max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-white z-10 pb-2">
                <h2 className="text-2xl font-black">Set {selectedType} Target</h2>
                <button onClick={() => setShowInputForm(false)} className="bg-slate-100 p-2 rounded-full text-slate-500"><X size={20}/></button>
            </div>

            <div className="space-y-6 mb-8">
              <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="w-full bg-slate-50 border p-5 rounded-[24px] font-bold outline-none focus:ring-2 focus:ring-[#5468ff]" />
              
              <div className="bg-slate-50 p-2 rounded-2xl flex gap-1">
                <button onClick={() => setIsPercentMode(false)} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${!isPercentMode ? "bg-white shadow-sm text-[#5468ff]" : "text-slate-400"}`}>NOMINAL</button>
                <button onClick={() => setIsPercentMode(true)} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${isPercentMode ? "bg-white shadow-sm text-[#5468ff]" : "text-slate-400"}`}>PERSENTASE (%)</button>
              </div>

              {isPercentMode ? (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Percent size={20}/></div>
                  <input type="number" placeholder="Berapa % dari saldo?" value={percentInput} onChange={(e) => setPercentInput(e.target.value)} className="w-full bg-slate-50 border p-5 pl-12 rounded-[24px] font-bold outline-none focus:ring-2 focus:ring-[#5468ff]" />
                  {percentInput && <p className="mt-2 ml-4 text-[10px] font-black text-slate-400">ESTIMASI: Rp {((currentBalance * Number(percentInput)) / 100).toLocaleString('id-ID')}</p>}
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><TargetIcon size={20}/></div>
                  <input type="number" placeholder="Nominal Target (Rp)" value={inputAmount} onChange={(e) => setInputAmount(e.target.value)} className="w-full bg-slate-50 border p-5 pl-12 rounded-[24px] font-bold outline-none focus:ring-2 focus:ring-[#5468ff]" />
                </div>
              )}
            </div>

            <button onClick={handleSaveTarget} className="w-full bg-[#5468ff] text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-blue-100 mb-6 active:scale-95 transition-all">Simpan Target</button>
          </div>
        </>
      )}

      {/* MODAL TYPE SELECTOR */}
      {showTypeSelector && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setShowTypeSelector(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[101] animate-in slide-in-from-bottom-full max-w-md mx-auto">
            <h2 className="text-2xl font-black text-slate-800 mb-8">Pilih Jangka Waktu</h2>
            <div className="space-y-3">
              {["Daily", "Weekly", "Monthly"].map((type) => (
                <button key={type} onClick={() => { setSelectedType(type as TargetMode); setShowTypeSelector(false); setShowInputForm(true); }} className="w-full flex justify-between items-center bg-[#f8faff] p-6 rounded-[24px] group">
                  <span className="font-bold text-[#5468ff] text-lg">{type} Target</span>
                  <ArrowIcon size={24} className="text-[#5468ff]" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}