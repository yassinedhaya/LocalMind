export type OutputType = 'note' | 'task' | 'table' | 'text';

export interface DetectedOutput {
  type: OutputType;
  title: string;
  content: string;
  confidence: number;
}
