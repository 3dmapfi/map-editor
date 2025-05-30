"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Link, FileText, Database } from "lucide-react"
import type mapboxgl from "mapbox-gl"

interface DataImportPanelProps {
  map: mapboxgl.Map | null
  onDataImported: (layerId: string) => void
}

export function DataImportPanel({ map, onDataImported }: DataImportPanelProps) {
  const [geoJsonData, setGeoJsonData] = useState("")
  const [urlInput, setUrlInput] = useState("")

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !map) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string
        let geoJson

        if (file.name.endsWith(".geojson") || file.name.endsWith(".json")) {
          geoJson = JSON.parse(data)
        } else if (file.name.endsWith(".csv")) {
          // Simple CSV to GeoJSON conversion (assuming lat/lng columns)
          geoJson = csvToGeoJson(data)
        }

        if (geoJson) {
          addGeoJsonToMap(geoJson, `imported-${Date.now()}`)
        }
      } catch (error) {
        console.error("Error parsing file:", error)
      }
    }
    reader.readAsText(file)
  }

  const csvToGeoJson = (csvData: string) => {
    const lines = csvData.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim())

    const latIndex = headers.findIndex((h) => h.toLowerCase().includes("lat"))
    const lngIndex = headers.findIndex((h) => h.toLowerCase().includes("lng") || h.toLowerCase().includes("lon"))

    if (latIndex === -1 || lngIndex === -1) {
      throw new Error("CSV must contain latitude and longitude columns")
    }

    const features = lines
      .slice(1)
      .map((line) => {
        const values = line.split(",")
        const properties: any = {}

        headers.forEach((header, index) => {
          if (index !== latIndex && index !== lngIndex) {
            properties[header] = values[index]?.trim()
          }
        })

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(values[lngIndex]), Number.parseFloat(values[latIndex])],
          },
          properties,
        }
      })
      .filter((feature) => !isNaN(feature.geometry.coordinates[0]) && !isNaN(feature.geometry.coordinates[1]))

    return {
      type: "FeatureCollection",
      features,
    }
  }

  const addGeoJsonToMap = (geoJson: any, sourceId: string) => {
    if (!map) return

    try {
      // Add source
      map.addSource(sourceId, {
        type: "geojson",
        data: geoJson,
      })

      // Determine layer type based on geometry
      const firstFeature = geoJson.features?.[0]
      if (!firstFeature) return

      const geometryType = firstFeature.geometry.type
      let layerType = "circle"
      let paint: any = {}

      switch (geometryType) {
        case "Point":
        case "MultiPoint":
          layerType = "circle"
          paint = {
            "circle-radius": 6,
            "circle-color": "#3b82f6",
            "circle-opacity": 0.8,
          }
          break
        case "LineString":
        case "MultiLineString":
          layerType = "line"
          paint = {
            "line-color": "#ef4444",
            "line-width": 2,
          }
          break
        case "Polygon":
        case "MultiPolygon":
          layerType = "fill"
          paint = {
            "fill-color": "#10b981",
            "fill-opacity": 0.6,
          }
          break
      }

      // Add layer
      map.addLayer({
        id: sourceId,
        type: layerType as any,
        source: sourceId,
        paint,
      })

      onDataImported(sourceId)
    } catch (error) {
      console.error("Error adding data to map:", error)
    }
  }

  const handleGeoJsonSubmit = () => {
    if (!geoJsonData || !map) return

    try {
      const geoJson = JSON.parse(geoJsonData)
      addGeoJsonToMap(geoJson, `geojson-${Date.now()}`)
      setGeoJsonData("")
    } catch (error) {
      console.error("Invalid GeoJSON:", error)
    }
  }

  const handleUrlSubmit = async () => {
    if (!urlInput || !map) return

    try {
      const response = await fetch(urlInput)
      const data = await response.json()
      addGeoJsonToMap(data, `url-${Date.now()}`)
      setUrlInput("")
    } catch (error) {
      console.error("Error fetching data from URL:", error)
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <h3 className="font-medium mb-4">Data Import</h3>

        <Tabs defaultValue="file" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="geojson">GeoJSON</TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Select File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".geojson,.json,.csv"
                      onChange={handleFileUpload}
                      className="mt-2"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Supported formats: GeoJSON (.geojson, .json), CSV (.csv)
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="url">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Load from URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="url-input">Data URL</Label>
                    <Input
                      id="url-input"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/data.geojson"
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={handleUrlSubmit} disabled={!urlInput}>
                    Load Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geojson">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Paste GeoJSON
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="geojson-input">GeoJSON Data</Label>
                    <Textarea
                      id="geojson-input"
                      value={geoJsonData}
                      onChange={(e) => setGeoJsonData(e.target.value)}
                      placeholder='{"type": "FeatureCollection", "features": [...]}'
                      rows={8}
                      className="mt-2 font-mono text-sm"
                    />
                  </div>
                  <Button onClick={handleGeoJsonSubmit} disabled={!geoJsonData}>
                    Add to Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4" />
              Sample Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const sampleData = {
                    type: "FeatureCollection",
                    features: [
                      {
                        type: "Feature",
                        geometry: {
                          type: "Point",
                          coordinates: [-74.5, 40],
                        },
                        properties: {
                          name: "Sample Point",
                          description: "This is a sample point",
                        },
                      },
                    ],
                  }
                  addGeoJsonToMap(sampleData, `sample-${Date.now()}`)
                }}
              >
                Add Sample Points
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const sampleData = {
                    type: "FeatureCollection",
                    features: [
                      {
                        type: "Feature",
                        geometry: {
                          type: "LineString",
                          coordinates: [
                            [-74.5, 40],
                            [-74.4, 40.1],
                            [-74.3, 40.05],
                          ],
                        },
                        properties: {
                          name: "Sample Line",
                        },
                      },
                    ],
                  }
                  addGeoJsonToMap(sampleData, `sample-line-${Date.now()}`)
                }}
              >
                Add Sample Line
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
