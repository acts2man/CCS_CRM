import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Send, Eye, FileText } from 'lucide-react';
import CreateFormModal from '@/components/forms/CreateFormModal';
import FormPreviewModal from '@/components/forms/FormPreviewModal';

export default function Forms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewForm, setPreviewForm] = useState(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const data = await base44.entities.Form.list('-created_date', 100);
      setForms(data);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredForms = forms.filter(form =>
    form.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedForms = filteredForms.reduce((acc, form) => {
    const category = form.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(form);
    return acc;
  }, {});

  const handleSendForm = (form) => {
    alert(`Send form: ${form.title}`);
  };

  const handleDownloadPDF = (form) => {
    alert(`Download PDF: ${form.title}`);
  };

  const getFieldCount = (form) => {
    try {
      const fields = JSON.parse(form.fields || '[]');
      return fields.length;
    } catch {
      return 0;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Forms & Documents</h1>
          <p className="text-gray-600 mt-1">Manage school forms, submissions, and document workflows</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Form
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search forms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="library">
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0">
          <TabsTrigger 
            value="library"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3"
          >
            Form Library
          </TabsTrigger>
          <TabsTrigger 
            value="submissions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3"
          >
            Submissions
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6 space-y-8">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading forms...</div>
          ) : Object.keys(groupedForms).length === 0 ? (
            <div className="text-center py-12 text-gray-500">No forms found</div>
          ) : (
            Object.entries(groupedForms).map(([category, categoryForms]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryForms.map(form => (
                    <Card key={form.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-lg">{form.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {form.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{form.description}</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {getFieldCount(form)} fields
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-slate-900 hover:bg-slate-800"
                              onClick={() => handleSendForm(form)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setPreviewForm(form)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadPDF(form)}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <div className="text-center py-12 text-gray-500">
            Form submissions will appear here
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="text-center py-12 text-gray-500">
            Form analytics will appear here
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="text-center py-12 text-gray-500">
            Form settings will appear here
          </div>
        </TabsContent>
      </Tabs>

      <CreateFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onFormCreated={loadForms}
      />

      <FormPreviewModal
        form={previewForm}
        onClose={() => setPreviewForm(null)}
      />
    </div>
  );
}