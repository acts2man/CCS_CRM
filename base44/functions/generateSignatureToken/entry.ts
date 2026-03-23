import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { studentDocumentId, parentEmail, parentName } = await req.json();

    const token = crypto.randomUUID();

    const sig = await base44.asServiceRole.entities.DocumentSignature.create({
      student_document_id: studentDocumentId,
      parent_email: parentEmail,
      parent_name: parentName,
      signature_token: token,
      is_signed: false,
      signature_type: 'acknowledged',
    });

    return Response.json({ token, signatureId: sig.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});