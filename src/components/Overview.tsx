/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Hash, 
  Percent, 
  Award, 
  HelpCircle,
  FolderMinus, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { Dataset, Column, ColumnStats } from '../types';

interface OverviewProps {
  dataset: Dataset;
}

export default function Overview({ dataset }: OverviewProps) {
  const numColumns = useMemo(() => {
    return dataset.columns.filter(col => col.type === 'number');
  }, [dataset.columns]);

  // Track which columns are chosen for the primary KPI slots
  const [slotA, setSlotA] = useState<string>('');
  const [slotB, setSlotB] = useState<string>('');

  // Auto-select starting slots when numerical columns change or load
  React.useEffect(() => {
    if (numColumns.length > 0) {
      setSlotA(numColumns[0].name);
      setSlotB(numColumns[1]?.name || numColumns[0].name);
    } else {
      setSlotA('');
      setSlotB('');
    }
  }, [numColumns]);

  // Utility to calculate stats for a column
  const calculateStats = (colName: string): ColumnStats | null => {
    if (!colName) return null;
    const values = dataset.rows
      .map(row => Number(row[colName]))
      .filter(val => !isNaN(val) && val !== null && val !== undefined);

    if (values.length === 0) return null;

    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      columnName: colName,
      sum,
      avg,
      min,
      max,
      count: values.length,
      values
    };
  };

  const statsA = useMemo(() => calculateStats(slotA), [slotA, dataset.rows]);
  const statsB = useMemo(() => calculateStats(slotB), [slotB, dataset.rows]);

  const uniqueRecordCount = dataset.rows.length;

  const formatNumber = (num: number) => {
    if (num === null || num === undefined) return '0';
    if (Math.abs(num) >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    }
    if (Math.abs(num) >= 1e3) {
      return (num / 1e3).toFixed(1) + 'k';
    }
    if (num % 1 !== 0) {
      return num.toFixed(2);
    }
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6" id="overview-component">
      {/* Visual KPI Banner with polished Indigo system gradient */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-slate-900 rounded-2xl text-white shadow-md relative overflow-hidden" id="overview-hero">
        {/* Subtle geometric design block */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10" id="hero-left">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 bg-indigo-500/20 text-indigo-300 rounded text-[9px] font-bold uppercase tracking-widest">
              Active Repository Context
            </span>
            <span className="text-[10px] text-slate-400 font-bold">&#8226;</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" /> Stable
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1" id="hero-title">{dataset.name}</h2>
          <p className="text-xs text-slate-400" id="hero-subtitle">
            Automated analytic pipeline compiling <span className="font-semibold text-white">{uniqueRecordCount} records</span> and <span className="font-semibold text-white">{dataset.columns.length} indices</span>.
          </p>
        </div>
        
        <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 self-stretch md:self-auto justify-around z-10" id="hero-stats-box">
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total Rows</p>
            <p className="text-2xl font-extrabold tracking-tight text-white mt-0.5">{uniqueRecordCount.toLocaleString()}</p>
          </div>
          <div className="w-[1px] h-10 bg-white/15" id="divider-hero" />
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Columns</p>
            <p className="text-2xl font-extrabold tracking-tight text-white mt-0.5">{dataset.columns.length}</p>
          </div>
          <div className="w-[1px] h-10 bg-white/15" id="divider-hero-2" />
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Numerical</p>
            <p className="text-2xl font-extrabold tracking-tight text-white mt-0.5">{numColumns.length}</p>
          </div>
        </div>
      </div>

      {/* Primary KPI Selection controls */}
      {numColumns.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="kpi-grids">
          {/* Card Slot A */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between" id="kpi-card-a">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2" id="kpi-card-header-a">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Primary Metric Highlight</span>
                <select 
                  id="select-kpi-slot-a"
                  value={slotA} 
                  onChange={(e) => setSlotA(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 focus:outline-hidden transition-colors cursor-pointer"
                >
                  {numColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </div>

              {statsA && (
                <div className="space-y-1" id="kpi-body-a">
                  <span className="text-xs text-indigo-600 font-bold uppercase tracking-widest">Accumulated Sum</span>
                  <p className="text-4xl font-extrabold tracking-tight text-slate-800" id="kpi-value-a">
                    {formatNumber(statsA.sum)}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">Aggregated totals over all metrics</p>
                </div>
              )}
            </div>

            {statsA && (
              <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100" id="kpi-mini-metrics-a">
                <div className="space-y-0.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Average</span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">{formatNumber(statsA.avg)}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Peak Max</span>
                  <span className="text-xs font-bold text-slate-700 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100/30 inline-block">{formatNumber(statsA.max)}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Lowest Min</span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">{formatNumber(statsA.min)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Card Slot B */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between" id="kpi-card-b">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2" id="kpi-card-header-b">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Secondary Metric Highlight</span>
                <select 
                  id="select-kpi-slot-b"
                  value={slotB} 
                  onChange={(e) => setSlotB(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 focus:outline-hidden transition-colors cursor-pointer"
                >
                  {numColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </div>

              {statsB && (
                <div className="space-y-1" id="kpi-body-b">
                  <span className="text-xs text-indigo-600 font-bold uppercase tracking-widest">Arithmetic Average</span>
                  <p className="text-4xl font-extrabold tracking-tight text-slate-800" id="kpi-value-b">
                    {formatNumber(statsB.avg)}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">Calculated mean index value</p>
                </div>
              )}
            </div>

            {statsB && (
              <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100" id="kpi-mini-metrics-b">
                <div className="space-y-0.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Sum</span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">{formatNumber(statsB.sum)}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Peak Max</span>
                  <span className="text-xs font-bold text-slate-700 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100/30 inline-block">{formatNumber(statsB.max)}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Lowest Min</span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">{formatNumber(statsB.min)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-10 border border-dashed rounded-2xl bg-slate-50/50 text-center" id="empty-overview-card">
          <FolderMinus className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Numerical Columns Detected</h3>
          <p className="text-xs text-slate-400 mt-1">This dataset does not contain any obvious metric or float data columns to run sums or aggregations on.</p>
        </div>
      )}

      {/* Grid of details for other categories / numeric columns */}
      {numColumns.length > 0 && (
        <div className="space-y-3" id="additional-metrics-table">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Metric Dimension Analytics</h3>
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm" id="additional-metrics-wrapper">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-250">
                    <th className="py-3 px-5 font-bold">Variable Name</th>
                    <th className="py-3 px-5 text-right font-bold">Sum Total</th>
                    <th className="py-3 px-5 text-right font-bold font-semibold text-indigo-600">Arithmetic Mean</th>
                    <th className="py-3 px-5 text-right font-bold">Local Min</th>
                    <th className="py-3 px-5 text-right font-bold">Local Max</th>
                    <th className="py-3 px-5 text-right font-bold text-slate-400">Sample Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {numColumns.map(col => {
                    const stats = calculateStats(col.name);
                    if (!stats) return null;
                    return (
                      <tr key={col.name} className="hover:bg-indigo-50/5 transition-all text-xs font-medium text-slate-600">
                        <td className="py-3.5 px-5 font-bold text-slate-800">{col.name}</td>
                        <td className="py-3.5 px-5 text-right font-bold text-slate-900">{formatNumber(stats.sum)}</td>
                        <td className="py-3.5 px-5 text-right font-bold text-indigo-600">{formatNumber(stats.avg)}</td>
                        <td className="py-3.5 px-5 text-right text-slate-500">{formatNumber(stats.min)}</td>
                        <td className="py-3.5 px-5 text-right text-slate-500">{formatNumber(stats.max)}</td>
                        <td className="py-3.5 px-5 text-right text-slate-400 font-mono text-[10px]">{stats.count} values</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
