"use client"

import { useState, useEffect } from "react"
import Dashboard from "@/components/dashboard"
import AlertPanel from "@/components/alert-panel"
import VideoViewer from "@/components/video-viewer"

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

// *** CORRECTION 1: Renamed videoUrl to imageUrl in the interface ***
interface SimulatedCamera {
  id: string
  name: string
  location: string
  coordinates: [number, number]
  status: "normal" | "fire"
  confidence: number
  imageUrl: string // <--- CORRECTED
  fireEventTimes: number[] // milliseconds from simulation start
}

export default function Home() {
  const [alerts, setAlerts] = useState<FireAlert[]>([])
  const [cameras, setCameras] = useState<SimulatedCamera[]>([])
  const [selectedAlert, setSelectedAlert] = useState<FireAlert | null>(null)
  const [responsesSent, setResponsesSent] = useState(0)
  const [mapImageUrl] = useState("/nyc-map.png")
  const [simulationTime, setSimulationTime] = useState(0)

  // Initialize simulation data with video feeds and scheduled events
  useEffect(() => {
    const initialCameras: SimulatedCamera[] = [
      {
        id: "cam-1",
        name: "Smart City",
        location: "Binan City",
        coordinates: [40.7505, -73.9737],
        status: "normal",
        confidence: 0,
        // *** CORRECTION 2: Renamed videoUrl to imageUrl AND used the correct filename ***
        imageUrl: "/city-street-downtown.png", 
        fireEventTimes: [15000, 45000],
      },
      {
        id: "cam-2",
        name: "Smart City",
        location: "Binan City",
        coordinates: [40.745, -73.968],
        status: "normal",
        confidence: 0,
        // *** CORRECTION 2: Renamed videoUrl to imageUrl AND used the correct filename ***
        imageUrl: "/warehouse-industrial-area.png",
        fireEventTimes: [25000, 55000],
      },
      {
        id: "cam-3",
        name: "Smart City",
        location: "Binan City",
        coordinates: [40.758, -73.9855],
        status: "normal",
        confidence: 0,
        // *** CORRECTION 2: Renamed videoUrl to imageUrl AND used the correct filename ***
        imageUrl: "/residential-street.png",
        fireEventTimes: [35000, 65000],
      },
      {
        id: "cam-4",
        name: "Smart City",
        location: "Binan City",
        coordinates: [40.7614, -73.9776],
        status: "normal",
        confidence: 0,
        // *** CORRECTION 2: Renamed videoUrl to imageUrl AND used the correct filename ***
        imageUrl: "/park-urban.png",
        fireEventTimes: [20000, 50000],
      },
      {
        id: "cam-5",
        name: "Smart City",
        location: "Binan City",
        coordinates: [40.73, -74.006],
        status: "normal",
        confidence: 0,
        // *** CORRECTION 2: Renamed videoUrl to imageUrl. Using harbor-waterfront.jpg based on file list (and assuming no "-night-camera" suffix) ***
        imageUrl: "/harbor-waterfront.png", 
        fireEventTimes: [40000, 70000],
      },
    ]
    setCameras(initialCameras)
  }, [])

  // Simulation clock for scheduled fire events
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulationTime((prev) => prev + 1000)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    cameras.forEach((camera) => {
      const isFireTimeWindow = camera.fireEventTimes.some((fireTime) => Math.abs(simulationTime - fireTime) < 1500)

      if (isFireTimeWindow && camera.status === "normal") {
        const confidence = 0.8 + Math.random() * 0.2
        const hasExistingAlert = alerts.some((a) => a.cameraId === camera.id && a.status === "active")

        if (!hasExistingAlert) {
          setCameras((prev) => prev.map((c) => (c.id === camera.id ? { ...c, status: "fire", confidence } : c)))

          const newAlert: FireAlert = {
            id: Date.now().toString() + camera.id,
            location: camera.name,
            address: camera.location,
            timestamp: new Date(),
            confidence,
            coordinates: camera.coordinates,
            cameraId: camera.id,
            status: "active",
          }
          setAlerts((prev) => [newAlert, ...prev])
        }
      }
    })
  }, [simulationTime, cameras, alerts])

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, status: "resolved" } : alert)))
    setCameras((prev) =>
      prev.map((camera) => (camera.status === "fire" ? { ...camera, status: "normal", confidence: 0 } : camera)),
    )
    setSelectedAlert(null)
  }

  const handleRequestResponse = (alert: FireAlert) => {
    setResponsesSent((prev) => prev + 1)
    handleResolveAlert(alert.id)
  }

  const getSelectedCamera = () => {
    if (!selectedAlert) return null
    return cameras.find((c) => c.id === selectedAlert.cameraId)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-screen">
        <div className="lg:col-span-2">
          <Dashboard
            cameras={cameras}
            alerts={alerts}
            selectedAlert={selectedAlert}
            onSelectAlert={setSelectedAlert}
            mapImageUrl={mapImageUrl}
            simulationTime={simulationTime}
          />
        </div>

        <div className="flex flex-col gap-4">
          {selectedAlert ? (
            <VideoViewer
              alert={selectedAlert}
              camera={getSelectedCamera()}
              onClose={() => setSelectedAlert(null)}
              onRequestResponse={() => handleRequestResponse(selectedAlert)}
            />
          ) : (
            <AlertPanel
              alerts={alerts}
              responsesSent={responsesSent}
              onSelectAlert={setSelectedAlert}
              onResolveAlert={handleResolveAlert}
            />
          )}
        </div>
      </div>
    </div>
  )
}