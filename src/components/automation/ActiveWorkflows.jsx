import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2, Edit } from 'lucide-react';

export default function ActiveWorkflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await base44.entities.Automation.filter(
        { status: 'active' },
        '-created_date',
        50
      );
      setWorkflows(data);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading workflows...</div>;
  }

  if (workflows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No active workflows yet. Create your first workflow to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {workflows.map(workflow => (
        <Card key={workflow.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{workflow.name}</h3>
                  <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                    {workflow.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Runs: {workflow.run_count || 0}</span>
                  <span>Success: {workflow.success_count || 0}</span>
                  <span>Errors: {workflow.error_count || 0}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Pause className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}