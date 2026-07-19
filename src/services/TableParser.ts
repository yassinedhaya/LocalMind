import type { TableColumn, TableRow } from '../types/tableTypes';

let colCounter = 0;
let rowCounter = 0;

function nextColId(): string {
  colCounter += 1;
  return `col-${colCounter}`;
}

function nextRowId(): string {
  rowCounter += 1;
  return `row-${rowCounter}`;
}

export function parseMarkdownTable(markdown: string): { columns: TableColumn[]; rows: TableRow[] } | null {
  const lines = markdown.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const headerMatch = lines[0].match(/^\|(.+)\|$/);
  if (!headerMatch) return null;

  const headerNames = headerMatch[1].split('|').map((s) => s.trim()).filter(Boolean);
  if (headerNames.length === 0) return null;

  const separatorLine = lines[1];
  const separatorParts = separatorLine.split('|').map((s) => s.trim()).filter(Boolean);
  const columns: TableColumn[] = headerNames.map((name, i) => {
    const sep = separatorParts[i] || '---';
    let align: 'left' | 'center' | 'right' | undefined;
    if (/^:?-+:?$/.test(sep)) {
      if (sep.startsWith(':') && sep.endsWith(':')) align = 'center';
      else if (sep.endsWith(':')) align = 'right';
      else if (sep.startsWith(':')) align = 'left';
    }
    return { id: nextColId(), name, align };
  });

  const dataLines = lines.slice(2);
  const rows: TableRow[] = [];
  for (const line of dataLines) {
    const match = line.match(/^\|(.+)\|$/);
    if (!match) continue;
    const values = match[1].split('|').map((s) => s.trim());
    const cells: Record<string, string> = {};
    columns.forEach((col, i) => {
      cells[col.id] = values[i] || '';
    });
    if (Object.values(cells).some((v) => v.length > 0)) {
      rows.push({ id: nextRowId(), cells });
    }
  }

  if (columns.length === 0) return null;
  return { columns, rows };
}

export function createEmptyTable(columns: string[]): { columns: TableColumn[]; rows: TableRow[] } {
  const cols: TableColumn[] = columns.map((name) => ({
    id: nextColId(),
    name,
  }));
  const cells: Record<string, string> = {};
  cols.forEach((c) => { cells[c.id] = ''; });
  const rows: TableRow[] = [{ id: nextRowId(), cells }];
  return { columns: cols, rows };
}
