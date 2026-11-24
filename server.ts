import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRIMARY_MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please check your API key in the Settings > Secrets panel.',
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function slugifyId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}-${Math.random().toString(36).slice(2, 6)}`;
}

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('503') ||
    msg.includes('500') ||
    msg.includes('504') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('DEADLINE_EXCEEDED') ||
    msg.includes('high demand') ||
    msg.includes('overloaded')
  );
}

async function generateJsonWithRetry<T>(
  prompt: string,
  systemInstruction: string,
  responseSchema: Record<string, unknown>,
): Promise<T> {
  const ai = getAiClient();
  const attempts: { model: string; useLowThinking: boolean; delayBeforeMs: number }[] = [
    { model: PRIMARY_MODEL, useLowThinking: true, delayBeforeMs: 0 },
    { model: FALLBACK_MODEL, useLowThinking: false, delayBeforeMs: 250 },
    { model: FALLBACK_MODEL, useLowThinking: false, delayBeforeMs: 1000 },
  ];

  let lastError: unknown;

  for (const step of attempts) {
    if (step.delayBeforeMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, step.delayBeforeMs));
    }
    try {
      const response = await ai.models.generateContent({
        model: step.model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          ...(step.useLowThinking
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('Model returned an empty response.');
      }
      return JSON.parse(rawText) as T;
    } catch (err) {
      lastError = err;
      if (!isTransientError(err)) {
        throw err;
      }
    }
  }

  throw lastError;
}

function extractReadableErrorMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string }; message?: string };
    if (parsed?.error?.message) return parsed.error.message;
    if (parsed?.message) return parsed.message;
  } catch {
    // Raw message is not JSON
  }
  return raw;
}

function formatApiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : 'An unexpected error occurred.';
  const clean = extractReadableErrorMessage(raw);

  if (
    raw.includes('GEMINI_API_KEY') ||
    raw.includes('API_KEY_INVALID') ||
    raw.includes('403') ||
    raw.includes('PERMISSION_DENIED')
  ) {
    return {
      status: 401,
      message:
        'Unable to authenticate with Gemini API. Please check or select your API key in the Settings > Secrets panel.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message:
        'AI quota is temporarily exhausted. Please wait a moment and try again, or check your API key tier in Settings > Secrets.',
    };
  }
  if (isTransientError(err)) {
    return {
      status: 503,
      message:
        'The AI service is experiencing temporary high demand. Please try again in a few seconds.',
    };
  }
  return {
    status: 500,
    message: clean,
  };
}

const analyzeDecisionSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'Clean, concise title summarizing the decision.',
    },
    summary: {
      type: Type.STRING,
      description: 'Two crisp sentences framing the core tension and tradeoffs of this decision.',
    },
    options: {
      type: Type.ARRAY,
      description: '2 to 4 concrete, mutually distinct options to compare.',
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING, description: 'Short stable key like opt_1, opt_2.' },
          name: { type: Type.STRING, description: 'Concise option label (2-6 words).' },
          tagline: { type: Type.STRING, description: 'Short 6-12 word summary of this option.' },
        },
        required: ['key', 'name', 'tagline'],
      },
    },
    prosCons: {
      type: Type.ARRAY,
      description: 'Pros and cons list for each option.',
      items: {
        type: Type.OBJECT,
        properties: {
          optionKey: { type: Type.STRING },
          pros: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                impact: { type: Type.STRING, description: 'One of: high, medium, low' },
              },
              required: ['text', 'impact'],
            },
          },
          cons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                impact: { type: Type.STRING, description: 'One of: high, medium, low' },
              },
              required: ['text', 'impact'],
            },
          },
        },
        required: ['optionKey', 'pros', 'cons'],
      },
    },
    comparisonRows: {
      type: Type.ARRAY,
      description: '5 to 7 concrete comparison table dimensions across all options.',
      items: {
        type: Type.OBJECT,
        properties: {
          dimension: { type: Type.STRING, description: 'Row dimension label (e.g., Upfront Cost, Time Commitment).' },
          cells: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                optionKey: { type: Type.STRING },
                value: { type: Type.STRING, description: 'Concrete, crisp cell value (no vague filler).' },
              },
              required: ['optionKey', 'value'],
            },
          },
        },
        required: ['dimension', 'cells'],
      },
    },
    swot: {
      type: Type.ARRAY,
      description: 'SWOT analysis for each option.',
      items: {
        type: Type.OBJECT,
        properties: {
          optionKey: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
          threats: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['optionKey', 'strengths', 'weaknesses', 'opportunities', 'threats'],
      },
    },
    criteria: {
      type: Type.ARRAY,
      description: '5 to 6 decision criteria with suggested importance weights from 1 to 10.',
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING, description: 'Short stable key like crit_1, crit_2.' },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          weight: { type: Type.INTEGER, description: 'Importance weight integer from 1 to 10.' },
        },
        required: ['key', 'name', 'description', 'weight'],
      },
    },
    scores: {
      type: Type.ARRAY,
      description: 'Score from 1 to 10 for every (criterionKey, optionKey) pair with a crisp rationale.',
      items: {
        type: Type.OBJECT,
        properties: {
          criterionKey: { type: Type.STRING },
          optionKey: { type: Type.STRING },
          score: { type: Type.INTEGER, description: 'Score integer from 1 to 10.' },
          rationale: { type: Type.STRING, description: 'One concise sentence explaining this score.' },
        },
        required: ['criterionKey', 'optionKey', 'score', 'rationale'],
      },
    },
    blindSpots: {
      type: Type.ARRAY,
      description: '3 sharp, non-obvious questions or hidden risks to verify before deciding.',
      items: { type: Type.STRING },
    },
    tiebreakerAdvice: {
      type: Type.STRING,
      description: '2 sentences explaining the single most decisive factor that separates the top options.',
    },
  },
  required: [
    'title',
    'summary',
    'options',
    'prosCons',
    'comparisonRows',
    'swot',
    'criteria',
    'scores',
    'blindSpots',
    'tiebreakerAdvice',
  ],
};

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' ? Math.round(value) : Number.parseInt(String(value), 10);
  if (Number.isNaN(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function normalizeImpact(value: string): 'high' | 'medium' | 'low' {
  const lower = String(value || '').toLowerCase();
  if (lower === 'high' || lower === 'medium' || lower === 'low') return lower;
  return 'medium';
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/analyze-decision', async (req: Request, res: Response) => {
    try {
      const { decisionPrompt, context, options, criteria } = req.body as {
        decisionPrompt?: string;
        context?: string;
        options?: string[];
        criteria?: string[];
      };

      const cleanedPrompt = (decisionPrompt ?? '').trim();
      if (!cleanedPrompt || cleanedPrompt.length < 4) {
        res.status(400).json({ error: 'Please describe the decision you want to make.' });
        return;
      }

      const cleanedOptions = Array.isArray(options)
        ? options.map((o) => String(o).trim()).filter(Boolean).slice(0, 5)
        : [];
      const cleanedCriteria = Array.isArray(criteria)
        ? criteria.map((c) => String(c).trim()).filter(Boolean).slice(0, 8)
        : [];
      const cleanedContext = (context ?? '').trim();

      const promptParts = [
        `Decision to evaluate: ${cleanedPrompt}`,
        cleanedContext ? `Additional context & constraints: ${cleanedContext}` : '',
        cleanedOptions.length >= 2
          ? `User-specified options (use these exact options): ${cleanedOptions.join(' | ')}`
          : cleanedOptions.length === 1
            ? `User mentioned one option ("${cleanedOptions[0]}") — include it and identify 1 to 2 natural alternative options (such as status quo or a strong alternative).`
            : 'Identify the 2 to 3 clearest, most realistic options implied by this decision.',
        cleanedCriteria.length > 0
          ? `Include these user-requested criteria in the weighted matrix (and add more if needed to reach 5-6 total): ${cleanedCriteria.join(', ')}`
          : 'Create 5 to 6 genuinely distinct, practical evaluation criteria tailored to this decision.',
      ].filter(Boolean);

      const systemInstruction =
        'You are an analytical, impartial decision strategist for an application called The Tiebreaker. ' +
        'Provide sharp, concrete, real-world analysis — never generic fluff or corporate buzzwords. ' +
        'Every option must have 3-4 specific pros and 3-4 specific cons, 3 items in each SWOT quadrant, ' +
        '5-7 concrete comparison table rows, and honest differentiated scores (avoid giving every option 7/10; use the full 2-9 range where warranted). ' +
        'Ensure every optionKey in prosCons, comparisonRows.cells, swot, and scores matches the exact keys defined in options, ' +
        'and every criterionKey in scores matches the exact keys defined in criteria.';

      interface RawAnalysis {
        title: string;
        summary: string;
        options: { key: string; name: string; tagline: string }[];
        prosCons: {
          optionKey: string;
          pros: { text: string; impact: string }[];
          cons: { text: string; impact: string }[];
        }[];
        comparisonRows: {
          dimension: string;
          cells: { optionKey: string; value: string }[];
        }[];
        swot: {
          optionKey: string;
          strengths: string[];
          weaknesses: string[];
          opportunities: string[];
          threats: string[];
        }[];
        criteria: { key: string; name: string; description: string; weight: number }[];
        scores: { criterionKey: string; optionKey: string; score: number; rationale: string }[];
        blindSpots: string[];
        tiebreakerAdvice: string;
      }

      const raw = await generateJsonWithRetry<RawAnalysis>(
        promptParts.join('\n'),
        systemInstruction,
        analyzeDecisionSchema,
      );

      const now = new Date().toISOString();
      const optionKeyToId = new Map<string, string>();
      const normalizedOptions = (raw.options ?? []).map((opt, idx) => {
        const id = slugifyId('opt', idx);
        optionKeyToId.set(opt.key, id);
        return {
          id,
          name: opt.name.trim(),
          tagline: (opt.tagline ?? '').trim(),
        };
      });

      const resolveOptionId = (key: string, fallbackIdx = 0): string => {
        if (optionKeyToId.has(key)) return optionKeyToId.get(key)!;
        const byName = normalizedOptions.find(
          (o) => o.name.toLowerCase() === String(key).toLowerCase(),
        );
        if (byName) return byName.id;
        return normalizedOptions[fallbackIdx]?.id ?? normalizedOptions[0]?.id ?? 'opt-1';
      };

      const criterionKeyToId = new Map<string, string>();
      const normalizedCriteria = (raw.criteria ?? []).map((crit, idx) => {
        const id = slugifyId('crit', idx);
        criterionKeyToId.set(crit.key, id);
        return {
          id,
          name: crit.name.trim(),
          description: (crit.description ?? '').trim(),
          weight: clampInt(crit.weight, 1, 10, 5),
        };
      });

      const normalizedProsCons = normalizedOptions.map((opt, idx) => {
        const matched = (raw.prosCons ?? []).find(
          (pc) => resolveOptionId(pc.optionKey, -1) === opt.id,
        ) ?? raw.prosCons?.[idx];
        return {
          optionId: opt.id,
          pros: (matched?.pros ?? []).map((p, i) => ({
            id: slugifyId('pro', idx * 10 + i),
            text: p.text.trim(),
            impact: normalizeImpact(p.impact),
          })),
          cons: (matched?.cons ?? []).map((c, i) => ({
            id: slugifyId('con', idx * 10 + i),
            text: c.text.trim(),
            impact: normalizeImpact(c.impact),
          })),
        };
      });

      const normalizedComparisonRows = (raw.comparisonRows ?? []).map((row, rIdx) => {
        const values: Record<string, string> = {};
        for (const opt of normalizedOptions) {
          values[opt.id] = '—';
        }
        for (const cell of row.cells ?? []) {
          const optId = resolveOptionId(cell.optionKey);
          values[optId] = (cell.value ?? '—').trim();
        }
        return {
          id: slugifyId('row', rIdx),
          dimension: row.dimension.trim(),
          values,
        };
      });

      const normalizedSwot = normalizedOptions.map((opt, idx) => {
        const matched = (raw.swot ?? []).find(
          (s) => resolveOptionId(s.optionKey, -1) === opt.id,
        ) ?? raw.swot?.[idx];
        return {
          optionId: opt.id,
          strengths: (matched?.strengths ?? []).map((s) => s.trim()).filter(Boolean),
          weaknesses: (matched?.weaknesses ?? []).map((s) => s.trim()).filter(Boolean),
          opportunities: (matched?.opportunities ?? []).map((s) => s.trim()).filter(Boolean),
          threats: (matched?.threats ?? []).map((s) => s.trim()).filter(Boolean),
        };
      });

      const normalizedScores: {
        criterionId: string;
        optionId: string;
        score: number;
        rationale: string;
      }[] = [];

      for (const crit of normalizedCriteria) {
        const critKeys = [...criterionKeyToId.entries()]
          .filter(([, id]) => id === crit.id)
          .map(([k]) => k);

        for (const opt of normalizedOptions) {
          const optKeys = [...optionKeyToId.entries()]
            .filter(([, id]) => id === opt.id)
            .map(([k]) => k);

          const found = (raw.scores ?? []).find(
            (s) => critKeys.includes(s.criterionKey) && optKeys.includes(s.optionKey),
          );

          normalizedScores.push({
            criterionId: crit.id,
            optionId: opt.id,
            score: clampInt(found?.score, 1, 10, 5),
            rationale: (found?.rationale ?? 'Estimated baseline score; adjust to match your situation.').trim(),
          });
        }
      }

      const decision = {
        id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: (raw.title || cleanedPrompt).trim(),
        context: cleanedContext,
        summary: (raw.summary ?? '').trim(),
        createdAt: now,
        updatedAt: now,
        options: normalizedOptions,
        prosCons: normalizedProsCons,
        comparisonRows: normalizedComparisonRows,
        swot: normalizedSwot,
        criteria: normalizedCriteria,
        scores: normalizedScores,
        blindSpots: (raw.blindSpots ?? []).map((b) => b.trim()).filter(Boolean),
        tiebreakerAdvice: (raw.tiebreakerAdvice ?? '').trim(),
        devilsAdvocate: null,
      };

      res.json({ decision });
    } catch (err) {
      const { status, message } = formatApiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/evaluate-option', async (req: Request, res: Response) => {
    try {
      const {
        decisionTitle,
        context,
        existingOptions,
        newOptionName,
        criteria,
        comparisonDimensions,
      } = req.body as {
        decisionTitle?: string;
        context?: string;
        existingOptions?: { id: string; name: string }[];
        newOptionName?: string;
        criteria?: { id: string; name: string; description: string }[];
        comparisonDimensions?: { id: string; dimension: string }[];
      };

      const cleanedOption = (newOptionName ?? '').trim();
      if (!cleanedOption || !decisionTitle) {
        res.status(400).json({ error: 'Please provide an option name to evaluate.' });
        return;
      }

      const schema = {
        type: Type.OBJECT,
        properties: {
          tagline: { type: Type.STRING, description: 'Short 6-12 word summary of this new option.' },
          pros: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                impact: { type: Type.STRING },
              },
              required: ['text', 'impact'],
            },
          },
          cons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                impact: { type: Type.STRING },
              },
              required: ['text', 'impact'],
            },
          },
          comparisonCells: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dimensionId: { type: Type.STRING },
                value: { type: Type.STRING },
              },
              required: ['dimensionId', 'value'],
            },
          },
          swot: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              threats: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['strengths', 'weaknesses', 'opportunities', 'threats'],
          },
          scores: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                criterionId: { type: Type.STRING },
                score: { type: Type.INTEGER },
                rationale: { type: Type.STRING },
              },
              required: ['criterionId', 'score', 'rationale'],
            },
          },
        },
        required: ['tagline', 'pros', 'cons', 'comparisonCells', 'swot', 'scores'],
      };

      const prompt = [
        `Decision: ${decisionTitle}`,
        context ? `Context: ${context}` : '',
        `Existing options being compared: ${(existingOptions ?? []).map((o) => o.name).join(', ')}`,
        `New option to add and evaluate: ${cleanedOption}`,
        `Criteria to score (return exact criterionId for each): ${JSON.stringify(criteria ?? [])}`,
        `Comparison table dimensions to fill (return exact dimensionId for each): ${JSON.stringify(comparisonDimensions ?? [])}`,
      ]
        .filter(Boolean)
        .join('\n');

      interface RawOptionEval {
        tagline: string;
        pros: { text: string; impact: string }[];
        cons: { text: string; impact: string }[];
        comparisonCells: { dimensionId: string; value: string }[];
        swot: {
          strengths: string[];
          weaknesses: string[];
          opportunities: string[];
          threats: string[];
        };
        scores: { criterionId: string; score: number; rationale: string }[];
      }

      const raw = await generateJsonWithRetry<RawOptionEval>(
        prompt,
        'You are an impartial decision analyst. Evaluate the new option fairly and specifically against the existing criteria and comparison dimensions.',
        schema,
      );

      const newOptionId = slugifyId('opt', (existingOptions?.length ?? 2) + 1);
      res.json({
        option: {
          id: newOptionId,
          name: cleanedOption,
          tagline: (raw.tagline ?? '').trim(),
        },
        prosCons: {
          optionId: newOptionId,
          pros: (raw.pros ?? []).map((p, i) => ({
            id: slugifyId('pro', i),
            text: p.text.trim(),
            impact: normalizeImpact(p.impact),
          })),
          cons: (raw.cons ?? []).map((c, i) => ({
            id: slugifyId('con', i),
            text: c.text.trim(),
            impact: normalizeImpact(c.impact),
          })),
        },
        comparisonCells: raw.comparisonCells ?? [],
        swot: {
          optionId: newOptionId,
          strengths: (raw.swot?.strengths ?? []).map((s) => s.trim()).filter(Boolean),
          weaknesses: (raw.swot?.weaknesses ?? []).map((s) => s.trim()).filter(Boolean),
          opportunities: (raw.swot?.opportunities ?? []).map((s) => s.trim()).filter(Boolean),
          threats: (raw.swot?.threats ?? []).map((s) => s.trim()).filter(Boolean),
        },
        scores: (criteria ?? []).map((c) => {
          const found = (raw.scores ?? []).find((s) => s.criterionId === c.id);
          return {
            criterionId: c.id,
            optionId: newOptionId,
            score: clampInt(found?.score, 1, 10, 5),
            rationale: (found?.rationale ?? 'Estimated baseline score.').trim(),
          };
        }),
      });
    } catch (err) {
      const { status, message } = formatApiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/deepen-analysis', async (req: Request, res: Response) => {
    try {
      const { action, decisionTitle, context, options, criteria, scores, leaderName, runnerUpName, margin } =
        req.body as {
          action?: 'devils_advocate' | 'suggest_criteria';
          decisionTitle?: string;
          context?: string;
          options?: { id: string; name: string; tagline: string }[];
          criteria?: { id: string; name: string; weight: number }[];
          scores?: { criterionId: string; optionId: string; score: number }[];
          leaderName?: string;
          runnerUpName?: string;
          margin?: number;
        };

      if (!decisionTitle || !action) {
        res.status(400).json({ error: 'Missing decision details or action type.' });
        return;
      }

      if (action === 'devils_advocate') {
        const schema = {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.STRING,
              description: 'Sharp 1-sentence thesis challenging the leading option.',
            },
            counterArguments: {
              type: Type.ARRAY,
              description: '3 concrete counter-arguments or stress tests against choosing the current leader.',
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  detail: { type: Type.STRING },
                },
                required: ['title', 'detail'],
              },
            },
            decidingQuestion: {
              type: Type.STRING,
              description: 'One piercing tiebreaker question the user should answer honestly to confirm or overturn the winner.',
            },
          },
          required: ['headline', 'counterArguments', 'decidingQuestion'],
        };

        const prompt = [
          `Decision: ${decisionTitle}`,
          context ? `Context: ${context}` : '',
          `Current leading option: ${leaderName ?? options?.[0]?.name ?? 'Top option'}`,
          runnerUpName ? `Runner-up option: ${runnerUpName} (margin: ${margin ?? 0} points out of 100)` : '',
          `User's current priority weights: ${JSON.stringify(criteria ?? [])}`,
          'Stress-test the leading option honestly so the user does not fall prey to confirmation bias.',
        ]
          .filter(Boolean)
          .join('\n');

        interface RawDevils {
          headline: string;
          counterArguments: { title: string; detail: string }[];
          decidingQuestion: string;
        }

        const raw = await generateJsonWithRetry<RawDevils>(
          prompt,
          'You are a sharp, constructive devil’s advocate helping someone stress-test their decision before committing. Be concrete, calm, and insightful.',
          schema,
        );

        res.json({ devilsAdvocate: raw });
        return;
      }

      if (action === 'suggest_criteria') {
        const schema = {
          type: Type.OBJECT,
          properties: {
            criteria: {
              type: Type.ARRAY,
              description: 'Exactly 2 overlooked evaluation criteria not already in the existing list.',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  weight: { type: Type.INTEGER },
                  scores: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        optionId: { type: Type.STRING },
                        score: { type: Type.INTEGER },
                        rationale: { type: Type.STRING },
                      },
                      required: ['optionId', 'score', 'rationale'],
                    },
                  },
                },
                required: ['name', 'description', 'weight', 'scores'],
              },
            },
          },
          required: ['criteria'],
        };

        const prompt = [
          `Decision: ${decisionTitle}`,
          context ? `Context: ${context}` : '',
          `Options (use exact optionId values): ${JSON.stringify(options ?? [])}`,
          `Existing criteria (do NOT duplicate these): ${(criteria ?? []).map((c) => c.name).join(', ')}`,
          `Current scores snapshot: ${JSON.stringify((scores ?? []).slice(0, 30))}`,
          'Suggest 2 distinct, high-value criteria the user has not yet included in their weighted matrix, with fair scores (1-10) and rationales for every option.',
        ]
          .filter(Boolean)
          .join('\n');

        interface RawCriteriaResp {
          criteria: {
            name: string;
            description: string;
            weight: number;
            scores: { optionId: string; score: number; rationale: string }[];
          }[];
        }

        const raw = await generateJsonWithRetry<RawCriteriaResp>(
          prompt,
          'You are a decision strategist identifying missing evaluation criteria that often break ties in real-world choices.',
          schema,
        );

        const additions = (raw.criteria ?? []).slice(0, 2).map((c, idx) => {
          const criterionId = slugifyId('crit', (criteria?.length ?? 5) + idx);
          return {
            criterion: {
              id: criterionId,
              name: c.name.trim(),
              description: (c.description ?? '').trim(),
              weight: clampInt(c.weight, 1, 10, 6),
            },
            scores: (options ?? []).map((opt) => {
              const found = (c.scores ?? []).find((s) => s.optionId === opt.id);
              return {
                criterionId,
                optionId: opt.id,
                score: clampInt(found?.score, 1, 10, 5),
                rationale: (found?.rationale ?? 'Estimated baseline score.').trim(),
              };
            }),
          };
        });

        res.json({ additions });
        return;
      }

      res.status(400).json({ error: 'Unsupported action type.' });
    } catch (err) {
      const { status, message } = formatApiError(err);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`The Tiebreaker server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
