"use client"

import { useState, useEffect } from "react"
import { 
  Plus, Smile, Frown, Trash2, X, Calendar, ChevronLeft, ChevronRight, 
  ArrowLeft, MoreVertical, Target, MessageSquare, Wallet, ArrowUpRight, ArrowDownLeft, Scale 
} from "lucide-react"
import { supabase } from "@/lib/supabase" 
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [showInput, setShowInput] = useState(false) 
  const [inputCategory, setInputCategory] = useState<"trade" | "cashflow">("trade")
  const [showCalendar, setShowCalendar] = useState(false) 
  const [isLoaded, setIsLoaded] = useState(false) 
  const [targetProfit, setTargetProfit] = useState(100000)

  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedDateView, setSelectedDateView] = useState<string | null>(null)

  const [inputText, setInputText] = useState("")
  const [inputAmount, setInputAmount] = useState("")
  const [inputType, setInputType] = useState<"win" | "loss" | "deposit" | "withdraw">("win")
  const [inputNote, setInputNote] = useState("")
  const [inputEmotion, setInputEmotion] = useState("😎")

  const [riskAmount, setRiskAmount] = useState("")
  const [rewardAmount, setRewardAmount] = useState("")

  const emotions = ["😎", "🔥", "😰", "😡", "😴", "🧠"];

  useEffect(() => {
    const fetchTrades = async () => {
      const { data, error } = await supabase
        .from('trades_v3')
        .select('*');

      if (error) {
        console.error("Error fetching data:", error);
      } else if (data) {
        const sortedData = data.reverse();
        setTrades(sortedData as Trade[]);
      }

      const savedTarget = localStorage.getItem("target_v3")
      if (savedTarget) setTargetProfit(Number(savedTarget))
      
      setIsLoaded(true) 
    }

    fetchTrades();
  }, [])

  const calculatedRRR = () => {
    if (!riskAmount || !rewardAmount || Number(riskAmount) === 0) return null;
    const ratio = (Number(rewardAmount) / Number(riskAmount)).toFixed(1);
    return `1:${ratio}`;
  }

  const addTransaction = async () => {
    if (!inputText || !inputAmount) return

    const tradeDate = selectedDateView || new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
    
    const newEntry = {
      text: inputText,
      date: tradeDate,
      type: inputType,
      amount: Number(inputAmount),
      note: inputNote || null,
      emotion: inputCategory === "trade" ? inputEmotion : "💰",
      rrr: inputCategory === "trade" ? (calculatedRRR() || null) : null
    }

    const { data, error } = await supabase
      .from('trades_v3')
      .insert([newEntry])
      .select()

    if (error) {
      alert("Gagal menyimpan ke server! Error: " + error.message);
      return;
    }

    if (data) {
      setTrades([data[0] as Trade, ...trades]) 
      resetForm()
    }
  }

  const resetForm = () => {
    setInputText("");
    setInputAmount("");
    setInputNote("");
    setInputEmotion("😎");
    setRiskAmount(""); 
    setRewardAmount(""); 
    setShowInput(false);
  }

  const deleteTrade = async (id: string) => {
    const prevTrades = [...trades];
    setTrades(trades.filter(t => t.id !== id));

    const { error } = await supabase
      .from('trades_v3')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Gagal menghapus data di server: " + error.message);
      setTrades(prevTrades);
    }
  }

  const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
  const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))

  const realTodayDate = new Date()
  const todayString = realTodayDate.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const handleDayClick = (day: number) => {
    const dateStr = new Date(calYear, calMonth, day).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})
    setSelectedDateView(dateStr)
    setShowCalendar(false)
  }

  const totalDeposit = trades.filter(t => t.type === "deposit").reduce((s, t) => s + t.amount, 0)
  const totalWithdraw = trades.filter(t => t.type === "withdraw").reduce((s, t) => s + t.amount, 0)
  const netPnLGlobal = trades.reduce((sum, t) => {
    if (t.type === "win") return sum + t.amount
    if (t.type === "loss") return sum - t.amount
    return sum
  }, 0)
  const currentBalance = (totalDeposit - totalWithdraw) + netPnLGlobal

  const chartData = [...trades].reverse().reduce((acc: any[], trade) => {
    const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
    let newBalance = lastBalance;
    
    if (trade.type === 'win' || trade.type === 'deposit') newBalance += trade.amount;
    if (trade.type === 'loss' || trade.type === 'withdraw') newBalance -= trade.amount;

    const shortDate = trade.date.split(' ').slice(0, 2).join(' ');
    const existingDayIndex = acc.findIndex(item => item.fullDate === trade.date);
    
    if (existingDayIndex >= 0) {
      acc[existingDayIndex].balance = newBalance; 
    } else {
      acc.push({ shortDate, fullDate: trade.date, balance: newBalance });
    }
    return acc;
  }, []);

  // --- KOMPONEN MODAL INPUT (Dibuat agar bisa dipanggil di mana saja) ---
  const renderInputModal = () => {
    if (!showInput) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white p-6 rounded-t-[40px] w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          <div className="sticky top-0 bg-white pb-4 mb-2 flex justify-between items-center border-b border-slate-50 z-10 text-slate-800">
            <h3 className="font-black text-xl">{inputCategory === "trade" ? "Tambah Trade" : "Wallet Entry"}</h3>
            <button onClick={resetForm} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X size={20}/></button>
          </div>
          <div className="space-y-4 pt-2 text-slate-800">
            {inputCategory === "trade" && (
              <div className="flex gap-2 justify-center py-2">
                {emotions.map(e => (
                  <button key={e} onClick={() => setInputEmotion(e)} className={`text-2xl p-2 rounded-2xl transition-all ${inputEmotion === e ? 'bg-[#5468ff]' : 'bg-slate-50 grayscale opacity-50'}`}>{e}</button>
                ))}
              </div>
            )}
            <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={inputCategory === "trade" ? "Nama Aset (XAUUSD, BTC...)" : "Keterangan (Deposit...)"} className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none font-bold focus:ring-2 focus:ring-[#5468ff]" />
            <input type="number" value={inputAmount} onChange={(e) => setInputAmount(e.target.value)} placeholder="Nominal Rp" className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none font-bold focus:ring-2 focus:ring-[#5468ff]" />
            
            {inputCategory === "trade" && (
              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-2 mb-3 text-orange-600 font-black text-[10px] uppercase tracking-wider">
                  <Scale size={14}/> Risk Reward Calculator
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={riskAmount} onChange={(e) => setRiskAmount(e.target.value)} placeholder="Risk (SL Rp)" className="bg-white p-3 rounded-xl text-xs font-bold outline-none border border-orange-100" />
                  <input type="number" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} placeholder="Reward (TP Rp)" className="bg-white p-3 rounded-xl text-xs font-bold outline-none border border-orange-100" />
                </div>
                {calculatedRRR() && <p className="mt-3 text-center font-black text-orange-600 text-xs italic">POTENTIAL RR = {calculatedRRR()}</p>}
              </div>
            )}

            <textarea value={inputNote} onChange={(e) => setInputNote(e.target.value)} placeholder="Catatan Psikologi/Setup..." rows={2} className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none font-bold focus:ring-2 focus:ring-[#5468ff] resize-none" />

            <div className="flex gap-3">
              {inputCategory === "trade" ? (
                <>
                  <button onClick={() => setInputType("win")} className={`flex-1 py-4 rounded-2xl font-black transition-all ${inputType === "win" ? "bg-green-500 text-white shadow-lg shadow-green-200" : "bg-slate-100 text-slate-400"}`}>WIN</button>
                  <button onClick={() => setInputType("loss")} className={`flex-1 py-4 rounded-2xl font-black transition-all ${inputType === "loss" ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-slate-100 text-slate-400"}`}>LOSS</button>
                </>
              ) : (
                <>
                  <button onClick={() => setInputType("deposit")} className={`flex-1 py-4 rounded-2xl font-black transition-all ${inputType === "deposit" ? "bg-green-500 text-white shadow-lg shadow-green-200" : "bg-slate-100 text-slate-400"}`}>DEPOSIT</button>
                  <button onClick={() => setInputType("withdraw")} className={`flex-1 py-4 rounded-2xl font-black transition-all ${inputType === "withdraw" ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-slate-100 text-slate-400"}`}>WITHDRAW</button>
                </>
              )}
            </div>
            <button onClick={addTransaction} className="w-full bg-[#5468ff] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 mt-4 mb-6 transition-all active:scale-95">Konfirmasi</button>
          </div>
        </div>
      </div>
    );
  };

  // --- VIEW 1: DETAIL TANGGAL ---
  if (selectedDateView) {
    const dailyTrades = trades.filter(t => t.date === selectedDateView);
    const dailyWin = dailyTrades.filter(t => t.type === 'win').reduce((sum, t) => sum + t.amount, 0);
    const dailyLoss = dailyTrades.filter(t => t.type === 'loss').reduce((sum, t) => sum + t.amount, 0);
    const dailyPnL = dailyWin - dailyLoss;
    const progress = Math.min(( (dailyPnL > 0 ? dailyPnL : 0) / targetProfit) * 100, 100).toFixed(1);

    return (
      <div className="animate-in slide-in-from-right-8 duration-300 p-6 relative min-h-screen bg-[#f4f7fb] pb-32">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedDateView(null)} className="bg-white p-2 rounded-full shadow-sm text-slate-800">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-black text-slate-800">{selectedDateView}</h1>
          </div>
          <MoreVertical size={24} className="text-slate-400" />
        </div>

        <div className="bg-white rounded-[32px] p-6 mb-8 shadow-sm border border-slate-100">
          <p className="text-slate-400 font-bold text-[10px] uppercase mb-1">PNL Hari Ini</p>
          <h2 className={`text-3xl font-black mb-6 ${dailyPnL >= 0 ? 'text-[#5468ff]' : 'text-red-500'}`}>
            Rp {Math.abs(dailyPnL).toLocaleString('id-ID')}
          </h2>
          
          <div className="bg-blue-50/50 p-5 rounded-[24px] border border-blue-100">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[#5468ff] font-black text-sm">Target Harian</p>
              <p className="text-[10px] font-black text-[#5468ff]">{progress}%</p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div className="bg-[#5468ff] h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {dailyTrades.map((trade) => (
            <div key={trade.id} className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-50 relative group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{trade.type === 'deposit' || trade.type === 'withdraw' ? "💰" : (trade.emotion || "😎")}</span>
                  <div>
                    <p className="font-black text-slate-800">{trade.text}</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-[10px] font-black uppercase ${
                        trade.type === 'win' || trade.type === 'deposit' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {trade.type}
                      </p>
                      {trade.rrr && (
                        <span className="text-[9px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg font-black border border-orange-100">
                          RR {trade.rrr}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className={`font-black ${trade.type === 'win' || trade.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.type === 'win' || trade.type === 'deposit' ? '+' : '-'} {trade.amount.toLocaleString('id-ID')}
                  </p>
                  <button onClick={() => deleteTrade(trade.id)} className="text-slate-200 mt-2 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                </div>
              </div>
              {trade.note && (
                <div className="bg-slate-50 p-3 rounded-xl flex items-start gap-2 border border-slate-100/50 mt-1">
                  <MessageSquare size={12} className="text-slate-400 mt-1" />
                  <p className="text-xs text-slate-500 font-medium italic">{trade.note}</p>
                </div>
              )}
            </div>
          ))}
          {dailyTrades.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-black text-slate-400 text-sm">Belum ada trade di hari ini</p>
            </div>
          )}
        </div>

        {/* Modal dipanggil di sini juga */}
        {renderInputModal()}

        {!showInput && (
          <button onClick={() => { setInputCategory("trade"); setInputType("win"); setShowInput(true); }} className="fixed bottom-24 right-6 bg-[#5468ff] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl z-50 hover:scale-110 active:scale-95 transition-all">
            <Plus size={32} />
          </button>
        )}
      </div>
    )
  }

  // --- VIEW 2: HOME UTAMA ---
  const groupedTrades: Record<string, Trade[]> = trades.reduce((group: Record<string, Trade[]>, trade: Trade) => {
    const date = trade.date;
    if (!group[date]) {
      group[date] = [];
    }
    group[date].push(trade);
    return group;
  }, {});

  return (
    <div className="animate-in fade-in duration-300 p-6 relative min-h-screen bg-[#f4f7fb] pb-32">
      <div className="mb-6 flex justify-between items-end text-slate-800">
        <div>
          <h1 className="text-2xl font-black">Account</h1>
          <p className="text-slate-400 font-bold text-sm tracking-tight">{todayString}</p>
        </div>
        <div className="bg-white p-2 px-4 rounded-2xl shadow-sm border border-slate-100 text-right">
           <p className="text-[9px] font-black text-slate-400 uppercase">Broker Equity</p>
           <p className="text-sm font-black text-[#5468ff]">Rp {currentBalance.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="bg-[#5468ff] rounded-[32px] p-8 mb-6 shadow-xl shadow-blue-100 text-white relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10"><Wallet size={120} /></div>
        <p className="text-blue-100 font-bold text-xs uppercase mb-1">Total Balance</p>
        <h2 className="text-4xl font-black mb-6">Rp {currentBalance.toLocaleString('id-ID')}</h2>
        <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-6">
          <div>
            <p className="text-blue-200 text-[10px] font-black uppercase">Net Profit</p>
            <p className="font-bold text-sm">{netPnLGlobal >= 0 ? '+' : ''} {netPnLGlobal.toLocaleString('id-ID')}</p>
          </div>
          <div>
            <p className="text-blue-200 text-[10px] font-black uppercase">Withdrawals</p>
            <p className="font-bold text-sm">{totalWithdraw.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        <button onClick={() => { setInputCategory("cashflow"); setInputType("deposit"); setShowInput(true); }} className="flex-1 bg-green-500/10 text-green-600 p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-95"><ArrowUpRight size={18} /> DEPOSIT</button>
        <button onClick={() => { setInputCategory("cashflow"); setInputType("withdraw"); setShowInput(true); }} className="flex-1 bg-red-500/10 text-red-600 p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-95"><ArrowDownLeft size={18} /> WITHDRAW</button>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-[32px] p-6 mb-8 shadow-sm border border-slate-100 animate-in zoom-in-95">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-[#5468ff] rounded-xl"><Target size={18}/></div>
            <div>
              <p className="text-sm font-black text-slate-800">Equity Curve</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pertumbuhan Modal</p>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5468ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5468ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                <YAxis hide domain={['dataMin - 100000', 'dataMax + 100000']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontWeight: 900, color: '#1e293b' }}
                  itemStyle={{ color: '#5468ff' }}
                  formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Saldo']}
                  labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="balance" stroke="#5468ff" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <button onClick={() => setShowCalendar(!showCalendar)} className="w-full bg-white text-slate-800 rounded-[24px] p-5 mb-8 font-black flex justify-between items-center shadow-sm border border-slate-100">
        <div className="flex items-center gap-3"><Calendar size={20} className="text-[#5468ff]" /> Calendar View</div>
        <ChevronRight size={20} className={`text-slate-300 transition-transform duration-300 ${showCalendar ? 'rotate-90' : ''}`} />
      </button>

      {showCalendar && (
        <div className="bg-white p-6 rounded-[32px] shadow-sm mb-8 border border-slate-100 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="p-2 bg-slate-50 rounded-full"><ChevronLeft size={20} /></button>
            <div className="font-black text-slate-800">{calendarDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</div>
            <button onClick={nextMonth} className="p-2 bg-slate-50 rounded-full"><ChevronRight size={20} /></button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-slate-300 mb-4 uppercase">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-3 gap-x-2 text-center text-sm">
            {emptyDays.map((_, i) => <div key={i}></div>)}
            {daysArray.map(day => {
              const dStr = new Date(calYear, calMonth, day).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
              const dayTransactions = trades.filter(t => t.date === dStr);
              const hasTrades = dayTransactions.length > 0;
              const isToday = day === realTodayDate.getDate() && calMonth === realTodayDate.getMonth() && calYear === realTodayDate.getFullYear();
              
              const status = dayTransactions.some(t => t.type === 'win') ? 'bg-green-500' : 
                             dayTransactions.some(t => t.type === 'loss') ? 'bg-red-500' : 'bg-blue-400';

              return (
                <div key={day} onClick={() => handleDayClick(day)} className={`relative flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer transition-all ${isToday ? 'bg-[#5468ff] text-white font-black shadow-md' : 'hover:bg-blue-50 text-slate-700'}`}>
                  {day}
                  {hasTrades && <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isToday ? 'bg-white' : status}`}></div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {Object.keys(groupedTrades).map((date) => {
          const dailyTrades = groupedTrades[date];
          const pnl = dailyTrades.reduce((sum: number, t: Trade) => {
            if (t.type === 'win') return sum + t.amount;
            if (t.type === 'loss') return sum - t.amount;
            return sum;
          }, 0);

          return (
            <div key={date} onClick={() => setSelectedDateView(date)} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 cursor-pointer flex justify-between items-center group active:scale-95 transition-all">
              <div>
                <p className="text-slate-400 font-bold text-[10px] mb-1 uppercase tracking-wider">{date === todayString ? 'Today' : date}</p>
                <h3 className={`text-2xl font-black ${pnl >= 0 ? 'text-[#5468ff]' : 'text-red-500'}`}>
                  {pnl === 0 ? "Cashflow Record" : `Rp ${Math.abs(pnl).toLocaleString('id-ID')}`}
                </h3>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-[#5468ff] transition-colors" />
            </div>
          )
        })}
      </div>

      {/* Modal dipanggil di sini juga */}
      {renderInputModal()}

      {!showInput && (
        <div className="fixed bottom-24 right-6 z-50">
          <button onClick={() => { setInputCategory("trade"); setInputType("win"); setShowInput(true); }} className="bg-[#5468ff] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all">
            <Plus size={32} />
          </button>
        </div>
      )}
    </div>
  )
}