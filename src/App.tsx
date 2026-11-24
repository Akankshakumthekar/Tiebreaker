import { useEffect, useMemo, useState } from 'react';
import { Menu, Copy, Check, Plus, AlertCircle, X } from 'lucide-react';
import type {
  Criterion,
  Decision,
  DecisionOption,
  DevilsAdvocateResult,
  FrameworkTab,
  ImpactLevel,
  OptionProsCons,
  OptionSwot,
  ScoreEntry,
  SwotQuadrantKey,
} from './types.ts';
import { SAMPLE_DECISIONS } from './data/sampleDecisions.ts';
import { computeWeightedSummary, exportDecisionToMarkdown } from './utils/scoring.ts';
import { postJson } from './utils/api.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { NewDecisionView } from './components/NewDecisionView.tsx';
import { VerdictBanner } from './components/VerdictBanner.tsx';
import { WeightedMatrixView } from './components/WeightedMatrixView.tsx';
import { ProsConsView } from './components/ProsConsView.tsx';
import { ComparisonTableView } from './components/ComparisonTableView.tsx';
import { SwotAnalysisView } from './components/SwotAnalysisView.tsx';

const STORAGE_KEY = 'the_tiebreaker_decisions_v1';

const FRAMEWORK_TABS: { id: FrameworkTab; label: string }[] = [
  { id: 'weighted', label: 'Weighted Matrix' },
  { id: 'pros_cons', label: 'Pros & Cons' },
  { id: 'comparison', label: 'Comparison Table' },
  { id: 'swot', label: 'SWOT Analysis' },
];

function loadInitialDecisions(): Decision[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Decision[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fall back to sample decisions if localStorage is unreadable
  }
  return SAMPLE_DECISIONS;
}

