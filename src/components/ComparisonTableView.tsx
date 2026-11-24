import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import type { Decision } from '../types.ts';

interface ComparisonTableViewProps {
  decision: Decision;
  onUpdateCell: (rowId: string, optionId: string, value: string) => void;
  onUpdateDimension: (rowId: string, dimension: string) => void;
  onAddRow: (dimension: string, values: Record<string, string>) => void;
  onDeleteRow: (rowId: string) => void;
}

export function ComparisonTableView({
  decision,
  onUpdateCell,
  onUpdateDimension,
  onAddRow,
  onDeleteRow,
}: ComparisonTableViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);
  const [newDimension, setNewDimension] = useState('');
  const [newValues, setNewValues] = useState<Record<string, string>>({});

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRows = decision.comparisonRows.filter((row) => {
    if (!normalizedQuery) return true;
    if (row.dimension.toLowerCase().includes(normalizedQuery)) return true;
    return Object.values(row.values).some((val) =>
      val.toLowerCase().includes(normalizedQuery),
    );
  });

  const handleCreateRow = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedDim = newDimension.trim();
    if (!cleanedDim) return;
    const values: Record<string, string> = {};
    for (const opt of decision.options) {
      values[opt.id] = (newValues[opt.id] ?? '').trim() || '—';
    }
    onAddRow(cleanedDim, values);
    setNewDimension('');
    setNewValues({});
    setShowAddRow(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Side-by-Side Comparison Table
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any cell to edit details directly as you gather new facts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dimensions..."
              aria-label="Search comparison table"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAddRow((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dimension</span>
          </button>
        </div>
      </div>

      {/* Add Dimension Inline Form */}
      {showAddRow && (
        <form
          onSubmit={handleCreateRow}
          className="p-5 border border-slate-200 rounded-xl bg-slate-50/60 space-y-4"
        >
          <div className="text-sm font-semibold text-slate-900">New Comparison Dimension</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Dimension name
              </label>
              <input
                type="text"
                required
                value={newDimension}
                onChange={(e) => setNewDimension(e.target.value)}
                placeholder="e.g., Upfront time investment"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>
            {decision.options.map((opt) => (
              <div key={opt.id}>
                <label className="block text-xs font-medium text-slate-700 mb-1 truncate">
                  {opt.name}
                </label>
                <input
                  type="text"
                  value={newValues[opt.id] ?? ''}
                  onChange={(e) =>
                    setNewValues((prev) => ({ ...prev, [opt.id]: e.target.value }))
                  }
                  placeholder={`Value for ${opt.name}`}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddRow(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              Add Row
            </button>
          </div>
        </form>
      )}

      {/* Analytical Table */}
      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
        <table className="w-full text-left border-collapse min-w-[680px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-600">
              <th className="py-3.5 px-5 w-[24%]">Dimension</th>
              {decision.options.map((opt) => (
                <th key={opt.id} className="py-3.5 px-5 font-semibold text-slate-900">
                  {opt.name}
                </th>
              ))}
              <th className="py-3.5 px-3 w-10" aria-label="Row actions" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={2 + decision.options.length}
                  className="py-10 px-6 text-center text-sm text-slate-500"
                >
                  {decision.comparisonRows.length === 0
                    ? 'No comparison dimensions yet. Add a row to start comparing options side by side.'
                    : 'No rows match your search filter.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="group hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5 align-top">
                    <input
                      type="text"
                      value={row.dimension}
                      aria-label="Dimension name"
                      onChange={(e) => onUpdateDimension(row.id, e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-slate-900 focus:bg-white focus:px-2 focus:-mx-2 focus:py-1 focus:-my-1 focus:rounded focus:ring-1 focus:ring-blue-700 focus:outline-none"
                    />
                  </td>
                  {decision.options.map((opt) => (
                    <td key={opt.id} className="py-3.5 px-5 align-top">
                      <textarea
                        rows={2}
                        value={row.values[opt.id] ?? ''}
                        aria-label={`${row.dimension} for ${opt.name}`}
                        onChange={(e) => onUpdateCell(row.id, opt.id, e.target.value)}
                        className="w-full resize-none bg-transparent text-sm text-slate-700 leading-relaxed focus:bg-white focus:p-1.5 focus:-m-1.5 focus:rounded focus:ring-1 focus:ring-blue-700 focus:outline-none"
                      />
                    </td>
                  ))}
                  <td className="py-3.5 px-3 align-top text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteRow(row.id)}
                      aria-label={`Delete ${row.dimension}`}
                      className="p-1.5 text-slate-300 hover:text-red-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
