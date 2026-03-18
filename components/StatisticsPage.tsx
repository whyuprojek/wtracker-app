"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { ChevronDown, Calendar as CalendarIcon, Download, Upload, AlertCircle, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase" // Import Supabase

interface Trade {
  id: string;
  text: string;
  date: string;
  type: "win" | "loss" | "deposit" | "withdraw";
  amount: number;
  note?: string;
  emotion?: string;
  rrr?: string;
}

type FilterPeriod = "Today" | "This Month" | "Last Month" | "This Year" | "Custom";

export default function StatisticsPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("This Month")
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // State loading tambahan
  
  // State untuk Custom Filter
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // --- AMBIL DATA DARI SUPABASE ---
  const fetchTrades = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('trades_v3')
      .select('*');

    if (error) {
      console.error("Error fetching data:", error);
    } else if (data) {
      setTrades(data as Trade[]);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchTrades();
  }, [])

  const formatRp = (num: number) => {
    return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // --- FUNGSI BACKUP: EXPORT KE CSV ---
  const exportToCSV = () => {
    if (trades.length === 0) return alert("Tidak ada data untuk di-export");
    
    const headers = ["ID", "Aset", "Tanggal", "Tipe", "Nominal", "Catatan", "Emosi", "RRR"];
    
    const csvRows = trades.map(t => [
      t.id,
      t.text,
      t.date,
      t.type,
      t.amount,
      t.note || "-",
      t.emotion || "-",
      t.rrr || "-"
    ].map(value => {
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(","));

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WTracker_Backup_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // --- FUNGSI BACKUP: IMPORT LANGSUNG KE SUPABASE ---
  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split(/\r?\n/).slice(1);
        
        const importedTrades = rows
          .filter(row => row.trim() !== "")
          .map(row => {
            const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!matches) return null;
            const clean = matches.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
            
            // Format object baru untuk dimasukkan ke Supabase (tanpa ID agar dibuat otomatis)
            return {
              text: clean[1],
              date: clean[2],
              type: clean[3] as "win" | "loss" | "deposit" | "withdraw",
              amount: Number(clean[4]),
              note: clean[5] === "-" ? null : clean[5],
              emotion: clean[6] === "-" ? null : clean[6],
              rrr: clean[7] === "-" ? null : clean[7]
            };
          }).filter(t => t !== null);

        if (confirm(`Impor ${importedTrades.length} data? Data akan diunggah ke database awan (Supabase).`)) {
          setIsLoading(true);
          const { error } = await supabase
            .from('trades_v3')
            .insert(importedTrades);

          if (error) {
            alert("Gagal menyimpan ke server: " + error.message);
          } else {
            alert("Impor berhasil! Data telah tersimpan di cloud.");
            fetchTrades(); // Refresh data dari server setelah import
          }
          setIsLoading(false);
        }
      } catch (err) {
        alert("Gagal membaca file.");
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
    // Reset nilai input file agar bisa import file yang sama lagi jika perlu
    e.target.value = "";
  };

  // --- FUNGSI PEMBANTU LOGIKA TANGGAL ---
  const parseMyDate = (dateStr: string) => {
    const months: { [key: string]: number } = { 
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5, 
      'Jul': 6, 'Agt': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11 
    };
    const parts = dateStr.split(' ');
    if (parts.length < 3) return new Date(0);
    return new Date(parseInt(parts[2]), months[parts[1]], parseInt(parts[0]));
  };

  // --- PROSES FILTER DATA ---
  const filteredTrades = trades.filter(trade => {
    // Abaikan Deposit & Withdraw untuk Statistik Performa Trading Utama
    if (trade.type === 'deposit' || trade.type === 'withdraw') return false;

    const tDate = parseMyDate(trade.date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filterPeriod === "Today") {
      return tDate.getTime() === today.getTime();
    }
    if (filterPeriod === "This Month") {
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    }
    if (filterPeriod === "Last Month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return tDate.getMonth() === lastMonth.getMonth() && tDate.getFullYear() === lastMonth.getFullYear();
    }
    if (filterPeriod === "This Year") {
      return tDate.getFullYear() === now.getFullYear();
    }
    if (filterPeriod === "Custom" && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      return tDate >= start && tDate <= end;
    }
    return true; 
  });

  // --- VARIABEL STATISTIK ---
  const totalTrades = filteredTrades.length;
  const winTrades = filteredTrades.filter(t => t.type === 'win');
  const lossTrades = filteredTrades.filter(t => t.type === 'loss');
  const winCount = winTrades.length;
  const lossCount = lossTrades.length;
  const winRate = totalTrades === 0 ? 0 : ((winCount / totalTrades) * 100).toFixed(0);

  const totalWinAmount = winTrades.reduce((sum, t) => sum + t.amount, 0);
  const totalLossAmount = lossTrades.reduce((sum, t) => sum + t.amount, 0);
  const netPnL = totalWinAmount - totalLossAmount;

  const activeDaysCount = new Set(filteredTrades.map(t => t.date)).size;
  const dailyAverage = activeDaysCount > 0 ? (netPnL / activeDaysCount) : 0;
  
  const highestProfit = winTrades.length > 0 ? Math.max(...winTrades.map(t => t.amount)) : 0;
  const biggestLoss = lossTrades.length > 0 ? Math.max(...lossTrades.map(t => t.amount)) : 0;

  const chartData = [
    { name: "Win", value: winCount || (lossCount === 0 ? 1 : 0), color: "#4ade80" }, 
    { name: "Loss", value: lossCount || (winCount === 0 ? 1 : 0), color: "#f87171" }
  ];

  return (
    <div className="animate-in fade-in duration-300 p-6 relative min-h-screen bg-[#f4f7fb] pb-32 text-slate-800">
      
      {/* Header & Filter Dropdown */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold">Statistics</h1>
        <div className="flex items-center gap-3">
          <button onClick={fetchTrades} className={`p-2 bg-white rounded-full shadow-sm text-[#5468ff] active:scale-95 transition-all ${isLoading ? 'opacity-50' : ''}`}>
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 font-bold py-2"
            >
              {filterPeriod}
              <ChevronDown size={18} className={`text-[#5468ff] transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute right-0 mt-2 w-44 bg-[#eef2ff] rounded-2xl shadow-xl z-20 overflow-hidden border border-white animate-in zoom-in-95 duration-100">
                  {["Today", "This Month", "Last Month", "This Year", "Custom"].map((option) => (
                    <button
                      key={option}
                      onClick={() => { setFilterPeriod(option as FilterPeriod); setShowDropdown(false); }}
                      className={`w-full text-center py-3 text-sm font-bold transition-colors border-b border-white/50 last:border-0 ${
                        filterPeriod === option ? "text-[#5468ff] bg-white/50" : "text-slate-600 hover:bg-white/30"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Input Custom Date */}
      {filterPeriod === "Custom" && (
        <div className="bg-white p-4 rounded-3xl mb-4 shadow-sm border border-blue-100 flex gap-2 items-center animate-in slide-in-from-top-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-50 text-xs p-2 rounded-xl w-full border border-slate-100 outline-none" />
          <span className="text-slate-400 font-bold">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-50 text-xs p-2 rounded-xl w-full border border-slate-100 outline-none" />
        </div>
      )}

      {/* Card Donut & PNL */}
      <div className="bg-white rounded-[32px] p-6 mb-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="w-[110px] h-[110px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value" stroke="none">
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col items-end gap-3 text-right">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Profits</p>
            <p className="text-green-500 font-bold text-sm">+ {formatRp(totalWinAmount)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Losses</p>
            <p className="text-red-500 font-bold text-sm">- {formatRp(totalLossAmount)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Net PNL</p>
            <p className="font-black text-[#5468ff] text-lg">
              {netPnL < 0 ? '- ' : ''}Rp {formatRp(Math.abs(netPnL))}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Average PNL */}
      <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100 flex justify-between items-center">
        <p className="text-[#5468ff] font-bold text-sm italic">Daily Average PNL</p>
        <p className="text-[#5468ff] font-black italic">
          {dailyAverage < 0 ? '- ' : ''}Rp {formatRp(Math.abs(dailyAverage))}
        </p>
      </div>

      {/* Data Management Tools */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button onClick={exportToCSV} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
          <div className="bg-blue-50 p-2 rounded-xl text-[#5468ff]"><Download size={20}/></div>
          <span className="text-[11px] font-black text-slate-500 uppercase">Export CSV</span>
        </button>
        <label className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all cursor-pointer">
          <div className={`bg-green-50 p-2 rounded-xl text-green-500 ${isLoading ? "animate-pulse" : ""}`}><Upload size={20}/></div>
          <span className="text-[11px] font-black text-slate-500 uppercase">{isLoading ? "Mengunggah..." : "Import Data"}</span>
          <input type="file" accept=".csv" onChange={importCSV} className="hidden" disabled={isLoading} />
        </label>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: "Total Trades", value: totalTrades, color: "text-slate-800" },
          { label: "Win Rate", value: `${winRate}%`, color: "text-slate-800" },
          { label: "Win Trades", value: winCount, color: "text-green-500" },
          { label: "Loss Trades", value: lossCount, color: "text-red-500" }
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="text-slate-400 font-bold text-[11px] uppercase mb-1">{item.label}</p>
            <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Other Analytics */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-800 mb-5 text-lg uppercase tracking-tight">Other Analytics</h3>
        <div className="space-y-5">
          <AnalyticRow label="Active Days" value={activeDaysCount} />
          <AnalyticRow label="Highest Profit" value={`Rp ${formatRp(highestProfit)}`} valueColor="text-green-500" />
          <AnalyticRow label="Biggest Loss" value={`Rp ${formatRp(Math.abs(biggestLoss))}`} valueColor="text-red-400" />
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-3 items-start">
        <AlertCircle size={18} className="text-[#5468ff] mt-0.5" />
        <p className="text-[10px] font-bold text-[#5468ff] italic leading-relaxed">
          Info: Data sekarang sudah terhubung penuh ke Cloud Database (Supabase). Semua fitur Import/Export berfungsi secara online.
        </p>
      </div>
    </div>
  )
}

function AnalyticRow({ label, value, valueColor = "text-slate-800" }: any) {
  return (
    <div className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
      <p className="text-slate-500 text-sm font-bold uppercase">{label}</p>
      <p className={`font-black ${valueColor}`}>{value}</p>
    </div>
  )
}