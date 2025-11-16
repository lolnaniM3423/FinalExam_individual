"use client"

import { Card } from "@/components/ui/card"
import MapVisualization from "./map-visualization"
import StatisticsPanel from "./statistics-panel"

interface FireAlert {
  id: string
  location: string
  address: string
  timestamp: Date
  confidence: number
  coordinates: [number, number]
  cameraId: string
  status: "active" | "resolved"
}

interface SimulatedCamera {
  id: string
  name: string
  location: string
  coordinates: [number, number]
  status: "normal" | "fire"
  confidence: number
  imageUrl: string
  fireEventTimes: number[]
}

interface DashboardProps {
  cameras: SimulatedCamera[]
  alerts: FireAlert[]
  selectedAlert: FireAlert | null
  onSelectAlert: (alert: FireAlert | null) => void
  mapImageUrl?: string
  simulationTime: number
}

export default function Dashboard({
  cameras,
  alerts,
  selectedAlert,
  onSelectAlert,
  mapImageUrl,
  simulationTime,
}: DashboardProps) {
  const activeAlerts = alerts.filter((a) => a.status === "active").length
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved").length

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header with simulation timer */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">City Fire Detection</h1>
            <p className="text-muted-foreground text-sm">AI-Powered Real-Time Monitoring System</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Simulation Time</p>
            <p className="text-lg font-mono font-bold text-foreground">{(simulationTime / 1000).toFixed(0)}s</p>
          </div>
        </div>
      </div>

      <StatisticsPanel totalCameras={cameras.length} activeAlerts={activeAlerts} resolvedAlerts={resolvedAlerts} />

      <Card className="flex-1 border border-border overflow-hidden min-h-0 h-full">
        <MapVisualization
          cameras={cameras}
          alerts={alerts}
          selectedAlert={selectedAlert}
          onSelectAlert={onSelectAlert}
          mapImageUrl={mapImageUrl}
        />
      </Card>
    </div>
  )
}
