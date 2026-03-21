import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getParentByUserEmail, getStudentsForParent } from "@/lib/entitySyncUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink } from "lucide-react";
import DocumentDetailModal from "@/components/students/DocumentDetailModal";

export default function ParentDocuments() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      const user = await base44.auth.me();
      
      const { parent: parentData, error: parentError } = await getParentByUserEmail(user.email);
      
      if (parentError || !parentData) {
        console.error("Parent sync error:", parentError);
        setLoading(false);
        return;
      }
      
      const { students: myChildren, error: childrenError } = await getStudentsForParent(parentData.id);
      
      if (childrenError) {
        console.error("Children fetch error:", childrenError);
      }
      
      setChildren(myChildren);
      if (myChildren.length > 0) {
        setSelectedChild(myChildren[0]);
        loadChildDocuments(myChildren[0].id);
      }
    } catch (error) {
      console.error("Error loading parent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildDocuments = async (studentId) => {
    try {
      const allDocs = await base44.entities.StudentDocument.filter({
        student_id: studentId
      });
      setDocuments(allDocs);
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-1">View documents for your children</p>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => {
                setSelectedChild(child);
                loadChildDocuments(child.id);
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedChild?.id === child.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {child.first_name} {child.last_name}
            </button>
          ))}
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-3">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No documents shared yet.</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card 
              key={doc.id} 
              className="hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
              onClick={() => setSelectedDocument(doc)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                    </div>
                    {doc.submitted_by_name && (
                      <p className="text-sm text-gray-600">From: {doc.submitted_by_name}</p>
                    )}
                  </div>
                  <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedDocument && (
        <DocumentDetailModal 
          document={selectedDocument} 
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}