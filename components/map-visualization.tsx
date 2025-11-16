"use client"
import { useEffect, useRef, useState } from "react"

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
}

interface MapProps {
  cameras: SimulatedCamera[]
  alerts: FireAlert[]
  selectedAlert: FireAlert | null
  onSelectAlert: (alert: FireAlert | null) => void
  mapImageUrl?: string
}

interface MarkerPosition {
  cameraId: string
  x: number
  y: number
  isActive: boolean
  confidence: number
}

export default function MapVisualization({
  cameras,
  alerts,
  selectedAlert,
  onSelectAlert,
  mapImageUrl = "/nyc-map.png",
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [markerPositions, setMarkerPositions] = useState<Map<string, MarkerPosition>>(new Map())

  // Load map image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setImageLoaded(true)
    }
    img.onerror = () => {
      setImageLoaded(true)
    }
    img.src = mapImageUrl
  }, [mapImageUrl])

  // Initialize random marker positions on map
  useEffect(() => {
    if (!imageLoaded) return

    const positions = new Map<string, MarkerPosition>()
    cameras.forEach((camera) => {
      // Generate random positions across the map (0-100% of container)
      const randomX = Math.random() * 90 + 5 // 5-95% width
      const randomY = Math.random() * 90 + 5 // 5-95% height

      positions.set(camera.id, {
        cameraId: camera.id,
        x: randomX,
        y: randomY,
        isActive: false,
        confidence: 0,
      })
    })
    setMarkerPositions(positions)
  }, [imageLoaded, cameras])

  // Update marker states based on active alerts
  useEffect(() => {
    const newPositions = new Map(markerPositions)

    cameras.forEach((camera) => {
      const marker = newPositions.get(camera.id)
      if (marker) {
        marker.isActive = camera.status === "fire"
        marker.confidence = camera.confidence

        const alert = alerts.find((a) => a.cameraId === camera.id && a.status === "active")
        if (alert && marker.isActive) {
          newPositions.set(camera.id, marker)
        }
      }
    })

    setMarkerPositions(newPositions)
  }, [cameras, alerts])

  const handleMarkerClick = (cameraId: string) => {
    const alert = alerts.find((a) => a.cameraId === cameraId && a.status === "active")
    if (alert) {
      onSelectAlert(alert)
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative overflow-hidden rounded-lg bg-black">
      {/* Background satellite map image */}
      {imageLoaded && (
        <img
          src={mapImageUrl || "/placeholder.svg"}
          alt="City satellite map"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div className="absolute inset-0 z-10">
        {Array.from(markerPositions.values()).map((marker) => {
          const isActive = alerts.some((a) => a.cameraId === marker.cameraId && a.status === "active")
          const isSelected = selectedAlert?.cameraId === marker.cameraId

          return (
            <div
              key={marker.cameraId}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`,
              }}
              onClick={() => handleMarkerClick(marker.cameraId)}
            >
              {/* Pulsing outer ring for active alerts */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-full border-2 border-red-500 opacity-70 animate-ping"
                  style={{
                    width: "40px",
                    height: "40px",
                    left: "-20px",
                    top: "-20px",
                  }}
                />
              )}

              {/* Red ball marker */}
              <button
                className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                  isActive
                    ? "bg-red-500 border-red-400 shadow-lg shadow-red-500/50 hover:w-8 hover:h-8"
                    : "bg-green-500 border-green-400 shadow-md shadow-green-500/30 hover:opacity-80"
                } ${isSelected ? "ring-2 ring-yellow-400" : ""}`}
                style={{
                  boxShadow: isActive ? "0 0 20px rgba(239, 68, 68, 0.8)" : "0 0 10px rgba(34, 197, 94, 0.5)",
                }}
                aria-label={`Camera ${marker.cameraId} - ${isActive ? "Fire detected" : "Normal"}`}
              />

              {/* label on hover for active alerts */}
              {isActive && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-semibold">
                   Fire Detected
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Loading state */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="text-foreground">Loading map...</div>
        </div>
      )}
    </div>
  )
}
