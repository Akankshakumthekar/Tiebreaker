import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Decision, SwotQuadrantKey } from '../types.ts';

interface SwotAnalysisViewProps {
  decision: Decision;
  onAddSwotItem: (optionId: string, quadrant: SwotQuadrantKey, text: string) => void;
  onDeleteSwotItem: (optionId: string, quadrant: SwotQuadrantKey, index: number) => void;
}

const QUADRANTS: {
  key: SwotQuadrantKey;
  title: string;
  subtitle: string;
  accentClass: string;
  placeholder: string;
}[] = [
  {
    key: 'strengths',
    title: 'Strengths',
    subtitle: 'Internal · Helpful',
    accentClass: 'text-emerald-800',
    placeholder: 'Add an internal advantage...',
  },
  {
    key: 'weaknesses',
    title: 'Weaknesses',
    subtitle: 'Internal · Harmful',
    accentClass: 'text-red-800',
    placeholder: 'Add an internal limitation...',
  },
  {
    key: 'opportunities',
    title: 'Opportunities',
    subtitle: 'External · Helpful',
    accentClass: 'text-blue-800',
    placeholder: 'Add an external upside...',
  },
  {
    key: 'threats',
    title: 'Threats',
    subtitle: 'External · Harmful',
    accentClass: 'text-amber-800',
    placeholder: 'Add an external risk...',
  },
];

export function SwotAnalysisView({
  decision,
  onAddSwotItem,
  onDeleteSwotItem,
}: SwotAnalysisViewProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    decision.options[0]?.id ?? '',
  );
  const [drafts, setDrafts] = useState<Record<SwotQuadrantKey, string>>({
    strengths: '',
    weaknesses: '',
    opportunities: '',
    threats: '',
  });

  const activeOption =
    decision.options.find((o) => o.id === selectedOptionId) ?? decision.options[0];

  if (!activeOption) {
    return (
      <div className="p-8 border border-slate-200 rounded-xl text-sm text-slate-500 text-center">
        Add an option to view its SWOT analysis.
      </div>
    );
  }

  const activeSwot = decision.swot.find((s) => s.optionId === activeOption.id) ?? {
    optionId: activeOption.id,
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  };

  const handleAdd = (e: React.FormEvent, key: SwotQuadrantKey) => {
    e.preventDefault();
    const cleaned = drafts[key].trim();
    if (!cleaned) return;
    onAddSwotItem(activeOption.id, key, cleaned);
    setDrafts((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Option Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">SWOT Analysis</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect internal capabilities and external forces for each option.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          {decision.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedOptionId(opt.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeOption.id === opt.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2x2 Hairline-Divided SWOT Matrix */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        {/* Option subheader */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">{activeOption.name}</div>
          {activeOption.tagline && (
            <div className="text-xs text-slate-500">{activeOption.tagline}</div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Top Row (Strengths & Weaknesses) + Bottom Row (Opportunities & Threats) via 2x2 borders */}
          {QUADRANTS.map((quadrant, qIdx) => {
            const items = activeSwot[quadrant.key];
            const topBorderClass = qIdx >= 2 ? 'md:border-t md:border-slate-200' : '';

            return (
              <div
                key={quadrant.key}
                className={`p-6 flex flex-col justify-between ${topBorderClass}`}
              >
                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-4">
                    <h3 className={`text-sm font-semibold ${quadrant.accentClass}`}>
                      {quadrant.title}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {quadrant.subtitle} · {items.length}
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">
                      No {quadrant.title.toLowerCase()} recorded yet.
                    </p>
                  ) : (
                    <ul className="space-y-3 mb-5">
                      {items.map((text, idx) => (
                        <li
                          key={idx}
                          className="group flex items-start gap-2.5 text-sm text-slate-800 leading-relaxed"
                        >
                          <span className="font-mono text-xs tabular-nums text-slate-400 pt-0.5 shrink-0">
                            0{idx + 1}
                          </span>
                          <span className="flex-1">{text}</span>
                          <button
                            type="button"
                            onClick={() => onDeleteSwotItem(activeOption.id, quadrant.key, idx)}
                            aria-label={`Remove item from ${quadrant.title}`}
                            className="p-1 text-slate-300 hover:text-red-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Inline Add Form */}
                <form
                  onSubmit={(e) => handleAdd(e, quadrant.key)}
                  className="pt-3 border-t border-slate-100 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={drafts[quadrant.key]}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [quadrant.key]: e.target.value }))
                    }
                    placeholder={quadrant.placeholder}
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!drafts[quadrant.key].trim()}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
