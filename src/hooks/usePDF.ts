import { useCallback, useState } from 'react';
import { pickFile, extractPdfText } from '../native/GemmaBridge';
import { buildPrompt } from '../agents/promptBuilder';
import { PDF_AGENT_CONFIG } from '../agents/pdfAgent';
import { chunkText, ExtractResult } from '../services/PDFExtractor';
import { GemmaService } from '../services/GemmaService';
import { EngineManager } from '../services/EngineManager';

export interface PdfQuestion {
  id: string;
  question: string;
  answer: string;
}

interface PickedDoc {
  name: string;
  base64: string;
}

let qCounter = 0;

export function usePDF() {
  const [doc, setDoc] = useState<{ name: string; extracted: ExtractResult } | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState<PdfQuestion[]>([]);

  const pickPdf = useCallback(async () => {
    setDocError(null);
    try {
      const picked = await pickFile('application/pdf');
      if (!picked) {
        return;
      }
      const name = (picked.uri.split('/').pop() || 'document.pdf').replace(/\?.*$/, '');
      setLoadingDoc(true);

      // Extract text natively (Android PdfRenderer) from the copied file path.
      const res = await extractPdfText(picked.path);
      const text = (res.text ?? '').trim();
      if (!text) {
        setDocError('Could not extract text from this PDF (it may be scanned/image-only).');
        setLoadingDoc(false);
        return;
      }
      const extracted: ExtractResult = { text, pages: res.pages ?? 0 };
      setDoc({ name, extracted });
      setHistory([]);
      setAnswer('');
      setQuestion('');
      setLoadingDoc(false);
    } catch (e) {
      setDocError(e instanceof Error ? e.message : 'Failed to read PDF');
      setLoadingDoc(false);
    }
  }, []);

  const ask = useCallback(
    async (q: string) => {
      if (!doc || !q.trim() || asking) return;
      setAsking(true);
      setAnswer('');

      const chunks = chunkText(doc.extracted.text);
      // Use the most relevant chunk (first match, else first chunk).
      const lowerQ = q.toLowerCase();
      const relevant =
        chunks.find((c) => c.toLowerCase().includes(lowerQ.split(' ')[0] ?? '')) ?? chunks[0];

      const prompt = buildPrompt(
        PDF_AGENT_CONFIG,
        `Question: ${q}\n\nDocument excerpt:\n${relevant}`
      );

      // Ensure engine is ready for a downloaded model.
      const modelId = EngineManager.getCurrentModelId();
      if (modelId && !EngineManager.isInitialized()) {
        await EngineManager.initEngine(modelId);
      }

      const res = await GemmaService.generateRaw(prompt);
      const text = res.success ? res.data : 'Error: could not generate an answer.';
      setAnswer(text);
      qCounter += 1;
      setHistory((prev) => [
        ...prev,
        { id: `pq-${qCounter}`, question: q, answer: text },
      ]);
      setAsking(false);
    },
    [doc, asking]
  );

  const clearDoc = useCallback(() => {
    setDoc(null);
    setHistory([]);
    setAnswer('');
    setQuestion('');
    setDocError(null);
  }, []);

  return {
    doc,
    loadingDoc,
    docError,
    question,
    setQuestion,
    asking,
    answer,
    history,
    pickPdf,
    ask,
    clearDoc,
  };
}
