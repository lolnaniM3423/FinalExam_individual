"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, CheckCircle2 } from "lucide-react"

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

interface AlertPanelProps {
  alerts: FireAlert[]
  responsesSent: number
  onSelectAlert: (alert: FireAlert) => void
  onResolveAlert: (alertId: string) => void
}

export default function AlertPanel({ alerts, responsesSent, onSelectAlert, onResolveAlert }: AlertPanelProps) {
  const activeAlerts = alerts.filter((a) => a.status === "active")
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved")

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <Card className="border border-border p-4 bg-card">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-bold text-foreground">Critical Assignments</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-background/50 rounded p-2">
            <p className="text-muted-foreground">Active</p>
            <p className="text-lg font-bold text-destructive">{activeAlerts.length}</p>
          </div>
          <div className="bg-background/50 rounded p-2">
            <p className="text-muted-foreground">Responses Sent</p>
            <p className="text-lg font-bold text-primary">{responsesSent}</p>
          </div>
        </div>
      </Card>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="border border-destructive/30 bg-destructive/5 flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-semibold text-destructive">Active Fire Alerts</h3>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 space-y-2">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-background/50 border border-destructive/30 rounded p-2 cursor-pointer hover:bg-background/80 transition-colors"
                  onClick={() => onSelectAlert(alert)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{alert.location}</p>
                      <p className="text-xs text-muted-foreground truncate">{alert.address}</p>
                    </div>
                    <div className="text-xs font-bold text-destructive whitespace-nowrap">
                      {(alert.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.timestamp.toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <Card className="border border-green-500/20 bg-green-500/5 flex-1 overflow-hidden flex flex-col max-h-[200px]">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-semibold text-green-500">Resolved ({resolvedAlerts.length})</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {resolvedAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="bg-background/30 rounded px-2 py-1 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{alert.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* No Alerts State */}
      {activeAlerts.length === 0 && resolvedAlerts.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">No alerts at this time</p>
            <p className="text-xs text-muted-foreground/60">Monitoring in progress...</p>
          </div>
        </div>
      )}
    </div>
  )
}
