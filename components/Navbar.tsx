"use client"

import { Home, Target, LayoutGrid, Settings as SettingsIcon } from "lucide-react"

interface NavbarProps {
  activeTab: "trades" | "target" | "statistics" | "settings";
  setActiveTab: (tab: "trades" | "target" | "statistics" | "settings") => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.03)] max-w-md mx-auto">
      <NavButton active={activeTab === "trades"} onClick={() => setActiveTab("trades")} label="TRADES" icon={<Home size={24} />} />
      <NavButton active={activeTab === "target"} onClick={() => setActiveTab("target")} label="TARGET" icon={<Target size={24} />} />
      <NavButton active={activeTab === "statistics"} onClick={() => setActiveTab("statistics")} label="STATISTICS" icon={<LayoutGrid size={24} />} />
      <NavButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} label="SETTINGS" icon={<SettingsIcon size={24} />} />
    </div>
  )
}

function NavButton({ active, onClick, label, icon }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? "text-[#5468ff]" : "text-slate-400"}`}>
      <div className={`${active ? "scale-110" : "scale-100"} transition-transform`}>{icon}</div>
      <span className="text-[10px] font-bold tracking-wider">{label}</span>
    </button>
  )
}