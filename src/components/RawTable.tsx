/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  SlidersHorizontal,
  Download,
  AlertCircle
} from 'lucide-react';
import { Dataset, Column } from '../types';

interface RawTableProps {
  dataset: Dataset;
  filteredRows: any[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export default function RawTable({ 
  dataset, 
  filteredRows, 
  searchQuery, 
  onSearchQueryChange 
}: RawTableProps) {
  const columns = dataset.columns;

  // Sorting columns state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting function
  const sortedRows = useMemo(() => {
    let sortableItems = [...filteredRows];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredRows, sortConfig]);

  // Request sort column
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to page 1 on resort
  };

  // Pagination bounds calculation
  const totalItems = sortedRows.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  // Convert currently active table array back to CSV for direct browser download option
  const downloadActiveCSV = () => {
    if (filteredRows.length === 0) return;
    const headers = columns.map(col => col.name);
    const csvContent = [
      headers.join(','),
      ...filteredRows.map(row => 
        headers.map(fieldName => {
          const val = row[fieldName];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') ? `"${str}"` : str;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dataset.name}_filtered.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4" id="raw-table-component">
      {/* Table controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50/30" id="table-controls-bar">
        {/* Search Input filter */}
        <div className="relative flex-1 max-w-md" id="search-box-row">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            id="input-text-search-table"
            placeholder="Search records in all columns..."
            value={searchQuery}
            onChange={(e) => {
              onSearchQueryChange(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg pl-9.5 pr-4 py-2.5 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-3xs"
          />
        </div>

        {/* Action Controls (Export / Limit Selection) */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end" id="action-controls">
          <div className="flex items-center gap-2 text-xs" id="limit-box text">
            <SlidersHorizontal className="h-4 w-4 text-slate-450" />
            <span className="text-slate-500 font-bold">Page Limit:</span>
            <select
              id="select-table-pagelimit"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-indigo-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
            >
              <option value={10}>10 records</option>
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
            </select>
          </div>

          <button
            id="btn-download-filtered-csv"
            onClick={downloadActiveCSV}
            disabled={filteredRows.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 font-semibold border border-slate-200 rounded-lg text-xs transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:border-indigo-300"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Actual Data Table Grid */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm" id="table-pane">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" id="main-grid-table">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-200">
                {columns.map(col => {
                  const sorted = sortConfig && sortConfig.key === col.name;
                  return (
                    <th 
                      key={col.name} 
                      onClick={() => requestSort(col.name)}
                      className={`py-3 px-4 font-bold hover:bg-slate-100/50 cursor-pointer transitionSelect select-none text-slate-500 ${
                        col.type === 'number' ? 'text-right' : 'text-left'
                      }`}
                      style={{ minWidth: '120px' }}
                    >
                      <div className={`flex items-center gap-1.5 ${col.type === 'number' ? 'justify-end' : 'justify-start'}`}>
                        <span>{col.name}</span>
                        <ArrowUpDown className={`h-3 w-3 ${sorted ? 'text-indigo-600 font-bold' : 'text-slate-300'}`} />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100" id="main-grid-table-body">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-slate-400 font-bold bg-slate-50/20" id="empty-table-row">
                    <div className="flex flex-col items-center gap-1.5">
                      <AlertCircle className="h-5 w-5 text-slate-350" />
                      <span>No spreadsheet items matched active queries.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, rIdx) => (
                  <tr 
                    key={rIdx} 
                    id={`table-row-${rIdx}`}
                    className="hover:bg-slate-50/50 transition-all font-medium text-slate-600"
                  >
                    {columns.map(col => {
                      const val = row[col.name];
                      const displayVal = val === null || val === undefined ? '-' : String(val);
                      return (
                        <td 
                          key={col.name} 
                          className={`py-3 px-4 ${col.type === 'number' ? 'text-right font-mono' : 'text-left'}`}
                        >
                          {col.type === 'number' && val !== null ? Number(val).toLocaleString() : displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controller */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-1 bg-white" id="table-pagination">
          <span className="text-[11px] font-bold text-slate-400">
            Showing <span className="text-slate-700 font-extrabold">{((currentPage - 1) * pageSize) + 1}</span> to <span className="text-slate-700 font-extrabold">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="text-slate-700 font-extrabold">{totalItems}</span> rows
          </span>

          <div className="flex items-center gap-1" id="pagination-buttons">
            <button
              id="btn-pagination-prev"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 px-2.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition duration-155"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-0.5 text-xs font-bold px-2" id="pagination-indicator">
              <span className="text-indigo-600">Page {currentPage}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-400">{totalPages}</span>
            </div>

            <button
              id="btn-pagination-next"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 px-2.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition duration-155"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
