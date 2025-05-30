"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type mapboxgl from "mapbox-gl" // Declare the mapboxgl variable

interface StylePanelProps {
  map: mapboxgl.Map | null
  selectedLayer: string | null
  currentStyle: any
  onUpdateLayer: (layerId: string, property: string, value: any) => void
}

export function StylePanel({ map, selectedLayer, currentStyle, onUpdateLayer }: StylePanelProps) {
  const [layerProperties, setLayerProperties] = useState<any>({})

  useEffect(() => {
    if (selectedLayer && map) {
      const layer = currentStyle?.layers?.find((l: any) => l.id === selectedLayer)
      if (layer) {
        setLayerProperties({
          paint: layer.paint || {},
          layout: layer.layout || {},
        })
      }
    }
  }, [selectedLayer, currentStyle, map])

  const updateProperty = (section: "paint" | "layout", property: string, value: any) => {
    if (!selectedLayer) return
    onUpdateLayer(selectedLayer, `${section}.${property}`, value)
  }

  const ColorPicker = ({ value, onChange }: { value: string; onChange: (color: string) => void }) => (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border cursor-pointer"
      />
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="#000000" className="flex-1" />
    </div>
  )

  if (!selectedLayer) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">🎨</span>
          </div>
          <p>Select a layer to edit its style properties</p>
        </div>
      </div>
    )
  }

  const layer = currentStyle?.layers?.find((l: any) => l.id === selectedLayer)
  if (!layer) return null

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-medium mb-2">Layer: {selectedLayer}</h3>
          <p className="text-sm text-muted-foreground">Type: {layer.type}</p>
        </div>

        <Separator />

        {/* Paint Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paint Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {layer.type === "fill" && (
              <>
                <div>
                  <Label className="text-sm">Fill Color</Label>
                  <ColorPicker
                    value={layerProperties.paint?.["fill-color"] || "#3b82f6"}
                    onChange={(color) => updateProperty("paint", "fill-color", color)}
                  />
                </div>
                <div>
                  <Label className="text-sm">Fill Opacity</Label>
                  <Slider
                    value={[layerProperties.paint?.["fill-opacity"] || 0.6]}
                    onValueChange={([value]) => updateProperty("paint", "fill-opacity", value)}
                    max={1}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {layer.type === "line" && (
              <>
                <div>
                  <Label className="text-sm">Line Color</Label>
                  <ColorPicker
                    value={layerProperties.paint?.["line-color"] || "#ef4444"}
                    onChange={(color) => updateProperty("paint", "line-color", color)}
                  />
                </div>
                <div>
                  <Label className="text-sm">Line Width</Label>
                  <Slider
                    value={[layerProperties.paint?.["line-width"] || 2]}
                    onValueChange={([value]) => updateProperty("paint", "line-width", value)}
                    max={20}
                    min={0.5}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Line Opacity</Label>
                  <Slider
                    value={[layerProperties.paint?.["line-opacity"] || 1]}
                    onValueChange={([value]) => updateProperty("paint", "line-opacity", value)}
                    max={1}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {layer.type === "circle" && (
              <>
                <div>
                  <Label className="text-sm">Circle Color</Label>
                  <ColorPicker
                    value={layerProperties.paint?.["circle-color"] || "#10b981"}
                    onChange={(color) => updateProperty("paint", "circle-color", color)}
                  />
                </div>
                <div>
                  <Label className="text-sm">Circle Radius</Label>
                  <Slider
                    value={[layerProperties.paint?.["circle-radius"] || 6]}
                    onValueChange={([value]) => updateProperty("paint", "circle-radius", value)}
                    max={50}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Circle Opacity</Label>
                  <Slider
                    value={[layerProperties.paint?.["circle-opacity"] || 1]}
                    onValueChange={([value]) => updateProperty("paint", "circle-opacity", value)}
                    max={1}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {layer.type === "symbol" && (
              <>
                <div>
                  <Label className="text-sm">Text Color</Label>
                  <ColorPicker
                    value={layerProperties.paint?.["text-color"] || "#000000"}
                    onChange={(color) => updateProperty("paint", "text-color", color)}
                  />
                </div>
                <div>
                  <Label className="text-sm">Text Halo Color</Label>
                  <ColorPicker
                    value={layerProperties.paint?.["text-halo-color"] || "#ffffff"}
                    onChange={(color) => updateProperty("paint", "text-halo-color", color)}
                  />
                </div>
                <div>
                  <Label className="text-sm">Text Halo Width</Label>
                  <Slider
                    value={[layerProperties.paint?.["text-halo-width"] || 1]}
                    onValueChange={([value]) => updateProperty("paint", "text-halo-width", value)}
                    max={5}
                    min={0}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Layout Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Layout Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Visibility</Label>
              <Select
                value={layerProperties.layout?.visibility || "visible"}
                onValueChange={(value) => updateProperty("layout", "visibility", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visible">Visible</SelectItem>
                  <SelectItem value="none">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {layer.type === "symbol" && (
              <>
                <div>
                  <Label className="text-sm">Text Field</Label>
                  <Input
                    value={layerProperties.layout?.["text-field"] || ""}
                    onChange={(e) => updateProperty("layout", "text-field", e.target.value)}
                    placeholder="Enter text or field name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Text Size</Label>
                  <Slider
                    value={[layerProperties.layout?.["text-size"] || 12]}
                    onValueChange={([value]) => updateProperty("layout", "text-size", value)}
                    max={72}
                    min={8}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Text Anchor</Label>
                  <Select
                    value={layerProperties.layout?.["text-anchor"] || "center"}
                    onValueChange={(value) => updateProperty("layout", "text-anchor", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {layer.type === "line" && (
              <>
                <div>
                  <Label className="text-sm">Line Cap</Label>
                  <Select
                    value={layerProperties.layout?.["line-cap"] || "butt"}
                    onValueChange={(value) => updateProperty("layout", "line-cap", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="butt">Butt</SelectItem>
                      <SelectItem value="round">Round</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Line Join</Label>
                  <Select
                    value={layerProperties.layout?.["line-join"] || "miter"}
                    onValueChange={(value) => updateProperty("layout", "line-join", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bevel">Bevel</SelectItem>
                      <SelectItem value="round">Round</SelectItem>
                      <SelectItem value="miter">Miter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
