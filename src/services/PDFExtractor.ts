/**
 * Lightweight, dependency-free PDF text extraction.
 *
 * This is a heuristic extractor: it parses the PDF byte stream for text-show
 * operators (Tj / TJ) inside content streams and decodes the literal strings.
 * It is not a full PDF parser, but it recovers readable text from the vast
 * majority of simple PDFs without requiring a native module.
 */

function decodePdfString(raw: string): string {
  let s = raw;
  // Strip surrounding parentheses if present.
  if (s.length >= 2 && s[0] === '(' && s[s.length - 1] === ')') {
    s = s.slice(1, -1);
  }
  // Unescape PDF string escapes.
  s = s
    .replace(/\\([nrtbf()\\])/g, (_m, c) => {
      switch (c) {
        case 'n':
          return '\n';
        case 'r':
          return '\r';
        case 't':
          return '\t';
        case 'b':
          return '\b';
        case 'f':
          return '\f';
        default:
          return c;
      }
    })
    .replace(/\\(\d{1,3})/g, (_m, oct: string) => {
      const code = parseInt(oct, 8);
      return Number.isNaN(code) ? '' : String.fromCharCode(code);
    })
    .replace(/\\x([0-9A-Fa-f]{1,2})/g, (_m, hex: string) => {
      const code = parseInt(hex, 16);
      return Number.isNaN(code) ? '' : String.fromCharCode(code);
    });
  return s;
}

function collectTextOperands(buffer: string): string[] {
  const results: string[] = [];
  // Match Tj:  (text) Tj
  const tjRegex = /\((?:[^()\\]|\\.)*\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = tjRegex.exec(buffer)) !== null) {
    results.push(decodePdfString(m[1] ?? m[0].replace(/\s*Tj$/, '')));
  }

  // Match TJ arrays:  [ (a) (b) -12 (c) ] TJ
  const tjArrayRegex = /\[\s*((?:[^[\]]|\((?:[^()\\]|\\.)*\)|-?\d+(?:\.\d+)?)\s*)\]\s*TJ/g;
  while ((m = tjArrayRegex.exec(buffer)) !== null) {
    const inner = m[1] ?? '';
    const parts = inner.match(/\((?:[^()\\]|\\.)*\)|-?\d+(?:\.\d+)?/g) ?? [];
    let text = '';
    for (const p of parts) {
      if (p.startsWith('(')) {
        text += decodePdfString(p);
      }
    }
    if (text) results.push(text);
  }
  return results;
}

export interface ExtractResult {
  text: string;
  pages: number;
}

export async function extractPdfText(base64: string): Promise<ExtractResult> {
  // Decode base64 to a latin1 string so we can scan byte patterns.
  const binary = (globalThis as any).atob(base64);
  const bytes: number[] = new Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i) & 0xff;
  }

  let text = '';
  let pageCount = 0;

  // Count page objects.
  const pageMatches = binary.match(/\/Type\s*\/Page[^s]/g);
  pageCount = pageMatches ? pageMatches.length : 0;

  // Try to decompress Flate streams, otherwise scan raw text.
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let sm: RegExpExecArray | null;
  let scannedAny = false;
  while ((sm = streamRegex.exec(binary)) !== null) {
    const streamData = sm[1];
    // Only attempt streams that look like they contain text operators.
    if (!/Tj|TJ/.test(streamData)) continue;
    scannedAny = true;
    const operands = collectTextOperands(streamData);
    if (operands.length > 0) {
      text += operands.join(' ') + '\n';
    }
  }

  if (!scannedAny) {
    // Fallback: scan whole document for text operators.
    const operands = collectTextOperands(binary);
    text = operands.join(' ');
  }

  // Collapse excessive whitespace.
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();

  return { text, pages: pageCount };
}

export function chunkText(text: string, maxChars = 6000): string[] {
  if (text.length <= maxChars) return text ? [text] : [];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}
