"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";

export interface GlobalSettingsPanelProps {
  map: mapboxgl.Map | null;
  light: "day" | "night" | "dawn" | "dusk";
  currentStyle: any;
  onUpdateStyle: (light?: string) => void;
}

// Map style URLs
const styleUrls: Record<string, string> = {
  standard: "mapbox://styles/mapbox/standard",
  streets: "mapbox://styles/mapbox/streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  "satellite-streets": "mapbox://styles/mapbox/satellite-streets-v12",
};

export function GlobalSettingsPanel({
  map,
  light,
  currentStyle,
  onUpdateStyle,
}: Readonly<GlobalSettingsPanelProps>) {
  const [baseMapStyle, setBaseMapStyle] = useState("standard");
  const [colorTheme, setColorTheme] = useState("default");
  const [lightPreset, setLightPreset] = useState("day");
  const [visibilitySettings, setVisibilitySettings] = useState<
    Record<string, boolean>
  >({
    "landmark-icons": true,
    "3d-models": true,
    "place-labels": true,
    "poi-labels": true,
    "transit-labels": true,
    "pedestrian-paths": true,
    "road-labels": true,
  });
  const [roadColors, setRoadColors] = useState<Record<string, string>>({
    "trunk-roads": "#ff9500",
    "other-roads": "#ffffff",
    "motorway-roads": "#1d8bff",
  });

  useEffect(() => {
    if (!map || !currentStyle) return;

    // Initialize state from current style if available
    const layers = currentStyle.layers ?? [];
    const styleUrl = currentStyle.sprite?.replace("sprite", "style");
    for (const style in styleUrls) {
      if (styleUrls[style] === styleUrl) {
        setBaseMapStyle(style);
        break;
      }
    }
    console.log(light);
    updateLightPreset(light, false);

    // Check visibility settings from layers
    const roadLabels = layers.find((l: any) => l.id === "road-label");
    if (roadLabels) {
      setVisibilitySettings((prev) => ({
        ...prev,
        "road-labels": roadLabels.layout?.visibility !== "none",
      }));
    }

    const poiLabels = layers.find((l: any) => l.id === "poi-label");
    if (poiLabels) {
      setVisibilitySettings((prev) => ({
        ...prev,
        "poi-labels": poiLabels.layout?.visibility !== "none",
      }));
    }

    // Get road colors
    const trunkRoad = layers.find((l: any) => l.id === "road-trunk");
    const motorwayRoad = layers.find((l: any) => l.id === "road-motorway");
    const otherRoad = layers.find((l: any) => l.id === "road-street");

    if (trunkRoad?.paint?.["line-color"]) {
      setRoadColors((prev) => ({
        ...prev,
        "trunk-roads": trunkRoad.paint["line-color"],
      }));
    }
    if (motorwayRoad?.paint?.["line-color"]) {
      setRoadColors((prev) => ({
        ...prev,
        "motorway-roads": motorwayRoad.paint["line-color"],
      }));
    }
    if (otherRoad?.paint?.["line-color"]) {
      setRoadColors((prev) => ({
        ...prev,
        "other-roads": otherRoad.paint["line-color"],
      }));
    }
  }, [map, light, currentStyle]);

  const updateBaseMapStyle = (style: string) => {
    setBaseMapStyle(style);
    if (!map) return;

    // Save current camera position
    const center = map.getCenter();
    const zoom = map.getZoom();
    const pitch = map.getPitch();
    const bearing = map.getBearing();

    // Change style
    map.setStyle(styleUrls[style]);

    // Restore camera after style change
    map.once("style.load", () => {
      map.setCenter(center);
      map.setZoom(zoom);
      map.setPitch(pitch);
      map.setBearing(bearing);
      onUpdateStyle();
    });
  };

  const updateColorTheme = (theme: string) => {
    setColorTheme(theme);
    if (!map) return;

    // Apply color theme changes
    // This would typically involve updating multiple layer properties
    // For demonstration, we'll just update a few key layers

    if (theme === "monochrome") {
      updateRoadColor("trunk-roads", "#555555");
      updateRoadColor("motorway-roads", "#333333");
      updateRoadColor("other-roads", "#777777");
    } else if (theme === "night") {
      updateRoadColor("trunk-roads", "#3b4252");
      updateRoadColor("motorway-roads", "#2e3440");
      updateRoadColor("other-roads", "#4c566a");
    } else {
      // Default/color theme
      updateRoadColor("trunk-roads", "#ff9500");
      updateRoadColor("motorway-roads", "#1d8bff");
      updateRoadColor("other-roads", "#ffffff");
    }
  };

  const updateLightPreset = (preset: string, shouldUpdate: boolean = true) => {
    setLightPreset(preset);
    if (!map) return;

    // Extract color/intensity/direction for ambient and directional
    let ambientColor = "#ffffff";
    let ambientIntensity = 0.4;
    let directionalColor = "#fffbe6";
    let directionalIntensity = 0.6;
    let directionalDirection: [number, number] = [210, 30];
    let shadowIntensity = 0.3;

    if (preset === "night") {
      ambientColor = "#223344";
      ambientIntensity = 0.2;
      directionalColor = "#aaccff";
      directionalIntensity = 0.2;
      directionalDirection = [200, 60];
      shadowIntensity = 0.7;
    } else if (preset === "dawn") {
      ambientColor = "#fc8eac";
      directionalColor = "#ffd580";
      directionalDirection = [120, 30];
    } else if (preset === "dusk") {
      ambientColor = "#fc8eac";
      directionalColor = "#ffd580";
      directionalDirection = [300, 30];
    }

    const lights = [
      {
        id: "ambient",
        type: "ambient",
        properties: {
          color: ambientColor,
          intensity: ambientIntensity,
        },
      },
      {
        id: "directional",
        type: "directional",
        properties: {
          color: directionalColor,
          intensity: directionalIntensity,
          direction: directionalDirection,
          "shadow-intensity": shadowIntensity,
        },
      },
    ];
    // Prefer setLights if available (Mapbox GL JS v3+)
    if (typeof (map as any).setLights === "function") {
      (map as any).setLights(lights);
    } else if (typeof map.setLight === "function") {
      // Fallback: set a single light (older Mapbox GL JS)
      map.setLight({
        anchor: "viewport",
        color: ambientColor,
        intensity: ambientIntensity,
      });
    }
    shouldUpdate && onUpdateStyle(preset);
  };

  const toggleLayerVisibility = (layerId: string, visible: boolean) => {
    setVisibilitySettings((prev) => ({ ...prev, [layerId]: visible }));
    if (!map) return;

    // Map from our internal IDs to Mapbox layer IDs
    const layerMapping: Record<string, string[]> = {
      "landmark-icons": ["poi-label"],
      "3d-models": ["building-extrusion"],
      "place-labels": ["settlement-label", "state-label", "country-label"],
      "poi-labels": ["poi-label"],
      "transit-labels": ["transit-label"],
      "pedestrian-paths": ["road-pedestrian", "road-path", "road-steps"],
      "road-labels": ["road-label"],
    };

    const mapboxLayers = layerMapping[layerId] || [];
    const visibility = visible ? "visible" : "none";

    mapboxLayers.forEach((layer) => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, "visibility", visibility);
      }
    });

    onUpdateStyle();
  };

  const updateRoadColor = (roadType: string, color: string) => {
    setRoadColors((prev) => ({ ...prev, [roadType]: color }));
    if (!map) return;

    // Map from our internal IDs to Mapbox layer IDs
    const layerMapping: Record<string, string[]> = {
      "trunk-roads": ["road-trunk", "road-trunk-case"],
      "motorway-roads": ["road-motorway", "road-motorway-case"],
      "other-roads": [
        "road-street",
        "road-minor",
        "road-primary",
        "road-secondary",
      ],
    };

    const mapboxLayers = layerMapping[roadType] || [];

    mapboxLayers.forEach((layer) => {
      if (map.getLayer(layer)) {
        if (layer.includes("-case")) {
          // For case layers (outlines), use a darker version of the color
          const darkerColor = adjustColorBrightness(color, -0.3);
          map.setPaintProperty(layer, "line-color", darkerColor);
        } else {
          map.setPaintProperty(layer, "line-color", color);
        }
      }
    });

    onUpdateStyle();
  };

  // Helper function to darken/lighten colors
  const adjustColorBrightness = (hex: string, factor: number): string => {
    // Convert hex to RGB
    let r = Number.parseInt(hex.substring(1, 3), 16);
    let g = Number.parseInt(hex.substring(3, 5), 16);
    let b = Number.parseInt(hex.substring(5, 7), 16);

    // Adjust brightness
    r = Math.min(255, Math.max(0, Math.round(r + factor * 255)));
    g = Math.min(255, Math.max(0, Math.round(g + factor * 255)));
    b = Math.min(255, Math.max(0, Math.round(b + factor * 255)));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-medium mb-2">Map Style Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure the base map appearance
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basemap</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={baseMapStyle} onValueChange={updateBaseMapStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="streets">Streets</SelectItem>
                <SelectItem value="outdoors">Outdoors</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="satellite-streets">
                  Satellite Streets
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Color Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={colorTheme} onValueChange={updateColorTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="monochrome">Monochrome</SelectItem>
                <SelectItem value="night">Night</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Light Preset</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={lightPreset} onValueChange={updateLightPreset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="night">Night</SelectItem>
                <SelectItem value="dawn">Dawn</SelectItem>
                <SelectItem value="dusk">Dusk</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Separator />

        <Accordion type="multiple" defaultValue={["color", "visibility"]}>
          <AccordionItem value="color">
            <AccordionTrigger className="font-medium">Color</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-[1fr,120px] items-center gap-4">
                  <Label htmlFor="trunk-roads">Trunk roads</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: roadColors["trunk-roads"] }}
                    />
                    <Input
                      id="trunk-roads"
                      type="color"
                      value={roadColors["trunk-roads"]}
                      onChange={(e) =>
                        updateRoadColor("trunk-roads", e.target.value)
                      }
                      className="w-full h-8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr,120px] items-center gap-4">
                  <Label htmlFor="other-roads">Other roads</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: roadColors["other-roads"] }}
                    />
                    <Input
                      id="other-roads"
                      type="color"
                      value={roadColors["other-roads"]}
                      onChange={(e) =>
                        updateRoadColor("other-roads", e.target.value)
                      }
                      className="w-full h-8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr,120px] items-center gap-4">
                  <Label htmlFor="motorway-roads">Motorway roads</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: roadColors["motorway-roads"] }}
                    />
                    <Input
                      id="motorway-roads"
                      type="color"
                      value={roadColors["motorway-roads"]}
                      onChange={(e) =>
                        updateRoadColor("motorway-roads", e.target.value)
                      }
                      className="w-full h-8"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="typography">
            <AccordionTrigger className="font-medium">
              Typography
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="font">Font</Label>
                  <Select defaultValue="din-pro">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="din-pro">DIN Pro</SelectItem>
                      <SelectItem value="open-sans">Open Sans</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="lato">Lato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="visibility">
            <AccordionTrigger className="font-medium">
              Visibility
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="landmark-icons">Landmark Icons</Label>
                    <span className="text-xs bg-muted text-muted-foreground px-1 rounded">
                      beta
                    </span>
                  </div>
                  <Switch
                    id="landmark-icons"
                    checked={visibilitySettings["landmark-icons"]}
                    onCheckedChange={(checked) =>
                      toggleLayerVisibility("landmark-icons", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="3d-models">3D Models</Label>
                  <Switch
                    id="3d-models"
                    checked={visibilitySettings["3d-models"]}
                    onCheckedChange={(checked) =>
                      toggleLayerVisibility("3d-models", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="place-labels">Place Labels</Label>
                  <Switch
                    id="place-labels"
                    checked={visibilitySettings["place-labels"]}
                    onCheckedChange={(checked) =>
                      toggleLayerVisibility("place-labels", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="poi-labels">POI Labels</Label>
                  <Switch
                    id="poi-labels"
                    checked={visibilitySettings["poi-labels"]}
                    onCheckedChange={(checked) =>
                      toggleLayerVisibility("poi-labels", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="transit-labels">Transit Labels</Label>
                  <Switch
                    id="transit-labels"
                    checked={visibilitySettings["transit-labels"]}
                    onCheckedChange={(checked) =>
                      toggleLayerVisibility("transit-labels", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="pedestrian-paths">
                    Pedestrian Roads, Paths, Trails
                  </Label>
                  <Switch
                    id="pedestrian-paths"
                    checked={visibilitySettings["pedestrian-paths"]}
                    onCheckedChange={(checked) =>
                      toggleLayerVisibility("pedestrian-paths", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="road-labels">Road Labels</Label>
                  <Switch
                    id="road-labels"
                    checked={visibilitySettings["road-labels"]}
                    onCheckedChange={(checked) =>
                      toggleLayerVisibility("road-labels", checked)
                    }
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="interactivity">
            <AccordionTrigger className="font-medium">
              <div className="flex items-center gap-2">
                Interactivity
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="place-labels-interactive">Place Labels</Label>
                  <Switch id="place-labels-interactive" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="buildings-interactive">Buildings</Label>
                  <Switch id="buildings-interactive" defaultChecked />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ScrollArea>
  );
}
