"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Upload,
  Mountain,
  Save,
  Share,
  Settings,
} from "lucide-react";

interface ToolbarProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggle3D: () => void;
  is3DEnabled: boolean;
  onSaveVersion: () => void;
}

export function Toolbar({
  onExport,
  onImport,
  onToggle3D,
  is3DEnabled,
  onSaveVersion,
}: ToolbarProps) {
  return (
    <div className="border-b bg-card px-4 py-2 flex items-center gap-2">
      <div className="flex items-center gap-2">
        <img src="/logo.svg" alt="Logo" className="w-7 h-7 mr-2" />
        <h1 className="font-semibold text-lg">3DMapFi Map Editor</h1>
        <Separator orientation="vertical" className="h-6" />
      </div>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={onSaveVersion}>
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>

        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>

        <Button variant="outline" size="sm" asChild>
          <label htmlFor="import-style" className="cursor-pointer">
            <Upload className="w-4 h-4 mr-1" />
            Import
          </label>
        </Button>
        <Input
          id="import-style"
          type="file"
          accept=".json"
          onChange={onImport}
          className="hidden"
        />

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant={is3DEnabled ? "default" : "outline"}
          size="sm"
          onClick={onToggle3D}
        >
          <Mountain className="w-4 h-4 mr-1" />
          3D
        </Button>

        <Button variant="outline" size="sm">
          <Share className="w-4 h-4 mr-1" />
          Share
        </Button>

        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
