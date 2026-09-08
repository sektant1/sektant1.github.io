import { Route, Routes } from "react-router"

import { DashboardScreen } from "@/features/dashboard/dashboard-screen"
import { RaidScreen } from "@/features/raid/raid-screen"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardScreen />} />
      <Route path="/raid" element={<RaidScreen />} />
    </Routes>
  )
}
