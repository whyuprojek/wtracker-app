"use client"

import { useState } from "react"
import Navbar from "../components/Navbar"
import TradesPage from "../components/TradesPage"
import TargetPage from "../components/TargetPage"
import StatisticsPage from "../components/StatisticsPage"
import SettingsPage from "../components/SettingsPage"

export default function AppContainer() {
  const [activeTab, setActiveTab] = useState<"trades" | "target" | "statistics" | "settings">("trades")

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-800 font-sans pb-28">
      {/* Area Konten */}
      <div className="max-w-md mx-auto">
        {activeTab === "trades" && <TradesPage />}
        {activeTab === "target" && <TargetPage />}
        {activeTab === "statistics" && <StatisticsPage />}
        {activeTab === "settings" && <SettingsPage />}
      </div>

      {/* Navbar melayang di bawah */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  )
}