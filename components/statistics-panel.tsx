"use client"

import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface StatisticsPanelProps {
  totalCameras: number
  activeAlerts: number
  resolvedAlerts: number
}

export default function StatisticsPanel({ totalCameras, activeAlerts, resolvedAlerts }: StatisticsPanelProps) {
  const chartData = [
    { name: "Active", value: activeAlerts, fill: "#ef4444" },
    { name: "Resolved", value: resolvedAlerts, fill: "#22c55e" },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Total Cameras */}
      <Card className="border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Total Cameras</p>
        <p className="text-2xl font-bold text-foreground mt-1">{totalCameras}</p>
      </Card>

      {/* Active Alerts */}
      <Card className="border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-xs text-muted-foreground">Active Alerts</p>
        <p className="text-2xl font-bold text-destructive mt-1">{activeAlerts}</p>
      </Card>

      {/* Resolved Alerts */}
      <Card className="border border-green-500/20 bg-green-500/5 p-4">
        <p className="text-xs text-muted-foreground">Resolved Alerts</p>
        <p className="text-2xl font-bold text-green-500 mt-1">{resolvedAlerts}</p>
      </Card>
    </div>
  )
}

