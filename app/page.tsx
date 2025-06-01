"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import mapboxgl, { StyleSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LayerPanel } from "@/components/layer-panel";
import { StylePanel } from "@/components/style-panel";
import { DataImportPanel } from "@/components/data-import-panel";
import { ExpressionEditor } from "@/components/expression-editor";
import { VersionHistory } from "@/components/version-history";
import { GlobalSettingsPanel } from "@/components/global-settings-panel";
import { Toolbar } from "@/components/toolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  MapPin,
  Layers,
  Palette,
  Database,
  Code,
  History,
  Settings,
} from "lucide-react";

// Set your Mapbox access token here
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface MapStyle {
  id: string;
  name: string;
  style: any;
  timestamp: Date;
}

export default function MapStyleEditor() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("global");
  const [currentStyle, setCurrentStyle] = useState<any>(null);
  const [styleHistory, setStyleHistory] = useState<MapStyle[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [is3DEnabled, setIs3DEnabled] = useState(false);

  // New state variables for global settings
  const [baseMapStyle, setBaseMapStyle] = useState(
    "mapbox://styles/mapbox/standard"
  );
  const [colorTheme, setColorTheme] = useState("light");
  const [lightPreset, setLightPreset] = useState("day");
  const [visibilitySettings, setVisibilitySettings] = useState<any>(null);
  const [roadColors, setRoadColors] = useState<any>(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: baseMapStyle,
      center: [-74.5, 40],
      zoom: 9,
      pitch: 0,
      bearing: 0,
    });

    const clearControl = () => {
      const els = document.querySelectorAll(
        ".mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right"
      );
      els.forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });
    };
    map.current.on("load", () => {
      setMapLoaded(true);
      setCurrentStyle(map.current?.getStyle());
      saveStyleVersion("Initial Style");
      clearControl();
    });

    map.current.on("style.load", () => {
      setCurrentStyle(map.current?.getStyle());
      clearControl();
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const saveStyleVersion = (name: string, spec?: StyleSpecification) => {
    if (!map.current) return;
    let style = spec;
    if (!spec) {
      style = map.current.getStyle();
    }
    const newVersion: MapStyle = {
      id: Date.now().toString(),
      name,
      style: JSON.parse(JSON.stringify(style)),
      timestamp: new Date(),
    };

    setStyleHistory((prev) => [newVersion, ...prev.slice(0, 9)]); // Keep last 10 versions
  };

  const loadStyleVersion = (styleVersion: MapStyle) => {
    if (!map.current) return;
    map.current.setStyle(styleVersion.style);
  };

  const exportStyle = () => {
    if (!map.current) return;

    const style = map.current.getStyle();
    // Bundle global settings with style
    const exportData = {
      style,
      globalSettings: {
        baseMapStyle,
        colorTheme,
        lightPreset,
        visibilitySettings,
        roadColors,
      },
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      "data:application/mfc;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "mapfi-style.mfc";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importStyle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !map.current) return;

    // Only allow .json or .mfc files
    const allowedExtensions = [".json", ".mfc"];
    const fileName = file.name.toLowerCase();
    if (!allowedExtensions.some((ext) => fileName.endsWith(ext))) {
      alert("Please select a .json or .mfc file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Support both legacy (just style) and new (with globalSettings)
        const style: StyleSpecification = data.style ?? data;
        map.current?.setStyle(style);
        saveStyleVersion(`Imported: ${file.name}`, style);
        // If globalSettings exist, update them
        if (data.globalSettings) {
          setBaseMapStyle(
            data.globalSettings.baseMapStyle ??
              "mapbox://styles/mapbox/standard"
          );
          setColorTheme(data.globalSettings.colorTheme ?? "light");
          setLightPreset(data.globalSettings.lightPreset ?? "day");
          setVisibilitySettings(data.globalSettings.visibilitySettings ?? null);
          setRoadColors(data.globalSettings.roadColors ?? null);
        }
      } catch (error) {
        console.error("Error importing style:", error);
        alert(
          "Failed to import file. Make sure it is a valid JSON or MFC file."
        );
      }
    };
    reader.readAsText(file);
  };

  const toggle3D = () => {
    if (!map.current) return;

    const newPitch = is3DEnabled ? 0 : 60;
    map.current.easeTo({ pitch: newPitch });
    setIs3DEnabled(!is3DEnabled);
  };

  const updateLayerProperty = (
    layerId: string,
    property: string,
    value: any
  ) => {
    if (!map.current) return;

    try {
      if (property.startsWith("paint.")) {
        const paintProperty = property.replace("paint.", "");
        map.current.setPaintProperty(layerId, paintProperty as any, value);
      } else if (property.startsWith("layout.")) {
        const layoutProperty = property.replace("layout.", "");
        map.current.setLayoutProperty(layerId, layoutProperty as any, value);
      }

      setCurrentStyle(map.current.getStyle());
    } catch (error) {
      console.error("Error updating layer property:", error);
    }
  };

  const addLayer = (layer: any) => {
    if (!map.current) return;

    try {
      map.current.addLayer(layer);
      setCurrentStyle(map.current.getStyle());
      saveStyleVersion(`Added layer: ${layer.id}`);
    } catch (error) {
      console.error("Error adding layer:", error);
    }
  };

  const removeLayer = (layerId: string) => {
    if (!map.current) return;

    try {
      map.current.removeLayer(layerId);
      setCurrentStyle(map.current.getStyle());
      saveStyleVersion(`Removed layer: ${layerId}`);
    } catch (error) {
      console.error("Error removing layer:", error);
    }
  };

  const updateStyle = () => {
    if (!map.current) return;
    setCurrentStyle(map.current.getStyle());
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Toolbar
        onExport={exportStyle}
        onImport={importStyle}
        onToggle3D={toggle3D}
        is3DEnabled={is3DEnabled}
        onSaveVersion={() => saveStyleVersion("Manual Save")}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full border-r bg-card">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-6 rounded-none border-b">
                <TabsTrigger value="global" className="flex items-center gap-1">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Global</span>
                </TabsTrigger>
                <TabsTrigger value="layers" className="flex items-center gap-1">
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">Layers</span>
                </TabsTrigger>
                <TabsTrigger value="style" className="flex items-center gap-1">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Style</span>
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-1">
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">Data</span>
                </TabsTrigger>
                <TabsTrigger
                  value="expression"
                  className="flex items-center gap-1"
                >
                  <Code className="w-4 h-4" />
                  <span className="hidden sm:inline">Code</span>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-1"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="global" className="h-full m-0">
                  <GlobalSettingsPanel
                    map={map.current}
                    currentStyle={currentStyle}
                    onUpdateStyle={updateStyle}
                  />
                </TabsContent>

                <TabsContent value="layers" className="h-full m-0">
                  <LayerPanel
                    map={map.current}
                    currentStyle={currentStyle}
                    selectedLayer={selectedLayer}
                    onSelectLayer={setSelectedLayer}
                    onUpdateLayer={updateLayerProperty}
                    onAddLayer={addLayer}
                    onRemoveLayer={removeLayer}
                  />
                </TabsContent>

                <TabsContent value="style" className="h-full m-0">
                  <StylePanel
                    map={map.current}
                    selectedLayer={selectedLayer}
                    currentStyle={currentStyle}
                    onUpdateLayer={updateLayerProperty}
                  />
                </TabsContent>

                <TabsContent value="data" className="h-full m-0">
                  <DataImportPanel
                    map={map.current}
                    onDataImported={(layerId) =>
                      saveStyleVersion(`Imported data: ${layerId}`)
                    }
                  />
                </TabsContent>

                <TabsContent value="expression" className="h-full m-0">
                  <ExpressionEditor
                    map={map.current}
                    selectedLayer={selectedLayer}
                    onUpdateLayer={updateLayerProperty}
                  />
                </TabsContent>

                <TabsContent value="history" className="h-full m-0">
                  <VersionHistory
                    styleHistory={styleHistory}
                    onLoadVersion={loadStyleVersion}
                    onSaveVersion={saveStyleVersion}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={75}>
          <div className="h-full relative">
            <div ref={mapContainer} className="w-full h-full" />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                  <p>Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
