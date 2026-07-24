/**
 * JSON Generator
 * Export utilities for dictionary entries
 */

import { Entry } from '../models/Dictionary';

/**
 * Export entries to CSV format
 */
function exportEntriesToCSV(entries: Entry[]): string {
  const headers = ['dz', 'en', 'example', 'exampleEn', 'audio'];
  const rows = entries.map((entry) =>
    headers
      .map((h) => {
        const value = entry[h as keyof Entry] as string;
        // Escape quotes and wrap in quotes if contains comma
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Download entries as CSV
 */
export function downloadEntriesAsCSV(entries: Entry[], filename: string = 'dictionary.csv'): void {
  const csv = exportEntriesToCSV(entries);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
