/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Compass, 
  PieChart as PieIcon,
  HelpCircle,
  RefreshCw,
  ScatterChart as ScatterIcon
} from 'lucide-react';
import { Dataset, ChartType, Column } from '../types';

interface ChartPlaygroundProps {
  dataset: Dataset;
  filteredRows: any[];
}

const COLORS = [
  '#4f46e5', // indigo-600
  '#0ea5e9', // sky-500
  '#10b981', // emerald-550
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#f43f5e', // rose-500
  '#14b8a6', // teal-500
  '#06b6d4'  // cyan-500
];

export default function ChartPlayground({ dataset, filteredRows }: ChartPlaygroundProps) {
  // Available keys
  const columns = dataset.columns;
  const numColumns = useMemo(() => columns.filter(c => c.type === 'number'), [columns]);
  const catColumns = useMemo(() => columns.filter(c => c.type === 'string' || c.type === 'boolean' || c.type === 'date'), [columns]);

  // Chart configuration state
  const [chartType, setChartType] = useState<ChartType>('line');
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [yAxisKey, setYAxisKey] = useState<string>('');
  const [groupByKey, setGroupByKey] = useState<string>('none');
  const [aggregation, setAggregation] = useState<'none' | 'sum' | 'avg' | 'count'>('none');

  // Auto-fallbacks on dataset loading
  React.useEffect(() => {
    if (columns.length > 0) {
      // Find a reasonable X-axis candidate (Date, Category, String first, else first item)
      const dateCol = columns.find(c => c.type === 'date');
      const strCol = columns.find(c => c.type === 'string');
      const initialX = dateCol?.name || strCol?.name || columns[0].name;
      setXAxisKey(initialX);

      // Find Y-axis candidate (Numerical)
      if (numColumns.length > 0) {
        setYAxisKey(numColumns[0].name);
      } else {
        setYAxisKey(columns[0].name);
      }

      setGroupByKey('none');
      setAggregation('none');
    }
  }, [dataset.id, columns, numColumns]);

  // Data processing engine
  const processedData = useMemo(() => {
    if (filteredRows.length === 0) return [];

    // Aggregated Mode State
    if (aggregation !== 'none') {
      const aggregates: Record<string, { totalVal: number; count: number; rawKey: any; partitions: Record<string, number> }> = {};
      
      for (const row of filteredRows) {
        const xVal = row[xAxisKey] === null || row[xAxisKey] === undefined ? '(Blank)' : String(row[xAxisKey]);
        const yVal = Number(row[yAxisKey]) || 0;
        const gVal = groupByKey !== 'none' && row[groupByKey] !== undefined ? String(row[groupByKey]) : 'Value';

        if (!aggregates[xVal]) {
          aggregates[xVal] = { totalVal: 0, count: 0, rawKey: row[xAxisKey], partitions: {} };
        }
        
        aggregates[xVal].totalVal += yVal;
        aggregates[xVal].count += 1;
        
        if (!aggregates[xVal].partitions[gVal]) {
          aggregates[xVal].partitions[gVal] = 0;
        }
        aggregates[xVal].partitions[gVal] += yVal; // for sum partitioning
      }

      return Object.entries(aggregates).map(([x, meta]) => {
        const item: Record<string, any> = { [xAxisKey]: meta.rawKey };
        
        if (groupByKey === 'none') {
          if (aggregation === 'sum') {
            item[yAxisKey] = meta.totalVal;
          } else if (aggregation === 'avg') {
            item[yAxisKey] = Number((meta.totalVal / meta.count).toFixed(2));
          } else if (aggregation === 'count') {
            item[yAxisKey] = meta.count;
          }
        } else {
          // Calculate partitioned aggregates
          Object.entries(meta.partitions).forEach(([gKey, gSum]) => {
            if (aggregation === 'sum') {
              item[gKey] = gSum;
            } else if (aggregation === 'avg') {
              // average partitioning takes a bit more state but fits sum/count ratio beautifully
              item[gKey] = Number((gSum / meta.count).toFixed(2));
            } else if (aggregation === 'count') {
              item[gKey] = meta.count;
            }
          });
        }
        return item;
      });
    }

    // Partition logic when aggregation is 'none' but groupByKey is not 'none'
    // To handle group series correctly in recharts, we sort and return standard raw items
    // Recharts supports drawing multiple lines or bars when they exist in the pivot row representation.
    if (groupByKey !== 'none') {
      // Find all unique values of groupByKey
      const groupValues = Array.from(new Set(filteredRows.map(r => String(r[groupByKey]))));
      
      // Pivot rows by XAxis index
      const pivoted: Record<string, any> = {};
      filteredRows.forEach(row => {
        const xVal = String(row[xAxisKey]);
        if (!pivoted[xVal]) {
          pivoted[xVal] = { [xAxisKey]: row[xAxisKey] };
        }
        const gVal = String(row[groupByKey]);
        pivoted[xVal][gVal] = Number(row[yAxisKey]) || 0;
      });

      return Object.values(pivoted);
    }

    // Default: Sort by X-axis chronologically if dates
    const rawCopy = [...filteredRows];
    const xCol = columns.find(c => c.name === xAxisKey);
    if (xCol?.type === 'date') {
      rawCopy.sort((a, b) => new Date(a[xAxisKey]).getTime() - new Date(b[xAxisKey]).getTime());
    } else if (xCol?.type === 'number') {
      rawCopy.sort((a, b) => Number(a[xAxisKey]) - Number(b[xAxisKey]));
    }

    return rawCopy;
  }, [filteredRows, xAxisKey, yAxisKey, groupByKey, aggregation]);

  // List of series names to map over for legends and multiple lines/bars
  const activeSeriesKeys = useMemo(() => {
    if (groupByKey !== 'none') {
      const uniqueSourceVals = Array.from(new Set(filteredRows.map(r => String(r[groupByKey]))));
      return uniqueSourceVals;
    }
    return [yAxisKey];
  }, [processedData, yAxisKey, groupByKey, filteredRows]);

  const renderChartComponent = () => {
    if (processedData.length === 0) {
      return (
        <div className="w-full h-80 flex flex-col items-center justify-center text-slate-400 font-medium" id="chart-nodata">
          No records match active filters. Take off filters or load presets.
        </div>
      );
    }

    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={processedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} id="chart-area-draw">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
              {activeSeriesKeys.map((series, idx) => (
                <Area 
                  key={series} 
                  type="monotone" 
                  dataKey={series} 
                  stroke={COLORS[idx % COLORS.length]} 
                  fill={COLORS[idx % COLORS.length]} 
                  fillOpacity={0.12} 
                  strokeWidth={2.5} 
                  name={series}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={processedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} id="chart-bar-draw">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
              {activeSeriesKeys.map((series, idx) => (
                <Bar 
                  key={series} 
                  dataKey={series} 
                  fill={COLORS[idx % COLORS.length]} 
                  radius={[4, 4, 0, 0]}
                  name={series}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }} id="chart-scatter-draw">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={11} name={xAxisKey} />
              <YAxis dataKey={yAxisKey} stroke="#94a3b8" fontSize={11} name={yAxisKey} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Scatter name={`${yAxisKey} vs ${xAxisKey}`} data={processedData} fill={COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'pie':
        // Pie chart makes the most sense if we aggregate categorical unique groups
        const pieData = processedData.slice(0, 8).map(row => ({
          name: String(row[xAxisKey]),
          value: Number(row[yAxisKey]) || 0
        })).filter(item => item.value > 0);

        return (
          <ResponsiveContainer width="100%" height={380}>
            <PieChart id="chart-pie-draw">
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px' }} />
              <Legend iconType="circle" formatter={(value) => <span className="text-slate-600 font-medium">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'radar':
        // Standard spiderweb chart mapping categorical axes inside standard metrics
        const radarData = processedData.slice(0, 10).map(row => ({
          subject: String(row[xAxisKey]),
          score: Number(row[yAxisKey]) || 0
        }));

        return (
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData} id="chart-radar-draw">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
              <PolarRadiusAxis stroke="#e2e8f0" fontSize={9} />
              <Radar name={yAxisKey} dataKey="score" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.25} />
              <Tooltip contentStyle={{ borderRadius: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        );
      default: // line
        return (
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={processedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} id="chart-line-draw">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
              {activeSeriesKeys.map((series, idx) => (
                <Line 
                  key={series} 
                  type="monotone" 
                  dataKey={series} 
                  stroke={COLORS[idx % COLORS.length]} 
                  strokeWidth={2.5} 
                  dot={{ r: 3, strokeWidth: 1 }} 
                  activeDot={{ r: 5 }}
                  name={series}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" id="chart-playground-wrapper">
      {/* Visual Configuration Sidebar (Left Panel 1col) */}
      <div className="xl:col-span-1 p-5 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-sm" id="chart-controls-box">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-600" />
          <span>Chart Config</span>
        </h3>

        {/* Chart Type Map */}
        <div className="space-y-1.5" id="plot-types-grid">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Visual Style</span>
          <div className="grid grid-cols-3 gap-1" id="plot-button-grid">
            {[
              { id: 'line', label: 'Line', icon: TrendingUp },
              { id: 'area', label: 'Area', icon: Activity },
              { id: 'bar', label: 'Bar', icon: BarChart3 },
              { id: 'scatter', label: 'Scatter', icon: ScatterIcon },
              { id: 'pie', label: 'Pie', icon: PieIcon },
              { id: 'radar', label: 'Radar', icon: Compass }
            ].map((type) => {
              const active = chartType === type.id;
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  id={`btn-chart-type-${type.id}`}
                  onClick={() => setChartType(type.id as ChartType)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] font-bold transition-all duration-200 ${
                    active 
                      ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-650 hover:border-indigo-300 hover:bg-indigo-50/10'
                  }`}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* X-Axis Selector */}
        <div className="space-y-1" id="ctrl-xaxis">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">X Axis dimension</label>
          <select
            id="select-chart-xaxis"
            value={xAxisKey}
            onChange={(e) => setXAxisKey(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-200 rounded-lg p-2.5 outline-hidden transition-colors cursor-pointer"
          >
            {columns.map(col => (
              <option key={col.name} value={col.name}>{col.name} ({col.type})</option>
            ))}
          </select>
        </div>

        {/* Y-Axis Metrics Selector */}
        <div className="space-y-1" id="ctrl-yaxis">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Y Axis measure</label>
          <select
            id="select-chart-yaxis"
            value={yAxisKey}
            onChange={(e) => setYAxisKey(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-200 rounded-lg p-2.5 outline-hidden transition-colors cursor-pointer"
          >
            {numColumns.map(col => (
              <option key={col.name} value={col.name}>{col.name}</option>
            ))}
          </select>
        </div>

        {/* Partition (Group By Key) Selector */}
        <div className="space-y-1" id="ctrl-groupby">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <span>Color Group series</span>
          </label>
          <select
            id="select-chart-groupby"
            value={groupByKey}
            onChange={(e) => setGroupByKey(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-200 rounded-lg p-2.5 outline-hidden transition-colors cursor-pointer"
          >
            <option value="none">None (Single series)</option>
            {catColumns.slice(0, 4).map(col => (
              <option key={col.name} value={col.name}>{col.name}</option>
            ))}
          </select>
        </div>

        {/* Aggregation Selector */}
        <div className="space-y-1" id="ctrl-agg">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Data Aggregation</label>
          <select
            id="select-chart-aggregation"
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value as any)}
            className="w-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-200 rounded-lg p-2.5 outline-hidden transition-colors cursor-pointer"
          >
            <option value="none">None (Plot raw indices)</option>
            <option value="sum">Sum aggregates</option>
            <option value="avg">Average aggregates</option>
            <option value="count">Count aggregates</option>
          </select>
        </div>
      </div>

      {/* Main Plot Area (Right Panel 3cols) */}
      <div className="xl:col-span-3 p-6 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col justify-between" id="chart-view-box">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100" id="chart-view-header">
          <div>
            <h4 className="text-base font-bold text-slate-800" id="chart-view-title">
              {chartType.toUpperCase()} Graph Projection
            </h4>
            <p className="text-xs text-slate-400" id="chart-view-subtitle">
              Mapping <span className="font-semibold text-indigo-650">{xAxisKey || '(X-Axis)'}</span> against <span className="font-semibold text-indigo-650">{yAxisKey || '(Y-Axis)'}</span>
              {groupByKey !== 'none' && <> grouped by <span className="font-semibold text-slate-650">{groupByKey}</span></>}
              {aggregation !== 'none' && <> using <span className="font-semibold text-slate-650">{aggregation} calculation</span></>}
            </p>
          </div>
        </div>

        <div className="py-6 flex items-center justify-center w-full" id="chart-actual-draw-panel">
          {renderChartComponent()}
        </div>
      </div>
    </div>
  );
}
