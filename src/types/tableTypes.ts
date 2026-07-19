export interface TableColumn {
  id: string;
  name: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableRow {
  id: string;
  cells: Record<string, string>;
}

export interface TableData {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: TableRow[];
  createdAt: number;
  updatedAt: number;
  tags: string[];
}
