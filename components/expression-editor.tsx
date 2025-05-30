"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Code, Play, BookOpen } from "lucide-react"
import type mapboxgl from "mapbox-gl" // Import mapboxgl

interface ExpressionEditorProps {
  map: mapboxgl.Map | null
  selectedLayer: string | null
  onUpdateLayer: (layerId: string, property: string, value: any) => void
}

export function ExpressionEditor({ map, selectedLayer, onUpdateLayer }: ExpressionEditorProps) {
  const [expression, setExpression] = useState("")
  const [selectedProperty, setSelectedProperty] = useState("")
  const [expressionType, setExpressionType] = useState<"paint" | "layout">("paint")

  const expressionExamples = [
    {
      name: "Conditional Color",
      expression: `["case",
  ["<", ["get", "population"], 10000],
  "#3b82f6",
  ["<", ["get", "population"], 50000],
  "#f59e0b",
  "#ef4444"
]`,
      description: "Color based on population property",
    },
    {
      name: "Zoom-based Size",
      expression: `["interpolate",
  ["linear"],
  ["zoom"],
  5, 2,
  10, 6,
  15, 12
]`,
      description: "Size changes with zoom level",
    },
    {
      name: "Data-driven Opacity",
      expression: `["interpolate",
  ["linear"],
  ["get", "density"],
  0, 0.1,
  100, 0.9
]`,
      description: "Opacity based on density property",
    },
    {
      name: "Text Concatenation",
      expression: `["concat",
  ["get", "name"],
  " (",
  ["to-string", ["get", "population"]],
  ")"
]`,
      description: "Combine name and population",
    },
  ]

  const getAvailableProperties = () => {
    if (!selectedLayer || !map) return []

    const layer = map.getStyle().layers?.find((l) => l.id === selectedLayer)
    if (!layer) return []

    const properties: string[] = []

    if (layer.type === "fill") {
      if (expressionType === "paint") {
        properties.push("fill-color", "fill-opacity", "fill-outline-color")
      } else {
        properties.push("visibility")
      }
    } else if (layer.type === "line") {
      if (expressionType === "paint") {
        properties.push("line-color", "line-width", "line-opacity", "line-blur")
      } else {
        properties.push("visibility", "line-cap", "line-join")
      }
    } else if (layer.type === "circle") {
      if (expressionType === "paint") {
        properties.push("circle-color", "circle-radius", "circle-opacity", "circle-stroke-color", "circle-stroke-width")
      } else {
        properties.push("visibility")
      }
    } else if (layer.type === "symbol") {
      if (expressionType === "paint") {
        properties.push("text-color", "text-halo-color", "text-halo-width", "icon-color", "icon-opacity")
      } else {
        properties.push("visibility", "text-field", "text-size", "text-anchor", "icon-image")
      }
    }

    return properties
  }

  const applyExpression = () => {
    if (!selectedLayer || !selectedProperty || !expression) return

    try {
      const parsedExpression = JSON.parse(expression)
      onUpdateLayer(selectedLayer, `${expressionType}.${selectedProperty}`, parsedExpression)
    } catch (error) {
      console.error("Invalid expression:", error)
    }
  }

  const loadExample = (example: any) => {
    setExpression(example.expression)
  }

  if (!selectedLayer) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Code className="w-8 h-8" />
          </div>
          <p>Select a layer to edit expressions</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-medium mb-2">Expression Editor</h3>
          <p className="text-sm text-muted-foreground">Create data-driven styles using Mapbox expressions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Property Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Expression Type</Label>
              <Select value={expressionType} onValueChange={(value: "paint" | "layout") => setExpressionType(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paint">Paint Properties</SelectItem>
                  <SelectItem value="layout">Layout Properties</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableProperties().map((prop) => (
                    <SelectItem key={prop} value={prop}>
                      {prop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expression</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>JSON Expression</Label>
              <Textarea
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder='["get", "property_name"]'
                rows={8}
                className="mt-2 font-mono text-sm"
              />
            </div>

            <Button onClick={applyExpression} disabled={!selectedProperty || !expression} className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Apply Expression
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Expression Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expressionExamples.map((example, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{example.name}</h4>
                    <Button size="sm" variant="outline" onClick={() => loadExample(example)}>
                      Load
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{example.description}</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{example.expression}</pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expression Functions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                "get",
                "has",
                "case",
                "interpolate",
                "step",
                "zoom",
                "concat",
                "to-string",
                "to-number",
                "length",
                "rgb",
                "rgba",
              ].map((func) => (
                <Badge key={func} variant="secondary" className="text-xs">
                  {func}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
