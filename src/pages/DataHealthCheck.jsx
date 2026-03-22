import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

export default function DataHealthCheck() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const runBackfill = async () => {
    setRunning(true);
    setResult(null);
    const response = await base44.functions.invoke('backfillParentStudentIds', {});
    setResult(response.data);
    setRunning(false);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Health Check</h1>
        <p className="text-gray-600 mt-1">Fix and validate parent-student relationship links across all records.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Backfill Parent ↔ Student IDs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This scans every Parent and Student record and ensures both sides of the relationship are correctly linked.
            Safe to run multiple times — it only adds missing links, never removes existing ones.
          </p>
          <Button
            onClick={runBackfill}
            disabled={running}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {running ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Run Backfill</>
            )}
          </Button>

          {result && (
            <div className="mt-4 space-y-3">
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-700">{result.studentsFixed}</p>
                  <p className="text-xs text-green-600">Students updated</p>
                </div>
                <div className="px-4 py-2 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-700">{result.parentsFixed}</p>
                  <p className="text-xs text-blue-600">Parents updated</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto space-y-1">
                {result.log.map((line, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {line.startsWith('✅') ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={line.startsWith('⚠️') ? 'text-yellow-700' : 'text-gray-700'}>
                      {line.replace(/^[✅⚠️]\s*/, '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}