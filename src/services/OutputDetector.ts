import type { DetectedOutput, OutputType } from '../types/outputTypes';

const NOTE_PATTERNS = [
  /^(note|summary|key points|recap|tl;?dr)[:\s]/im,
  /^(here['']?s (a |the )?(summary|note|recap))/im,
  /\b(summarize|summarise)\b.*\n/i,
];

const TASK_PATTERNS = [
  /^todo[\s:]/im,
  /^(tasks?|action items?|next steps?|checklist)[:\s]/im,
  /[-*]\s*\[ \].*(\n|$)/,
  /[-*]\s*\w+.*(\n|$)/,
];

const TABLE_PATTERNS = [
  /\|.+\|.+\|\s*\n\|\s*[-:]+\s*\|/,
  /^(\|.*\|.*\n){2,}/m,
];

function scorePatterns(text: string, patterns: RegExp[]): number {
  let score = 0;
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      score += matches.length;
    }
  }
  return score;
}

function extractTitle(text: string, type: OutputType): string {
  const firstLine = text.split('\n')[0].trim();
  const cleaned = firstLine.replace(/^[-*#]+\s*/, '').replace(/[:\s]+$/, '');
  if (cleaned.length > 0 && cleaned.length < 80) {
    return cleaned;
  }
  const prefix = type === 'note' ? 'Note' : type === 'task' ? 'Task List' : 'Table';
  return `${prefix} – ${new Date().toLocaleDateString()}`;
}

export function detectOutputType(text: string): DetectedOutput {
  if (!text || text.trim().length === 0) {
    return { type: 'text', title: '', content: text, confidence: 0 };
  }

  const noteScore = scorePatterns(text, NOTE_PATTERNS);
  const taskScore = scorePatterns(text, TASK_PATTERNS);
  const tableScore = scorePatterns(text, TABLE_PATTERNS);

  const scores: Array<{ type: OutputType; score: number }> = [
    { type: 'note', score: noteScore },
    { type: 'task', score: taskScore },
    { type: 'table', score: tableScore },
  ];

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  if (best.score === 0) {
    return { type: 'text', title: '', content: text, confidence: 0 };
  }

  const maxScore = Math.max(1, best.score, scores[1]?.score ?? 0);
  const confidence = best.score / maxScore;

  return {
    type: best.type,
    title: extractTitle(text, best.type),
    content: text,
    confidence: Math.min(1, confidence),
  };
}
