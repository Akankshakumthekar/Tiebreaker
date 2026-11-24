import { useState } from 'react';
import { ArrowRight, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import type { Decision } from '../types.ts';
import { postJson } from '../utils/api.ts';

interface NewDecisionViewProps {
  onDecisionCreated: (decision: Decision) => void;
  onCancel?: () => void;
  canCancel: boolean;
}

const STARTER_PROMPTS = [
  {
    label: 'Career pivot',
    decisionPrompt:
      'Should I leave my marketing manager job to pursue a full-time UX design transition, or learn part-time while staying employed?',
    context:
      'I have 9 months of emergency savings, want to avoid burnout, and hope to land a product design role within 12–18 months.',
    options: ['Full-Time Transition & Bootcamp', 'Part-Time Study While Working', 'Internal Transfer to Product Team'],
    criteria: 'Financial runway, Speed of transition, Portfolio quality, Daily stress level',
  },
  {
    label: 'Relocation',
    decisionPrompt: 'Move to a new city for a faster-paced job market vs. stay close to family and work remotely',
    context: 'Partner works remote; we value community, outdoor access, and keeping housing under 28% of net income.',
    options: ['Relocate to New City', 'Stay Near Family (Remote)'],
    criteria: 'Career ceiling, Family proximity, Cost of living, Social energy',
  },
  {
    label: 'Product build',
    decisionPrompt: 'Build our customer-facing mobile app in-house vs. hire a specialized product agency for v1',
    context: 'We have a 2-engineer web team, 4-month launch target, and $120k budget.',
    options: ['Build In-House with React Native', 'Hire Specialized Agency for v1', 'Ship Progressive Web App First'],
    criteria: 'Time to market, Total 12-month cost, Long-term maintainability, Product quality',
  },
];

export function NewDecisionView({
  onDecisionCreated,
  onCancel,
  canCancel,
}: NewDecisionViewProps) {
  const [decisionPrompt, setDecisionPrompt] = useState('');
  const [context, setContext] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [criteriaInput, setCriteriaInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const handleAddOptionField = () => {
    if (options.length < 5) {
      setOptions((prev) => [...prev, '']);
    }
  };

  const handleRemoveOptionField = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const applyStarter = (starter: (typeof STARTER_PROMPTS)[number]) => {
    setDecisionPrompt(starter.decisionPrompt);
    setContext(starter.context);
    setOptions(starter.options);
    setCriteriaInput(starter.criteria);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPrompt = decisionPrompt.trim();
    if (cleanedPrompt.length < 4) {
      setError('Describe the decision you are weighing in at least a few words.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cleanedOptions = options.map((o) => o.trim()).filter(Boolean);
      const cleanedCriteria = criteriaInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const data = await postJson<{ decision?: Decision }>('/api/analyze-decision', {
        decisionPrompt: cleanedPrompt,
        context: context.trim(),
        options: cleanedOptions,
        criteria: cleanedCriteria,
      });

      if (!data.decision) {
        throw new Error('Could not generate decision analysis. Please try again.');
      }

      onDecisionCreated(data.decision);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while analyzing your decision.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-10 lg:py-14">
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 [text-wrap:balance]">
          What decision are you trying to make?
        </h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed max-w-2xl">
          Describe your choice and any constraints. The Tiebreaker will build a structured Pros &amp; Cons breakdown, side-by-side Comparison Table, SWOT Analysis, and customizable Weighted Scoring Matrix.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50/70 text-sm text-red-900"
        >
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Decision Prompt */}
        <div>
          <label
            htmlFor="decision-prompt"
            className="block text-sm font-medium text-slate-900 mb-2"
          >
            Decision statement
          </label>
          <textarea
            id="decision-prompt"
            rows={3}
            value={decisionPrompt}
            onChange={(e) => setDecisionPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Should I accept the remote product lead offer in Denver or stay at my current company and negotiate a promotion?"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15 transition-colors disabled:bg-slate-50"
          />
        </div>

        {/* Context & Constraints */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="decision-context" className="text-sm font-medium text-slate-900">
              Context, numbers, or constraints
            </label>
            <span className="text-xs text-slate-500">Optional</span>
          </div>
          <textarea
            id="decision-context"
            rows={2}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={isLoading}
            placeholder="Budget, timeline, non-negotiables, risk tolerance, or key numbers..."
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15 transition-colors disabled:bg-slate-50"
          />
        </div>

        {/* Options to Compare */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-slate-900">
              Options to compare
            </span>
            <span className="text-xs text-slate-500">
              Leave blank to auto-detect options
            </span>
          </div>
          <div className="space-y-2.5">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 text-xs font-mono tabular-nums text-slate-400 text-right shrink-0">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  disabled={isLoading}
                  placeholder={`Option ${idx + 1} (e.g., ${idx === 0 ? 'Take the new offer' : 'Stay and negotiate'})`}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15 transition-colors disabled:bg-slate-50"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOptionField(idx)}
                    disabled={isLoading}
                    aria-label={`Remove option ${idx + 1}`}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 5 && (
            <button
              type="button"
              onClick={handleAddOptionField}
              disabled={isLoading}
              className="mt-2.5 ml-8 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add another option</span>
            </button>
          )}
        </div>

        {/* Criteria Hints */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="decision-criteria" className="text-sm font-medium text-slate-900">
              What matters most to you?
            </label>
            <span className="text-xs text-slate-500">Optional · comma-separated</span>
          </div>
          <input
            id="decision-criteria"
            type="text"
            value={criteriaInput}
            onChange={(e) => setCriteriaInput(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Total compensation, Work-life balance, Career growth, Commute"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15 transition-colors disabled:bg-slate-50"
          />
        </div>

        {/* Submit Row */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Generates Weighted Matrix · Pros &amp; Cons · Comparison Table · SWOT
          </div>
          <div className="flex items-center gap-3">
            {canCancel && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing decision...</span>
                </>
              ) : (
                <>
                  <span>Analyze Decision</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Loading Skeleton Preview */}
      {isLoading && (
        <div className="mt-8 border border-slate-200 rounded-xl p-6 space-y-4 bg-slate-50/50">
          <div className="text-sm font-medium text-slate-700">
            Structuring options, scoring criteria, pros &amp; cons, comparison dimensions, and SWOT quadrants...
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-16 rounded-lg bg-slate-200/70 animate-pulse" />
            <div className="h-16 rounded-lg bg-slate-200/70 animate-pulse" />
          </div>
          <div className="space-y-2.5">
            <div className="h-9 rounded-lg bg-slate-200/60 animate-pulse" />
            <div className="h-9 rounded-lg bg-slate-200/60 animate-pulse" />
            <div className="h-9 rounded-lg bg-slate-200/60 animate-pulse" />
          </div>
        </div>
      )}

      {/* Quick Starter Examples */}
      {!isLoading && (
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="text-xs font-medium text-slate-500 mb-3">
            Need inspiration? Try a structured prompt
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STARTER_PROMPTS.map((starter) => (
              <button
                key={starter.label}
                type="button"
                onClick={() => applyStarter(starter)}
                className="text-left p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <div className="text-xs font-medium text-blue-700 mb-1.5">
                  {starter.label}
                </div>
                <div className="text-sm text-slate-800 leading-snug line-clamp-3">
                  {starter.decisionPrompt}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
