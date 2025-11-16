"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, MapPin, Clock, Video } from "lucide-react"
import { useState } from "react"

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

interface VideoViewerProps {
  alert: FireAlert
  camera?: SimulatedCamera | null
  onClose: () => void
  onRequestResponse: () => void
}

export default function VideoViewer({ alert, camera, onClose, onRequestResponse }: VideoViewerProps) {
  const [imageError, setImageError] = useState(false)
  
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Video Container */}
      <Card className="border border-destructive/30 bg-background overflow-hidden flex-1 relative">
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          {/* Camera feed image with fallback */}
          {camera && !imageError ? (
            <img 
              src={camera.imageUrl} 
              alt="CCTV feed" 
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 to-black text-white">
              <Video className="w-12 h-12 mb-2 text-gray-600" />
              <p className="text-sm text-gray-400 text-center px-4">
                {!camera ? "Camera not found" : "Image failed to load"}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {camera?.imageUrl || "No image URL available"}
              </p>
            </div>
          )}

          {/* Fire Detection Overlay */}
          <div className="absolute top-2 left-2 bg-destructive/90 backdrop-blur rounded px-2 py-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-white" />
              <span className="text-xs font-bold text-white">FIRE DETECTED</span>
            </div>
          </div>

          {/* Confidence Score */}
          <div>
          </div>

          {/* Detection Box Animation */}
          <div className="" />
        </div>
      </Card>

      {/* Alert Details */}
      <Card className="border border-border bg-card p-3 space-y-2">
        {/* Location */}
        <div className="flex items-start gap-2">
          <Video className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-xs">CAMERA</p>
            <p className="font-medium text-foreground text-sm">{alert.location}</p>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{alert.address}</p>
            <p className="text-xs text-muted-foreground">
              {alert.coordinates[0].toFixed(4)}, {alert.coordinates[1].toFixed(4)}
            </p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">{alert.timestamp.toLocaleTimeString()}</span>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={onRequestResponse}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          Request Response
        </Button>
        <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
          Close
        </Button>
      </div>
    </div>
  )
}
