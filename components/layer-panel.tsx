"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Plus, Trash2, GripVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type mapboxgl from "mapbox-gl" // Declare the mapboxgl variable

interface LayerPanelProps {
  map: mapboxgl.Map | null
  currentStyle: any
  selectedLayer: string | null
  onSelectLayer: (layerId: string | null) => void
  onUpdateLayer: (layerId: string, property: string, value: any) => void
  onAddLayer: (layer: any) => void
  onRemoveLayer: (layerId: string) => void
}

export function LayerPanel({
  map,
  currentStyle,
  selectedLayer,
  onSelectLayer,
  onUpdateLayer,
  onAddLayer,
  onRemoveLayer,
}: LayerPanelProps) {
  const [layers, setLayers] = useState<any[]>([])

  useEffect(() => {
    if (currentStyle?.layers) {
      setLayers(currentStyle.layers)
    }
  }, [currentStyle])

  const toggleLayerVisibility = (layerId: string) => {
    if (!map) return

    const visibility = map.getLayoutProperty(layerId, "visibility")
    const newVisibility = visibility === "none" ? "visible" : "none"
    onUpdateLayer(layerId, "layout.visibility", newVisibility)
  }

  const addNewLayer = (type: string) => {
    const layerId = `custom-${type}-${Date.now()}`
    const newLayer: any = {
      id: layerId,
      type,
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      },
    }

    if (type === "fill") {
      newLayer.paint = {
        "fill-color": "#3b82f6",
        "fill-opacity": 0.6,
      }
    } else if (type === "line") {
      newLayer.paint = {
        "line-color": "#ef4444",
        "line-width": 2,
      }
    } else if (type === "circle") {
      newLayer.paint = {
        "circle-color": "#10b981",
        "circle-radius": 6,
      }
    }

    onAddLayer(newLayer)
  }

  const getLayerTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fill: "bg-blue-500",
      line: "bg-red-500",
      circle: "bg-green-500",
      symbol: "bg-purple-500",
      raster: "bg-orange-500",
      background: "bg-gray-500",
    }
    return colors[type] || "bg-gray-400"
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Layers</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => addNewLayer("fill")}>Fill Layer</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addNewLayer("line")}>Line Layer</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addNewLayer("circle")}>Circle Layer</DropdownMenuItem>
              <DropdownMenuItem onClick={() => addNewLayer("symbol")}>Symbol Layer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {layers.map((layer, index) => {
            const isVisible = map?.getLayoutProperty(layer.id, "visibility") !== "none"
            const isSelected = selectedLayer === layer.id

            return (
              <div
                key={layer.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected ? "bg-accent border-accent-foreground" : "hover:bg-muted"
                }`}
                onClick={() => onSelectLayer(isSelected ? null : layer.id)}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />

                  <div className={`w-3 h-3 rounded ${getLayerTypeColor(layer.type)}`} />

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{layer.id}</div>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {layer.type}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLayerVisibility(layer.id)
                      }}
                    >
                      {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>

                    {layer.id.startsWith("custom-") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveLayer(layer.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
