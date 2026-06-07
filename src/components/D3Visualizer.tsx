/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { HelpCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { Dataset } from '../types';

interface D3VisualizerProps {
  dataset: Dataset;
  filteredRows: any[];
}

export default function D3Visualizer({ dataset, filteredRows }: D3VisualizerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const columns = dataset.columns;
  const numColumns = useMemo(() => columns.filter(c => c.type === 'number'), [columns]);
  const catColumns = useMemo(() => columns.filter(c => c.type === 'string' || c.type === 'boolean'), [columns]);

  const [categoryKey, setCategoryKey] = useState<string>('');
  const [metricKey, setMetricKey] = useState<string>('');

  // Fallback defaults
  useEffect(() => {
    if (catColumns.length > 0) {
      setCategoryKey(catColumns[0].name);
    } else if (columns.length > 0) {
      setCategoryKey(columns[0].name);
    }

    if (numColumns.length > 0) {
      setMetricKey(numColumns[0].name);
    } else if (columns.length > 0) {
      setMetricKey(columns[0].name);
    }
  }, [dataset.id, catColumns, numColumns]);

  // Aggregate bubble dataset
  const bubbleData = useMemo(() => {
    if (!categoryKey || !metricKey || filteredRows.length === 0) return [];

    const map: Record<string, { name: string; value: number; count: number }> = {};
    for (const row of filteredRows) {
      const rawCat = row[categoryKey];
      const catVal = rawCat === null || rawCat === undefined ? '(Blank)' : String(rawCat);
      const metricVal = Math.max(0, Number(row[metricKey]) || 0); // prevent negative sizes

      if (!map[catVal]) {
        map[catVal] = { name: catVal, value: 0, count: 0 };
      }
      map[catVal].value += metricVal;
      map[catVal].count += 1;
    }

    return Object.values(map).map(item => ({
      name: item.name,
      value: Number((item.value).toFixed(1)),
      count: item.count
    })).filter(d => d.value > 0);
  }, [filteredRows, categoryKey, metricKey]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || bubbleData.length === 0) return;

    // Reset container first
    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll('*').remove();

    // Responsive sizing
    const width = containerRef.current.clientWidth || 500;
    const height = 360;

    // Create Hierarchy structure for D3 packing
    const root = d3.hierarchy({ children: bubbleData } as any)
      .sum(d => (d as any).value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Pack layout
    const pack = d3.pack()
      .size([width, height])
      .padding(8);

    pack(root);

    const nodes = root.leaves();

    // Color mapper d3 scales
    const colorScale = d3.scaleOrdinal()
      .domain(bubbleData.map(d => d.name))
      .range([
        '#4f46e5', // Indigo-600
        '#0ea5e9', // Sky-500
        '#10b981', // Emerald-500
        '#8b5cf6', // Violet-500
        '#f59e0b', // Amber-500
        '#f43f5e', // Rose-500
        '#14b8a6', // Teal-500
        '#475569'  // Cool slate
      ]);

    // Draw main container
    const g = svgEl
      .attr('width', width)
      .attr('height', height)
      .append('g');

    // Tooltip helper
    const tooltip = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('z-index', '1000')
      .style('visibility', 'hidden')
      .style('background', '#0f172a')
      .style('color', '#fff')
      .style('padding', '8px 12.5px')
      .style('border-radius', '8px')
      .style('font-size', '10px')
      .style('pointer-events', 'none')
      .style('box-shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1)');

    // Create parent grouping for nodes
    const nodeG = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    // Draw circles with bounce scale transition
    nodeG.append('circle')
      .attr('r', 0)
      .attr('fill', (d: any) => colorScale(d.data.name) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', '1.5px')
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 1px 1px rgba(0,0,0,0.03))')
      .on('mouseover', function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', d.r * 1.05);

        tooltip.html(`
          <div class="font-bold border-b border-white/10 pb-1 mb-1">${d.data.name}</div>
          <div>Total ${metricKey}: <span class="font-bold text-emerald-400">${Number(d.data.value).toLocaleString()}</span></div>
          <div class="text-[9px] opacity-70">Records: ${d.data.count} items</div>
        `);
        tooltip.style('visibility', 'visible');
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 15) + 'px');
      })
      .on('mouseout', function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', d.r);
        tooltip.style('visibility', 'hidden');
      })
      .transition()
      .duration(800)
      .delay((d: any, i: number) => i * 15)
      .attr('r', (d: any) => d.r);

    // Place labels
    nodeG.append('text')
      .attr('dy', '.3em')
      .style('text-anchor', 'middle')
      .style('font-size', (d: any) => `${Math.min(d.r / 3.5, 11)}px`)
      .style('font-weight', '700')
      .style('fill', '#fff')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .text((d: any) => d.r > 20 ? d.data.name : '')
      .transition()
      .duration(1000)
      .delay(400)
      .style('opacity', 1);

    return () => {
      tooltip.remove();
    };
  }, [bubbleData, metricKey]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" id="d3-visualizer-container">
      {/* Parameter Selection panel */}
      <div className="xl:col-span-1 p-5 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-sm" id="d3-controls">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-indigo-600" />
          <span>D3 Cluster Engine</span>
        </h3>

        <div className="space-y-1.5" id="d3-instructions">
          <p className="text-xs text-slate-500 leading-normal font-medium">
            This module renders an interactive **D3.js Pack Layout**. Each circle represents a unique category, sized proportionately using weighted sum values.
          </p>
        </div>

        {/* Grouping Category */}
        <div className="space-y-1" id="d3-xaxis-box">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Category variable</label>
          <select
            id="select-d3-cat"
            value={categoryKey}
            onChange={(e) => setCategoryKey(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-200 rounded-lg p-2.5 outline-hidden transition-colors cursor-pointer animate-fadeIn"
          >
            {catColumns.map(col => (
              <option key={col.name} value={col.name}>{col.name}</option>
            ))}
          </select>
        </div>

        {/* Metric Size Variable */}
        <div className="space-y-1" id="d3-yaxis-box">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Bubble Size weight</label>
          <select
            id="select-d3-metric"
            value={metricKey}
            onChange={(e) => setMetricKey(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-200 rounded-lg p-2.5 outline-hidden transition-colors cursor-pointer animate-fadeIn"
          >
            {numColumns.map(col => (
              <option key={col.name} value={col.name}>{col.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Specialty Viewport (SVG canvas inside right panel) */}
      <div className="xl:col-span-3 p-6 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col justify-between" id="d3-canvas">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100" id="d3-header">
          <div>
            <h4 className="text-base font-bold text-slate-800">D3 Bubble Proportions Matrix</h4>
            <p className="text-xs text-slate-400">
               Visualizing <span className="font-semibold text-indigo-650">{categoryKey}</span> segmented by sum of <span className="font-semibold text-indigo-650">{metricKey}</span>
            </p>
          </div>
        </div>

        <div className="py-4 flex items-center justify-center w-full" ref={containerRef} id="d3-canvas-body">
          {bubbleData.length === 0 ? (
            <div className="w-full h-80 flex flex-col items-center justify-center text-slate-400 font-bold" id="d3-nodata">
              No cluster indices found. Adjust category variables.
            </div>
          ) : (
            <svg ref={svgRef} className="max-w-full overflow-visible" id="d3-svg-element" />
          )}
        </div>
      </div>
    </div>
  );
}
