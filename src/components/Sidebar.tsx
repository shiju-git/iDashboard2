/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Settings2, 
  Database,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Type as StringIcon,
  Binary as NumberIcon,
  Trash2
} from 'lucide-react';
import { Dataset, Column } from '../types';
import { PRESET_DATASETS } from '../utils/presetDatasets';
import { parseCSV, inferSchema } from '../utils/dataParser';

interface SidebarProps {
  activeDataset: Dataset;
  onDatasetSelect: (dataset: Dataset) => void;
  onCustomDatasetUpload: (dataset: Dataset) => void;
  customDatasets: Dataset[];
  onDeleteCustomDataset: (id: string) => void;
}

export default function Sidebar({
  activeDataset,
  onDatasetSelect,
  onCustomDatasetUpload,
  customDatasets,
  onDeleteCustomDataset
}: SidebarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'tsv', 'json'].includes(extension || '')) {
      setUploadError('Unsupported format. Please upload CSV, TSV, or JSON.');
      return;
    }

    try {
      const text = await file.text();
      let rows: any[] = [];
      const datasetName = file.name.replace(/\.[^/.]+$/, ""); // Strip extension

      if (extension === 'json') {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else if (extension === 'tsv') {
        // Simple tabs replace then parse csv as tab delimiter
        const normalizedText = text.replace(/,/g, ' ').replace(/\t/g, ',');
        rows = parseCSV(normalizedText);
      } else {
        rows = parseCSV(text);
      }

      if (rows.length === 0) {
        setUploadError('The uploaded file contains no readable tables or rows.');
        return;
      }

      const columns = inferSchema(rows);
      const newDataset: Dataset = {
        id: `uploaded_${Date.now()}`,
        name: file.name,
        rows,
        columns,
        source: 'upload'
      };

      onCustomDatasetUpload(newDataset);
    } catch (err: any) {
      console.error(err);
      setUploadError(`Failed to parse file: ${err.message || 'Malformed structure'}`);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getColIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <NumberIcon className="h-4 w-4 text-emerald-600" id="col-icon-num" />;
      case 'date':
        return <Calendar className="h-4 w-4 text-amber-600" id="col-icon-date" />;
      case 'boolean':
        return <CheckCircle2 className="h-4 w-4 text-indigo-600" id="col-icon-bool" />;
      default:
        return <StringIcon className="h-4 w-4 text-blue-600" id="col-icon-str" />;
    }
  };

  return (
    <div className="w-80 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden" id="dashboard-sidebar">
      {/* Title Header with professional theme */}
      <div className="p-5 border-b border-slate-200 flex items-center gap-3" id="sidebar-header">
        <div className="w-8.5 h-8.5 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm" id="logo-container">
          <FileSpreadsheet className="h-4.5 w-4.5 text-white" id="logo-icon" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-800" id="sidebar-app-name">VizioData <span className="text-indigo-600">Pro</span></h1>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider" id="sidebar-tagline">Advanced Analytics</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6" id="sidebar-scroller">
        {/* Dataset Selection */}
        <div className="space-y-3" id="presets-section">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Database className="h-3.5 w-3.5" />
            <span>Select Dataset</span>
          </div>

          <div className="space-y-1.5" id="presets-list">
            {PRESET_DATASETS.map((preset) => {
              const active = activeDataset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`btn-preset-${preset.id}`}
                  onClick={() => onDatasetSelect(preset)}
                  className={`w-full text-left p-3 rounded-lg text-xs font-semibold border transition-all duration-200 flex items-center justify-between group ${
                    active 
                      ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/10'
                  }`}
                >
                  <span className="truncate pr-2">{preset.name}</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-colors ${
                    active 
                      ? 'bg-white/20 border-white/30 text-white/90' 
                      : 'bg-slate-100 border-slate-200 text-slate-500 group-hover:bg-slate-200/50'
                  }`}>
                    {preset.rows.length} rows
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Uploaded Datasets */}
        {customDatasets.length > 0 && (
          <div className="space-y-3" id="uploaded-section">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Upload className="h-3.5 w-3.5" />
              <span>Uploaded Datasets</span>
            </h2>
            <div className="space-y-1.5" id="uploaded-list">
              {customDatasets.map((ds) => {
                const active = activeDataset.id === ds.id;
                return (
                  <div 
                    key={ds.id} 
                    id={`custom-${ds.id}`}
                    className={`group w-full flex items-center justify-between p-1 rounded-lg border transition-all ${
                      active 
                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/10'
                    }`}
                  >
                    <button
                      id={`btn-select-custom-${ds.id}`}
                      onClick={() => onDatasetSelect(ds)}
                      className="flex-1 text-left py-2 px-2 text-xs font-semibold truncate"
                    >
                      {ds.name}
                    </button>
                    <button
                      id={`btn-delete-custom-${ds.id}`}
                      onClick={() => onDeleteCustomDataset(ds.id)}
                      className={`p-1.5 mr-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white ${
                        active ? 'text-indigo-200 hover:bg-white/10' : 'text-slate-400'
                      }`}
                      title="Remove uploaded data"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upload Container Area with Polished guidelines style */}
        <div className="space-y-3" id="uploader-section">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload New Data</span>
          </h2>
          
          <div
            id="drag-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-indigo-400 bg-indigo-50/50 shadow-inner' 
                : 'border-slate-200 hover:border-indigo-300 bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.tsv,.json"
              className="hidden"
              id="file-input-raw"
            />
            <div className="flex flex-col items-center gap-2" id="uploader-content">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-1" id="upload-icon-box">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700" id="upload-main-text">Upload CSV or JSON</p>
              <p className="text-[10px] text-slate-400 font-medium" id="upload-sub-text">Drag & drop files here</p>
            </div>
          </div>
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs leading-relaxed" id="upload-error-display">
              {uploadError}
            </div>
          )}
        </div>

        {/* Active Dataset Schema Columns details */}
        <div className="space-y-3" id="schema-columns-section">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Settings2 className="h-3.5 w-3.5" />
            <span>Detected Fields ({activeDataset.columns.length})</span>
          </h2>
          <div className="space-y-1.5 overflow-hidden rounded-lg border border-slate-100 bg-slate-50/30 p-2 max-h-56 overflow-y-auto" id="columns-scroller">
            {activeDataset.columns.map((col) => (
              <div 
                key={col.name} 
                id={`col.item-${col.name}`}
                className="flex items-center justify-between p-2 rounded bg-white border border-slate-100 group hover:border-slate-300 transition-all text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {getColIcon(col.type)}
                  <span className="font-semibold text-slate-700 truncate" title={col.name}>{col.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100">
                    {col.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
