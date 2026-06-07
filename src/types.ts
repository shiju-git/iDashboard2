/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ColumnType = 'number' | 'string' | 'date' | 'boolean';

export interface Column {
  name: string;
  type: ColumnType;
  uniqueCount: number;
}

export interface DataRow {
  [key: string]: any;
}

export interface Dataset {
  id: string;
  name: string;
  columns: Column[];
  rows: DataRow[];
  source: 'preset' | 'upload';
}

export type ChartType = 'bar' | 'line' | 'area' | 'scatter' | 'pie' | 'radar';

export interface ChartConfig {
  type: ChartType;
  xAxisKey: string;
  yAxisKey: string;
  groupByKey: string; // optional categorical column for partitioning
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
}

export interface NumericalFilter {
  columnName: string;
  min: number;
  max: number;
  currentMin: number;
  currentMax: number;
}

export interface CategoricalFilter {
  columnName: string;
  allValues: string[];
  selectedValues: string[];
}

export interface SearchFilter {
  query: string;
  columnNames: string[];
}

export interface FilterState {
  numerical: NumericalFilter[];
  categorical: CategoricalFilter[];
  search: SearchFilter;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isPending?: boolean;
}

export interface ColumnStats {
  columnName: string;
  sum: number;
  avg: number;
  min: number;
  max: number;
  count: number;
  values: number[];
}
