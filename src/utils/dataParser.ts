/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Column, ColumnType, DataRow } from '../types';

/**
 * Parses a standard CSV string into DataRow entries.
 * Handles quoted cells with escaped string commas.
 */
export function parseCSV(text: string): DataRow[] {
  const result: DataRow[] = [];
  if (!text || text.trim().length === 0) return result;

  const lines: string[] = [];
  let currentWord = '';
  let inQuotes = false;
  
  // Safe simple parser that respects quotes and backslashes
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === '\r') {
      // ignore carriages
    } else if (char === '\n' && !inQuotes) {
      lines.push(currentWord);
      currentWord = '';
    } else {
      currentWord += char;
    }
  }
  if (currentWord.trim() || text.endsWith('\n')) {
    lines.push(currentWord);
  }

  if (lines.length < 1) return result;

  // Process headers
  const headers = splitCSVLine(lines[0]).map(h => h.trim().replace(/^"(.*)"$/, '$1'));
  if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) return result;

  // Process rows
  for (let idx = 1; idx < lines.length; idx++) {
    const line = lines[idx];
    if (!line.trim()) continue;

    const cells = splitCSVLine(line).map(c => c.trim().replace(/^"(.*)"$/, '$1'));
    const row: DataRow = {};
    
    for (let h = 0; h < headers.length; h++) {
      const cellVal = cells[h];
      const headerName = headers[h] || `Column_${h}`;
      
      if (cellVal === undefined || cellVal === '') {
        row[headerName] = null;
      } else {
        row[headerName] = autoCastValue(cellVal);
      }
    }
    result.push(row);
  }

  return result;
}

function splitCSVLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char; // Keep quotes to strip later gently
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function autoCastValue(val: string): any {
  const trimmed = val.trim();
  if (trimmed === '') return null;
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;
  
  // Check if it's a number (avoid octal or mixed text)
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return Number(trimmed);
  }

  // Check if it's a valid Datetime string (ISO format, YYYY-MM-DD, etc)
  const isDatePattern = /^\d{4}-\d{2}-\d{2}/.test(trimmed);
  if (isDatePattern) {
    const dateObj = new Date(trimmed);
    if (!isNaN(dateObj.getTime())) {
      return trimmed; // we store dates as string for consistent display, but identify as date type
    }
  }

  return val;
}

/**
 * Infers types and calculates basic statistics for columns
 */
export function inferSchema(rows: DataRow[]): Column[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  const columns: Column[] = [];

  for (const key of keys) {
    if (!key) continue;
    
    // Type counting
    let numberCount = 0;
    let booleanCount = 0;
    let dateCount = 0;
    let nullCount = 0;
    let stringCount = 0;
    const uniqueValues = new Set<any>();

    for (const row of rows) {
      const val = row[key];
      if (val === null || val === undefined) {
        nullCount++;
        continue;
      }
      uniqueValues.add(val);

      if (typeof val === 'number') {
        numberCount++;
      } else if (typeof val === 'boolean') {
        booleanCount++;
      } else if (typeof val === 'string') {
        // Double check if date pattern
        const isDatePattern = /^\d{4}-\d{2}-\d{2}/.test(val);
        if (isDatePattern && !isNaN(new Date(val).getTime())) {
          dateCount++;
        } else {
          stringCount++;
        }
      }
    }

    const totalValid = rows.length - nullCount;
    let inferredType: ColumnType = 'string';

    if (totalValid > 0) {
      if (numberCount / totalValid > 0.7) {
        inferredType = 'number';
      } else if (dateCount / totalValid > 0.7) {
        inferredType = 'date';
      } else if (booleanCount / totalValid > 0.7) {
        inferredType = 'boolean';
      }
    }

    columns.push({
      name: key,
      type: inferredType,
      uniqueCount: uniqueValues.size
    });
  }

  return columns;
}