export default function App() {
  const [decisions, setDecisions] = useState<Decision[]>(loadInitialDecisions);
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(
    () => loadInitialDecisions()[0]?.id ?? null,
  );
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<FrameworkTab>('weighted');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [copiedExport, setCopiedExport] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isChallenging, setIsChallenging] = useState(false);
  const [isSuggestingCriteria, setIsSuggestingCriteria] = useState(false);
  const [isEvaluatingOption, setIsEvaluatingOption] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
    } catch {
      // Ignore storage quota issues
    }
  }, [decisions]);

  const activeDecision = useMemo(
    () => decisions.find((d) => d.id === activeDecisionId) ?? null,
    [decisions, activeDecisionId],
  );

  const weightedSummary = useMemo(
    () => (activeDecision ? computeWeightedSummary(activeDecision) : null),
    [activeDecision],
  );

  const updateActiveDecision = (updater: (current: Decision) => Decision) => {
    if (!activeDecisionId) return;
    setDecisions((prev) =>
      prev.map((d) =>
        d.id === activeDecisionId
          ? { ...updater(d), updatedAt: new Date().toISOString() }
          : d,
      ),
    );
  };

  const handleDecisionCreated = (newDecision: Decision) => {
    setDecisions((prev) => [newDecision, ...prev]);
    setActiveDecisionId(newDecision.id);
    setIsCreatingNew(false);
    setActiveTab('weighted');
    setActionError(null);
  };

  const handleDeleteDecision = (id: string) => {
    setDecisions((prev) => {
      const remaining = prev.filter((d) => d.id !== id);
      if (activeDecisionId === id) {
        setActiveDecisionId(remaining[0]?.id ?? null);
        if (remaining.length === 0) {
          setIsCreatingNew(true);
        }
      }
      return remaining;
    });
  };

  const handleRestoreSamples = () => {
    setDecisions((prev) => {
      const existingIds = new Set(prev.map((d) => d.id));
      const missing = SAMPLE_DECISIONS.filter((s) => !existingIds.has(s.id));
      const next = [...missing, ...prev];
      if (!activeDecisionId && next[0]) {
        setActiveDecisionId(next[0].id);
        setIsCreatingNew(false);
      }
      return next.length > 0 ? next : SAMPLE_DECISIONS;
    });
  };

  const handleCopyMarkdown = async () => {
    if (!activeDecision) return;
    const markdown = exportDecisionToMarkdown(activeDecision);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2000);
    } catch {
      setActionError('Unable to copy to clipboard in this browser context.');
    }
  };

  // Weighted Matrix handlers
  const handleUpdateWeight = (criterionId: string, weight: number) => {
    updateActiveDecision((d) => ({
      ...d,
      criteria: d.criteria.map((c) => (c.id === criterionId ? { ...c, weight } : c)),
    }));
  };

  const handleUpdateScore = (criterionId: string, optionId: string, score: number) => {
    updateActiveDecision((d) => {
      const exists = d.scores.some(
        (s) => s.criterionId === criterionId && s.optionId === optionId,
      );
      const nextScores = exists
        ? d.scores.map((s) =>
            s.criterionId === criterionId && s.optionId === optionId
              ? { ...s, score }
              : s,
          )
        : [
            ...d.scores,
            { criterionId, optionId, score, rationale: 'Adjusted manually.' },
          ];
      return { ...d, scores: nextScores };
    });
  };

  const handleAddCriterion = (name: string, description: string, weight: number) => {
    const newId = `crit-${Date.now()}`;
    updateActiveDecision((d) => ({
      ...d,
      criteria: [...d.criteria, { id: newId, name, description, weight }],
      scores: [
        ...d.scores,
        ...d.options.map((opt) => ({
          criterionId: newId,
          optionId: opt.id,
          score: 5,
          rationale: 'Added manually — adjust to reflect your assessment.',
        })),
      ],
    }));
  };

  const handleDeleteCriterion = (criterionId: string) => {
    updateActiveDecision((d) => ({
      ...d,
      criteria: d.criteria.filter((c) => c.id !== criterionId),
      scores: d.scores.filter((s) => s.criterionId !== criterionId),
    }));
  };

  const handleEqualizeWeights = () => {
    updateActiveDecision((d) => ({
      ...d,
      criteria: d.criteria.map((c) => ({ ...c, weight: 5 })),
    }));
  };

  const handleAddOptionManual = (name: string, tagline: string) => {
    const newOptionId = `opt-${Date.now()}`;
    updateActiveDecision((d) => ({
      ...d,
      options: [...d.options, { id: newOptionId, name, tagline }],
      prosCons: [...d.prosCons, { optionId: newOptionId, pros: [], cons: [] }],
      comparisonRows: d.comparisonRows.map((row) => ({
        ...row,
        values: { ...row.values, [newOptionId]: '—' },
      })),
      swot: [
        ...d.swot,
        {
          optionId: newOptionId,
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: [],
        },
      ],
      scores: [
        ...d.scores,
        ...d.criteria.map((c) => ({
          criterionId: c.id,
          optionId: newOptionId,
          score: 5,
          rationale: 'Added manually — score this option on each criterion.',
        })),
      ],
    }));
  };

  const handleAddOptionAI = async (newOptionName: string) => {
    if (!activeDecision) return;
    setIsEvaluatingOption(true);
    setActionError(null);
    try {
      const data = await postJson<{
        option?: DecisionOption;
        prosCons?: OptionProsCons;
        comparisonCells?: { dimensionId: string; value: string }[];
        swot?: OptionSwot;
        scores?: ScoreEntry[];
      }>('/api/evaluate-option', {
        decisionTitle: activeDecision.title,
        context: activeDecision.context,
        existingOptions: activeDecision.options.map((o) => ({ id: o.id, name: o.name })),
        newOptionName,
        criteria: activeDecision.criteria.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
        })),
        comparisonDimensions: activeDecision.comparisonRows.map((r) => ({
          id: r.id,
          dimension: r.dimension,
        })),
      });

      if (!data.option) {
        throw new Error('Could not evaluate the new option.');
      }

      const addedOption = data.option;
      const cellMap = new Map(
        (data.comparisonCells ?? []).map((c) => [c.dimensionId, c.value]),
      );

      updateActiveDecision((d) => ({
        ...d,
        options: [...d.options, addedOption],
        prosCons: [
          ...d.prosCons,
          data.prosCons ?? { optionId: addedOption.id, pros: [], cons: [] },
        ],
        comparisonRows: d.comparisonRows.map((row) => ({
          ...row,
          values: {
            ...row.values,
            [addedOption.id]: cellMap.get(row.id) ?? '—',
          },
        })),
        swot: [
          ...d.swot,
          data.swot ?? {
            optionId: addedOption.id,
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: [],
          },
        ],
        scores: [...d.scores, ...(data.scores ?? [])],
      }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to evaluate option.');
    } finally {
      setIsEvaluatingOption(false);
    }
  };

  const handleDeleteOption = (optionId: string) => {
    updateActiveDecision((d) => {
      if (d.options.length <= 2) return d;
      return {
        ...d,
        options: d.options.filter((o) => o.id !== optionId),
        prosCons: d.prosCons.filter((pc) => pc.optionId !== optionId),
        comparisonRows: d.comparisonRows.map((row) => {
          const nextValues = { ...row.values };
          delete nextValues[optionId];
          return { ...row, values: nextValues };
        }),
        swot: d.swot.filter((s) => s.optionId !== optionId),
        scores: d.scores.filter((s) => s.optionId !== optionId),
      };
    });
  };

  const handleChallengeLeader = async () => {
    if (!activeDecision || !weightedSummary?.leader) return;
    setIsChallenging(true);
    setActionError(null);
    try {
      const data = await postJson<{
        devilsAdvocate?: Omit<DevilsAdvocateResult, 'targetOptionId' | 'targetOptionName' | 'generatedAt'>;
      }>('/api/deepen-analysis', {
        action: 'devils_advocate',
        decisionTitle: activeDecision.title,
        context: activeDecision.context,
        options: activeDecision.options,
        criteria: activeDecision.criteria.map((c) => ({
          id: c.id,
          name: c.name,
          weight: c.weight,
        })),
        leaderName: weightedSummary.leader.option.name,
        runnerUpName: weightedSummary.runnerUp?.option.name,
        margin: weightedSummary.margin,
      });

      if (!data.devilsAdvocate) {
        throw new Error('Could not generate tiebreaker stress test.');
      }

      const leader = weightedSummary.leader;
      updateActiveDecision((d) => ({
        ...d,
        devilsAdvocate: {
          ...data.devilsAdvocate!,
          targetOptionId: leader.option.id,
          targetOptionName: leader.option.name,
          generatedAt: new Date().toISOString(),
        },
      }));
      setActiveTab('weighted');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to run tiebreaker challenge.');
    } finally {
      setIsChallenging(false);
    }
  };

  const handleSuggestCriteriaAI = async () => {
    if (!activeDecision) return;
    setIsSuggestingCriteria(true);
    setActionError(null);
    try {
      const data = await postJson<{
        additions?: { criterion: Criterion; scores: ScoreEntry[] }[];
      }>('/api/deepen-analysis', {
        action: 'suggest_criteria',
        decisionTitle: activeDecision.title,
        context: activeDecision.context,
        options: activeDecision.options,
        criteria: activeDecision.criteria.map((c) => ({
          id: c.id,
          name: c.name,
          weight: c.weight,
        })),
        scores: activeDecision.scores.map((s) => ({
          criterionId: s.criterionId,
          optionId: s.optionId,
          score: s.score,
        })),
      });

      if (!data.additions) {
        throw new Error('Could not suggest additional criteria.');
      }

      const newCriteria = data.additions.map((a) => a.criterion);
      const newScores = data.additions.flatMap((a) => a.scores);

      updateActiveDecision((d) => ({
        ...d,
        criteria: [...d.criteria, ...newCriteria],
        scores: [...d.scores, ...newScores],
      }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to suggest criteria.');
    } finally {
      setIsSuggestingCriteria(false);
    }
  };

  // Pros & Cons handlers
  const handleAddProCon = (
    optionId: string,
    kind: 'pros' | 'cons',
    text: string,
    impact: ImpactLevel,
  ) => {
    const item = { id: `${kind}-${Date.now()}`, text, impact };
    updateActiveDecision((d) => {
      const exists = d.prosCons.some((pc) => pc.optionId === optionId);
      const nextProsCons = exists
        ? d.prosCons.map((pc) =>
            pc.optionId === optionId ? { ...pc, [kind]: [...pc[kind], item] } : pc,
          )
        : [
            ...d.prosCons,
            {
              optionId,
              pros: kind === 'pros' ? [item] : [],
              cons: kind === 'cons' ? [item] : [],
            },
          ];
      return { ...d, prosCons: nextProsCons };
    });
  };

  const handleDeleteProCon = (optionId: string, kind: 'pros' | 'cons', itemId: string) => {
    updateActiveDecision((d) => ({
      ...d,
      prosCons: d.prosCons.map((pc) =>
        pc.optionId === optionId
          ? { ...pc, [kind]: pc[kind].filter((i) => i.id !== itemId) }
          : pc,
      ),
    }));
  };

  // Comparison Table handlers
  const handleUpdateComparisonCell = (rowId: string, optionId: string, value: string) => {
    updateActiveDecision((d) => ({
      ...d,
      comparisonRows: d.comparisonRows.map((row) =>
        row.id === rowId
          ? { ...row, values: { ...row.values, [optionId]: value } }
          : row,
      ),
    }));
  };

  const handleUpdateComparisonDimension = (rowId: string, dimension: string) => {
    updateActiveDecision((d) => ({
      ...d,
      comparisonRows: d.comparisonRows.map((row) =>
        row.id === rowId ? { ...row, dimension } : row,
      ),
    }));
  };

  const handleAddComparisonRow = (dimension: string, values: Record<string, string>) => {
    updateActiveDecision((d) => ({
      ...d,
      comparisonRows: [...d.comparisonRows, { id: `row-${Date.now()}`, dimension, values }],
    }));
  };

  const handleDeleteComparisonRow = (rowId: string) => {
    updateActiveDecision((d) => ({
      ...d,
      comparisonRows: d.comparisonRows.filter((r) => r.id !== rowId),
    }));
  };

  // SWOT handlers
  const handleAddSwotItem = (
    optionId: string,
    quadrant: SwotQuadrantKey,
    text: string,
  ) => {
    updateActiveDecision((d) => {
      const exists = d.swot.some((s) => s.optionId === optionId);
      const nextSwot = exists
        ? d.swot.map((s) =>
            s.optionId === optionId ? { ...s, [quadrant]: [...s[quadrant], text] } : s,
          )
        : [
            ...d.swot,
            {
              optionId,
              strengths: quadrant === 'strengths' ? [text] : [],
              weaknesses: quadrant === 'weaknesses' ? [text] : [],
              opportunities: quadrant === 'opportunities' ? [text] : [],
              threats: quadrant === 'threats' ? [text] : [],
            },
          ];
      return { ...d, swot: nextSwot };
    });
  };

  const handleDeleteSwotItem = (
    optionId: string,
    quadrant: SwotQuadrantKey,
    index: number,
  ) => {
    updateActiveDecision((d) => ({
      ...d,
      swot: d.swot.map((s) =>
        s.optionId === optionId
          ? { ...s, [quadrant]: s[quadrant].filter((_, i) => i !== index) }
          : s,
      ),
    }));
  };

  const showNewComposer = isCreatingNew || !activeDecision;

  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      <Sidebar
        decisions={decisions}
        activeDecisionId={activeDecisionId}
        isCreatingNew={showNewComposer}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onSelectDecision={(id) => {
          setActiveDecisionId(id);
          setIsCreatingNew(false);
          setActionError(null);
        }}
        onStartNew={() => {
          setIsCreatingNew(true);
          setActionError(null);
        }}
        onDeleteDecision={handleDeleteDecision}
        onRestoreSamples={handleRestoreSamples}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on left, 1–2 primary actions on right */}
        <header className="h-16 border-b border-slate-200 px-5 lg:px-10 flex items-center justify-between gap-6 bg-white sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open decisions menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-sm text-slate-500 min-w-0"
            >
              <span className="whitespace-nowrap shrink-0">Decisions</span>
              <span aria-hidden="true" className="text-slate-300">
                /
              </span>
              <span className="font-medium text-slate-900 truncate">
                {showNewComposer ? 'New Decision' : activeDecision.title}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!showNewComposer && activeDecision && (
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {copiedExport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Copied Markdown</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>
            )}

            {!showNewComposer && (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(true);
                  setActionError(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Decision</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1">
          {showNewComposer ? (
            <NewDecisionView
              onDecisionCreated={handleDecisionCreated}
              canCancel={Boolean(activeDecision)}
              onCancel={() => setIsCreatingNew(false)}
            />
          ) : (
            <div className="max-w-[1140px] mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-8">
              {/* Decision Title & Quiet Metadata */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{activeDecision.options.length} options</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeDecision.criteria.length} criteria</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeDecision.comparisonRows.length} comparison dimensions</span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 leading-tight [text-wrap:balance]">
                  {activeDecision.title}
                </h1>

                {activeDecision.summary && (
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
                    {activeDecision.summary}
                  </p>
                )}

                {activeDecision.context && (
                  <p className="text-xs text-slate-500 leading-relaxed max-w-3xl pt-1">
                    <span className="font-medium text-slate-700">Context: </span>
                    {activeDecision.context}
                  </p>
                )}
              </div>

              {/* Error Banner for async actions */}
              {actionError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50/70 text-sm text-red-900"
                >
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <div className="flex-1">{actionError}</div>
                  <button
                    type="button"
                    onClick={() => setActionError(null)}
                    aria-label="Dismiss error"
                    className="text-red-700 hover:text-red-900 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Live Weighted Verdict Strip */}
              {weightedSummary && (
                <VerdictBanner
                  summary={weightedSummary}
                  onChallengeLeader={handleChallengeLeader}
                  isChallenging={isChallenging}
                />
              )}

              {/* Framework Navigation Tabs */}
              <div className="border-b border-slate-200">
                <div
                  role="tablist"
                  aria-label="Decision analysis frameworks"
                  className="flex items-center gap-6 overflow-x-auto -mb-px"
                >
                  {FRAMEWORK_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        type="button"
                        aria-selected={isActive}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-3.5 pt-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                          isActive
                            ? 'border-blue-700 text-blue-700'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Framework Content */}
              <div className="pb-12">
                {activeTab === 'weighted' && weightedSummary && (
                  <WeightedMatrixView
                    key={activeDecision.id}
                    decision={activeDecision}
                    summary={weightedSummary}
                    onUpdateWeight={handleUpdateWeight}
                    onUpdateScore={handleUpdateScore}
                    onAddCriterion={handleAddCriterion}
                    onDeleteCriterion={handleDeleteCriterion}
                    onEqualizeWeights={handleEqualizeWeights}
                    onSuggestCriteriaAI={handleSuggestCriteriaAI}
                    isSuggestingCriteria={isSuggestingCriteria}
                    onAddOptionManual={handleAddOptionManual}
                    onAddOptionAI={handleAddOptionAI}
                    isEvaluatingOption={isEvaluatingOption}
                    onDeleteOption={handleDeleteOption}
                  />
                )}

                {activeTab === 'pros_cons' && (
                  <ProsConsView
                    key={activeDecision.id}
                    decision={activeDecision}
                    onAddItem={handleAddProCon}
                    onDeleteItem={handleDeleteProCon}
                  />
                )}

                {activeTab === 'comparison' && (
                  <ComparisonTableView
                    key={activeDecision.id}
                    decision={activeDecision}
                    onUpdateCell={handleUpdateComparisonCell}
                    onUpdateDimension={handleUpdateComparisonDimension}
                    onAddRow={handleAddComparisonRow}
                    onDeleteRow={handleDeleteComparisonRow}
                  />
                )}

                {activeTab === 'swot' && (
                  <SwotAnalysisView
                    key={activeDecision.id}
                    decision={activeDecision}
                    onAddSwotItem={handleAddSwotItem}
                    onDeleteSwotItem={handleDeleteSwotItem}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
