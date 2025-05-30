"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { History, Download, RotateCcw, Save } from "lucide-react"
import { useState } from "react"

interface MapStyle {
  id: string
  name: string
  style: any
  timestamp: Date
}

interface VersionHistoryProps {
  styleHistory: MapStyle[]
  onLoadVersion: (version: MapStyle) => void
  onSaveVersion: (name: string) => void
}

export function VersionHistory({ styleHistory, onLoadVersion, onSaveVersion }: VersionHistoryProps) {
  const [versionName, setVersionName] = useState("")

  const handleSaveVersion = () => {
    if (!versionName.trim()) return
    onSaveVersion(versionName)
    setVersionName("")
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp)
  }

  const exportVersion = (version: MapStyle) => {
    const dataStr = JSON.stringify(version.style, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `${version.name.replace(/\s+/g, "-").toLowerCase()}.json`
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-medium mb-2">Version History</h3>
          <p className="text-sm text-muted-foreground">Track and manage different versions of your map style</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Current Version
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="version-name">Version Name</Label>
              <Input
                id="version-name"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="Enter version name"
                className="mt-2"
              />
            </div>
            <Button onClick={handleSaveVersion} disabled={!versionName.trim()} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Version
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />
              Saved Versions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {styleHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No saved versions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {styleHistory.map((version, index) => (
                  <div key={version.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{version.name}</h4>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Latest
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => onLoadVersion(version)}>
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Load
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => exportVersion(version)}>
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatTimestamp(version.timestamp)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Version Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Versions are automatically saved when you make significant changes</p>
              <p>• You can manually save versions with custom names</p>
              <p>• Load any previous version to revert changes</p>
              <p>• Export individual versions as JSON files</p>
              <p>• Only the last 10 versions are kept in history</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
