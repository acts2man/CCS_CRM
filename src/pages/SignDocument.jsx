import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SignDocument() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [doc, setDoc] = useState(null);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing signature link');
      setLoading(false);
      return;
    }
    loadDocument();
  }, [token]);

  const loadDocument = async () => {
    try {
      const sigs = await base44.entities.DocumentSignature.filter({ signature_token: token }, '', 1);
      if (!sigs || sigs.length === 0) {
        setError('Link expired or invalid');
        setLoading(false);
        return;
      }

      const sig = sigs[0];
      if (sig.is_signed) {
        setError('This document has already been signed');
        setLoading(false);
        return;
      }

      const doc = await base44.entities.StudentDocument.list('', 1);
      const studentDoc = doc.find(d => d.id === sig.student_document_id);
      if (!studentDoc) {
        setError('Document not found');
        setLoading(false);
        return;
      }

      const students = await base44.entities.Student.filter({ id: studentDoc.student_id }, '', 1);
      setDoc(studentDoc);
      setStudent(students[0]);
      setLoading(false);
    } catch (err) {
      setError('Failed to load document');
      setLoading(false);
    }
  };

  const handleSign = async () => {
    setSigning(true);
    try {
      const sigs = await base44.entities.DocumentSignature.filter({ signature_token: token }, '', 1);
      const sig = sigs[0];

      const signedAt = new Date().toISOString();
      await base44.entities.DocumentSignature.update(sig.id, {
        is_signed: true,
        signed_at: signedAt,
      });

      await base44.entities.StudentDocument.update(doc.id, {
        parent_acknowledged: true,
        parent_acknowledged_at: signedAt,
        status: 'acknowledged',
      });

      await base44.functions.invoke('sendSignatureConfirmation', {
        studentDocumentId: doc.id,
        signatureId: sig.id,
        parentEmail: sig.parent_email,
      });

      setSuccess(true);
    } catch (err) {
      setError('Failed to save signature');
    }
    setSigning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Signature Received</h1>
            <p className="text-gray-600 mb-6">
              Thank you for acknowledging the document. A confirmation has been sent to your email.
            </p>
            <p className="text-sm text-gray-500">
              You can close this page now.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 p-4">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Sign</h1>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-center">Acknowledge Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {student && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Student</p>
              <p className="font-semibold text-gray-900">{student.first_name} {student.last_name}</p>
            </div>
          )}

          {doc && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Document</p>
                <p className="font-semibold text-gray-900">{doc.title}</p>
              </div>
              {doc.form_data && Object.keys(doc.form_data).length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 mb-2">Details</p>
                  <div className="space-y-2">
                    {Object.entries(doc.form_data).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-gray-600">{key}: </span>
                        <span className="text-gray-900 font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {doc.notes && (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{doc.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm text-gray-600">
              By clicking below, you acknowledge that you have reviewed this document and received a copy.
            </p>
            <Button
              onClick={handleSign}
              disabled={signing}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {signing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Acknowledging...
                </>
              ) : (
                'I Acknowledge'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}