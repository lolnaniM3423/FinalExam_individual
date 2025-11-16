"use client"

import { useState, useEffect } from "react"
import Dashboard from "@/components/dashboard"
import AlertPanel from "@/components/alert-panel"
import VideoViewer from "@/components/video-viewer"
import { useFireDetectionAPI } from "@/lib/useFireDetectionAPI"

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

export default function Home() {
  const [alerts, setAlerts] = useState<FireAlert[]>([])
  const [cameras, setCameras] = useState<SimulatedCamera[]>([])
  const [selectedAlert, setSelectedAlert] = useState<FireAlert | null>(null)
  const [responsesSent, setResponsesSent] = useState(0)
  const [mapImageUrl] = useState("/nyc-map.png")
  const [simulationTime, setSimulationTime] = useState(0)
  const [backendConnected, setBackendConnected] = useState(false)
  const [useBackend, setUseBackend] = useState(true)

  const { detectFire, scanAll, checkHealth, loading } = useFireDetectionAPI()

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      const isHealthy = await checkHealth()
      setBackendConnected(isHealthy)
      if (isHealthy && useBackend) {
        console.log("Backend connected, will use real fire detection")
      }
    }
    checkBackend()
    const interval = setInterval(checkBackend, 5000)
    return () => clearInterval(interval)
  }, [checkHealth, useBackend])

  // Initialize simulation data with images
  useEffect(() => {
    const initialCameras: SimulatedCamera[] = [
      {
        id: "cam-1",
        name: "Downtown Block A",
        location: "Binan City",
        coordinates: [40.7505, -73.9737],
        status: "normal",
        confidence: 0,
        imageUrl: "/city-street-downtown.jpg",
        fireEventTimes: [15000, 45000],
      },
      {
        id: "cam-2",
        name: "Warehouse District",
        location: "Binan City",
        coordinates: [40.745, -73.968],
        status: "normal",
        confidence: 0,
        imageUrl: "/warehouse-industrial-area.jpg",
        fireEventTimes: [25000, 55000],
      },
      {
        id: "cam-3",
        name: "Residential Zone B",
        location: "Binan City",
        coordinates: [40.758, -73.9855],
        status: "normal",
        confidence: 0,
        imageUrl: "/residential-street.jpg",
        fireEventTimes: [35000, 65000],
      },
      {
        id: "cam-4",
        name: "Park Avenue",
        location: "Binan City",
        coordinates: [40.7614, -73.9776],
        status: "normal",
        confidence: 0,
        imageUrl: "/park-urban.jpg",
        fireEventTimes: [20000, 50000],
      },
      {
        id: "cam-5",
        name: "Hudson Valley",
        location: "Binan City",
        coordinates: [40.73, -74.006],
        status: "normal",
        confidence: 0,
        imageUrl: "/harbor-waterfront.jpg",
        fireEventTimes: [40000, 70000],
      },
    ]
    setCameras(initialCameras)
  }, [])

  // Simulation clock
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulationTime((prev) => prev + 1000)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Handle fire event windows - either use backend or simulation
  useEffect(() => {
    if (!backendConnected || !useBackend) {
      // Fallback to simulation
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
    }
  }, [simulationTime, cameras, alerts, backendConnected, useBackend])

  // Trigger backend scan when requested
  const performBackendScan = async () => {
    if (!backendConnected) {
      console.warn("Backend not connected, using simulation mode")
      setUseBackend(false)
      return
    }

    try {
      const result = await scanAll()
      if (result) {
        console.log("Backend scan result:", result)
        // Update cameras based on backend results
        setCameras((prev) =>
          prev.map((camera) => {
            const backendStatus = result.cameras.find((c) => c.camera_id === camera.id)
            if (backendStatus) {
              return {
                ...camera,
                status: backendStatus.status as "normal" | "fire",
                confidence: backendStatus.confidence,
              }
            }
            return camera
          })
        )
      }
    } catch (err) {
      console.error("Backend scan failed:", err)
      setUseBackend(false)
    }
  }

  // Trigger backend detection when image is clicked
  const handleVideoViewerOpen = async (alert: FireAlert | null) => {
    if (!alert) return
    
    if (backendConnected && useBackend) {
      try {
        const camera = cameras.find((c) => c.id === alert.cameraId)
        if (camera) {
          const result = await detectFire(camera.imageUrl)
          if (result) {
            console.log("Backend detection result:", result)
            // Update alert with backend results
            setSelectedAlert({
              ...alert,
              confidence: result.accuracy,
            })
          }
        }
      } catch (err) {
        console.error("Backend detection failed:", err)
      }
    } else {
      setSelectedAlert(alert)
    }
  }

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
      {/* Backend Status Indicator */}
      <div className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 bg-card border border-border">
        <div className={`w-2 h-2 rounded-full ${backendConnected ? "bg-green-500" : "bg-red-500"}`} />
        <span>{backendConnected ? "Backend: Connected" : "Backend: Offline (Simulation Mode)"}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-screen">
        <div className="lg:col-span-2">
          <Dashboard
            cameras={cameras}
            alerts={alerts}
            selectedAlert={selectedAlert}
            onSelectAlert={handleVideoViewerOpen}
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
              onSelectAlert={handleVideoViewerOpen}
              onResolveAlert={handleResolveAlert}
            />
          )}
        </div>
      </div>
    </div>
  )
}
