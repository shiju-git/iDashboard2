/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Database,
  BarChart2, 
  Activity, 
  Sparkles, 
  Table2,
  Calendar,
  Grid3X3,
  Bot,
  Filter,
  X,
  HelpCircle,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import ChartPlayground from './components/ChartPlayground';
import D3Visualizer from './components/D3Visualizer';
import RawTable from './components/RawTable';
import AiAnalyst from './components/AiAnalyst';
import { Dataset, Column, CategoricalFilter, NumericalFilter } from './types';
import { PRESET_DATASETS } from './utils/presetDatasets';

export default function App() {
  // Datasets state
  const [activeDataset, setActiveDataset] = useState<Dataset>(PRESET_DATASETS[0]);
  const [customDatasets, setCustomDatasets] = useState<Dataset[]>([]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'recharts' | 'd3' | 'raw' | 'ai'>('overview');

  // Interactive filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string[]>>({});
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);

  // Categorical options calculations
  const categoricalColumns = useMemo(() => {
    return activeDataset.columns.filter(col => col.type === 'string' || col.type === 'boolean');
  }, [activeDataset]);

  const uniqueCategoryValues = useMemo(() => {
    const values: Record<string, string[]> = {};
    categoricalColumns.forEach(col => {
      const unique = Array.from(
        new Set(
          activeDataset.rows
            .map(row => row[col.name])
            .filter(v => v !== null && v !== undefined)
            .map(v => String(v))
        )
      ).slice(0, 10); // cap at 10 items to prevent UI swelling
      values[col.name] = unique;
    });
    return values;
  }, [activeDataset, categoricalColumns]);

  // Handle active dataset switches
  const handleDatasetChange = (dataset: Dataset) => {
    setActiveDataset(dataset);
    setSearchQuery('');
    setSelectedCategories({});
    setShowFilterPanel(false);
  };

  // Add uploaded custom dataset
  const handleCustomDatasetUpload = (newDataset: Dataset) => {
    setCustomDatasets(prev => [newDataset, ...prev]);
    setActiveDataset(newDataset);
    setSearchQuery('');
    setSelectedCategories({});
    setShowFilterPanel(false);
  };

  // Delete custom dataset
  const handleDeleteCustomDataset = (id: string) => {
    setCustomDatasets(prev => {
      const nextList = prev.filter(ds => ds.id !== id);
      // Reset if deleted the active one
      if (activeDataset.id === id) {
        setActiveDataset(nextList.length > 0 ? nextList[0] : PRESET_DATASETS[0]);
      }
      return nextList;
    });
  };

  // Toggle checklist category items
  const handleCategoryToggle = (columnName: string, value: string) => {
    setSelectedCategories(prev => {
      const activeValues = prev[columnName] ? [...prev[columnName]] : [];
      if (activeValues.includes(value)) {
        const next = activeValues.filter(v => v !== value);
        return { ...prev, [columnName]: next };
      } else {
        const next = [...activeValues, value];
        return { ...prev, [columnName]: next };
      }
    });
  };

  // Filter evaluation pipeline
  const filteredRows = useMemo(() => {
    return activeDataset.rows.filter(row => {
      // 1. Live text search check
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesAnyColumn = Object.values(row).some(cell => {
          if (cell === null || cell === undefined) return false;
          return String(cell).toLowerCase().includes(q);
        });
        if (!matchesAnyColumn) return false;
      }

      // 2. Multiselect Categorical checks
      for (const [colName, selectedVals] of Object.entries(selectedCategories)) {
        if (selectedVals.length === 0) continue; // empty implies all are allowed
        const rowVal = row[colName] === null || row[colName] === undefined ? '(Blank)' : String(row[colName]);
        if (!selectedVals.includes(rowVal)) {
          return false;
        }
      }

      return true;
    });
  }, [activeDataset.rows, searchQuery, selectedCategories]);

  // Count total active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== '') count++;
    Object.values(selectedCategories).forEach(vals => {
      if (vals.length > 0) count++;
    });
    return count;
  }, [searchQuery, selectedCategories]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories({});
  };

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans antialiased text-[#111827]" id="app-view">
      {/* Dynamic Sidebar */}
      <Sidebar
        activeDataset={activeDataset}
        onDatasetSelect={handleDatasetChange}
        onCustomDatasetUpload={handleCustomDatasetUpload}
        customDatasets={customDatasets}
        onDeleteCustomDataset={handleDeleteCustomDataset}
      />

      {/* Main Panel Content coordinates */}
      <div className="flex-1 flex flex-col overflow-hidden" id="main-workbench">
        {/* Navigation / Metric Header Bar */}
        <header className="h-16 border-b border-[#e5e7eb] bg-white px-8 flex items-center justify-between shrink-0" id="workbench-header">
          {/* Section tab keys */}
          <div className="flex items-center gap-2.5" id="tab-nav-rack">
            {[
              { id: 'overview', label: 'Bento Summary', icon: Grid3X3 },
              { id: 'recharts', label: 'Graphs', icon: Activity },
              { id: 'd3', label: 'D3 Clusters', icon: BarChart2 },
              { id: 'raw', label: 'Spreadsheet', icon: Table2 },
              { id: 'ai', label: 'AI Analyst', icon: Bot, badge: 'Smart' }
            ].map(tab => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`btn-tab-nav-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-tight transition duration-150 ${
                    active 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-3xs' 
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span id="tab-badge-ai" className="text-[9px] px-1.5 py-0.2 bg-indigo-600 text-white rounded font-bold uppercase tracking-wider animate-pulse ml-0.5">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick filter widget togglers */}
          <div className="flex items-center gap-3" id="header-right-tools">
            {activeFiltersCount > 0 && (
              <button
                id="btn-clear-all-filters-header"
                onClick={resetAllFilters}
                className="text-[10px] uppercase tracking-wider font-extrabold text-rose-600 hover:text-rose-700 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-md transition"
              >
                Clear ({activeFiltersCount}) Filters
              </button>
            )}

            <button
              id="btn-toggle-filter-panel"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-1.5 p-2 px-3 border rounded-xl text-xs font-semibold transition ${
                showFilterPanel || activeFiltersCount > 0
                  ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Filter className="h-3.5 w-3.5 font-bold" />
              <span>Slices & Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full" id="pill-active-filters">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Global Collapsible checklist Filter slider */}
        {showFilterPanel && (
          <div className="border-b border-gray-200 bg-white p-5 px-8 flex flex-col gap-4 animate-fadeIn shadow-xs" id="interactive-filter-drawer">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2" id="filter-drawer-header">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Multi-Dimensional Segmentation Panels</span>
              </h3>
              <button id="btn-close-filter-drawer" onClick={() => setShowFilterPanel(false)} className="text-gray-400 hover:text-slate-800 p-0.5 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            {categoricalColumns.length === 0 ? (
              <p className="text-xs text-gray-400" id="empty-filters">This active matrix does not feature distinct category columns to segregate values.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="filter-cards-grid">
                {categoricalColumns.map(col => {
                  const values = uniqueCategoryValues[col.name] || [];
                  const selected = selectedCategories[col.name] || [];
                  return (
                    <div key={col.name} className="space-y-2 border border-slate-100 p-3 rounded-xl bg-slate-50/30" id={`filter-box-${col.name}`}>
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight">{col.name}</span>
                      <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1" id={`checklist-scroller-${col.name}`}>
                        {values.length === 0 ? (
                          <span className="text-[10px] text-gray-400 italic">No values</span>
                        ) : (
                          values.map(val => {
                            const isChecked = selected.includes(val);
                            return (
                              <label 
                                key={val} 
                                id={`label-filter-${col.name}-${val}`}
                                className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-800 transition select-none"
                              >
                                <input
                                  type="checkbox"
                                  id={`checkbox-filter-${col.name}-${val}`}
                                  checked={isChecked}
                                  onChange={() => handleCategoryToggle(col.name, val)}
                                  className="h-3.5 w-3.5 rounded-sm border-gray-300 accent-slate-900 focus:outline-hidden"
                                />
                                <span className={isChecked ? 'text-slate-950 font-semibold' : ''}>{val}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Context Canvas Viewer */}
        <main className="flex-1 overflow-y-auto p-8" id="workbench-arena">
          <div className="max-w-7xl mx-auto" id="arena-scroller-bounds">
            {activeTab === 'overview' && <Overview dataset={activeDataset} />}
            {activeTab === 'recharts' && <ChartPlayground dataset={activeDataset} filteredRows={filteredRows} />}
            {activeTab === 'd3' && <D3Visualizer dataset={activeDataset} filteredRows={filteredRows} />}
            {activeTab === 'raw' && (
              <RawTable 
                dataset={activeDataset} 
                filteredRows={filteredRows}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
              />
            )}
            {activeTab === 'ai' && <AiAnalyst dataset={activeDataset} filteredRows={filteredRows} />}
          </div>
        </main>
      </div>
    </div>
  );
}
