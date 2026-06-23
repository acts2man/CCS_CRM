import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function DataExport() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const response = await base44.functions.invoke('exportAllData', {});
      const { data, summary } = response.data;

      setSummary(summary);

      // Build combined JSON blob
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const totalRecords = summary ? summary.reduce((sum, s) => sum + s.count, 0) : 0;
  const entitiesWithData = summary ? summary.filter(s => s.count > 0) : [];
  const entitiesWithErrors = summary ? summary.filter(s => s.error) : [];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-7 w-7 text-slate-700" />
          <h1 className="text-2xl font-bold text-slate-900">Data Export</h1>
          <Badge variant="destructive" className="text-xs">Admin Only</Badge>
        </div>
        <p className="text-slate-500 text-sm">
          Exports all entity records as a single JSON file for backup or migration. Read-only — no data is modified.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
        ⚠️ This export includes all data across all entities. The file may be large. Do not share it.
      </div>

      <Button
        onClick={handleExport}
        disabled={loading}
        size="lg"
        className="mb-8"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting...</>
        ) : (
          <><Download className="h-4 w-4 mr-2" /> Export All Data</>
        )}
      </Button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      {summary && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{totalRecords.toLocaleString()}</span> total records across{' '}
              <span className="font-semibold text-slate-900">{entitiesWithData.length}</span> entities
            </div>
            {entitiesWithErrors.length > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                {entitiesWithErrors.length} skipped
              </Badge>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-slate-700">Entity</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-700">Records</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary.map((row) => (
                  <tr key={row.entity} className={row.count === 0 && !row.error ? 'opacity-40' : ''}>
                    <td className="px-4 py-2 font-mono text-xs text-slate-700">{row.entity}</td>
                    <td className="px-4 py-2 text-right text-slate-900 font-medium">{row.count.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">
                      {row.error ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 text-xs">
                          <AlertCircle className="h-3 w-3" /> skipped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle className="h-3 w-3" /> ok
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}