import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ENTITIES = [
  'Student', 'Teacher', 'Parent', 'ClassSection', 'Class', 'Course',
  'ClassPeriod', 'Assignment', 'AssignmentGrade', 'Grade', 'GradeCategory',
  'GradingPeriodConfig', 'ReportCard', 'Attendance', 'AttendanceSettings',
  'StudentClockInOut', 'ClockInOutAudit', 'StudentDocument', 'DocumentSignature',
  'DocumentTemplate', 'Notification', 'TimeOffRequest', 'AdminNote',
  'FormAcknowledgment', 'SchoolForm', 'Bulletin', 'Subject', 'ClassEnrollment',
  'ParentCommunicationLog', 'ParentContact', 'Message', 'ChatMessage',
  'ChatGroup', 'ChatGroupMember', 'ChatThread', 'ChatAttachment',
  'FormTemplate', 'FormSubmission', 'FormResponse', 'FormFieldType',
  'Invoice', 'InvoiceItem', 'Payment', 'Transaction', 'Charge',
  'StudentBalance', 'Product', 'PaymentGateway', 'TaxRate', 'PaymentLink',
  'TeacherActivity', 'AutomationStep', 'Automation', 'ExecutionLog',
  'SchoolSettings', 'Document', 'Form', 'User',
];

async function fetchAll(base44, entityName) {
  const results = [];
  const pageSize = 200;
  let skip = 0;
  while (true) {
    let page;
    try {
      if (entityName === 'User') {
        page = await base44.asServiceRole.entities.User.list(undefined, pageSize, skip);
      } else {
        page = await base44.asServiceRole.entities[entityName].list(undefined, pageSize, skip);
      }
    } catch (e) {
      // Entity might not exist or be empty — skip it
      return { records: results, error: e.message };
    }
    if (!page || page.length === 0) break;
    results.push(...page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return { records: results, error: null };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const output = {};
    const summary = [];

    for (const entityName of ENTITIES) {
      const { records, error } = await fetchAll(base44, entityName);
      output[entityName] = records;
      summary.push({ entity: entityName, count: records.length, error });
    }

    return Response.json({ data: output, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});