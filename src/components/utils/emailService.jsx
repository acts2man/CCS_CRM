import { base44 } from "@/api/base44Client";

// Email templates
const templates = {
  PARENT_CONTACT: (data) => ({
    subject: data.message_subject || "Message from School",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Message Regarding ${data.student_name}</h2>
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 16px 0;"><strong>From:</strong> ${data.sender_name}</p>
          <p style="margin: 0 0 16px 0;"><strong>Subject:</strong> ${data.message_subject}</p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
            <p style="white-space: pre-wrap;">${data.message_content}</p>
          </div>
        </div>
        <p style="color: #718096; font-size: 14px;">
          This message was sent through the Calvary Christian School portal.
        </p>
      </div>
    `,
  }),

  FORM_NOTIFICATION: (data) => ({
    subject: `Action Required: ${data.form_title}`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Form Submission Required</h2>
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0;">${data.form_title}</h3>
          ${data.form_description ? `<p style="color: #4a5568; margin: 0 0 16px 0;">${data.form_description}</p>` : ""}
          ${data.student_name ? `<p style="margin: 0 0 12px 0;"><strong>Student:</strong> ${data.student_name}</p>` : ""}
          ${data.expiration_date ? `<p style="margin: 0 0 12px 0;"><strong>Due Date:</strong> ${data.expiration_date}</p>` : ""}
          ${data.custom_message ? `<p style="margin: 16px 0; padding: 12px; background: white; border-radius: 4px;">${data.custom_message}</p>` : ""}
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.form_link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Complete Form
          </a>
        </div>
        <p style="color: #718096; font-size: 12px; text-align: center;">
          If the button doesn't work, copy and paste this link: ${data.form_link}
        </p>
      </div>
    `,
  }),

  DOCUMENT_SHARE: (data) => ({
    subject: `Document Shared: ${data.document_name}`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Document Shared With You</h2>
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0;">${data.document_name}</h3>
          <p style="margin: 0 0 12px 0;"><strong>Category:</strong> ${data.document_category}</p>
          ${data.student_name ? `<p style="margin: 0 0 12px 0;"><strong>Student:</strong> ${data.student_name}</p>` : ""}
          <p style="margin: 0 0 12px 0;"><strong>Uploaded:</strong> ${data.upload_date}</p>
          ${data.description ? `<p style="color: #4a5568;">${data.description}</p>` : ""}
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.document_url}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            View Document
          </a>
        </div>
      </div>
    `,
  }),

  AUTOMATION_NOTIFICATION: (data) => ({
    subject: data.notification_title,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">${data.notification_title}</h2>
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${data.student_name ? `<p style="margin: 0 0 12px 0;"><strong>Student:</strong> ${data.student_name}</p>` : ""}
          <div style="margin: 16px 0;">
            <p style="white-space: pre-wrap;">${data.notification_content}</p>
          </div>
          ${data.action_required ? `
            <div style="background-color: #fef3c7; padding: 12px; border-radius: 4px; margin-top: 16px;">
              <p style="margin: 0; color: #92400e;"><strong>Action Required:</strong> ${data.action_required}</p>
            </div>
          ` : ""}
        </div>
      </div>
    `,
  }),

  ATTENDANCE_ALERT: (data) => ({
    subject: `Attendance Alert: ${data.student_name}`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Attendance Notification</h2>
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 12px 0;"><strong>Student:</strong> ${data.student_name}</p>
          <p style="margin: 0 0 12px 0;"><strong>Date:</strong> ${data.date}</p>
          <p style="margin: 0 0 12px 0;"><strong>Status:</strong> ${data.status}</p>
          ${data.reason ? `<p style="margin: 0 0 12px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ""}
        </div>
        <p style="color: #718096; font-size: 14px;">
          Please contact the school if you have any questions or concerns.
        </p>
      </div>
    `,
  }),
};

export class EmailService {
  /**
   * Send an email using Base44's email integration
   * @param {Object} emailData - Email configuration
   * @param {string|string[]} emailData.to - Recipient email(s)
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.body - Email body (HTML)
   * @param {string} emailData.from_name - Sender name (optional)
   * @param {string} emailData.template - Template name (optional)
   * @param {Object} emailData.templateData - Template data (optional)
   */
  static async sendEmail(emailData) {
    try {
      let { to, subject, body, from_name, template, templateData } = emailData;

      // Process template if specified
      if (template && templates[template]) {
        const rendered = templates[template](templateData || {});
        subject = subject || rendered.subject;
        body = body || rendered.body;
      }

      if (!to || !subject || !body) {
        throw new Error("Recipient, subject, and body are required");
      }

      // Handle multiple recipients
      const recipients = Array.isArray(to) ? to : [to];
      
      // Send email via Base44
      const result = await base44.integrations.Core.SendEmail({
        from_name: from_name || "Calvary Christian School",
        to: recipients[0], // Base44 SendEmail takes single recipient
        subject: subject,
        body: body
      });

      return {
        success: true,
        message: "Email sent successfully",
        result
      };
    } catch (error) {
      console.error("Email service error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email"
      };
    }
  }

  /**
   * Send email to parent about their student
   */
  static async sendParentContact(data) {
    return this.sendEmail({
      to: data.to,
      template: "PARENT_CONTACT",
      templateData: {
        student_name: data.studentName,
        message_subject: data.subject,
        message_content: data.message,
        sender_name: data.senderName,
      }
    });
  }

  /**
   * Send form notification to recipient(s)
   */
  static async sendFormNotification(data) {
    return this.sendEmail({
      to: data.to,
      template: "FORM_NOTIFICATION",
      templateData: {
        form_title: data.formTitle,
        form_description: data.formDescription,
        student_name: data.studentName,
        expiration_date: data.expirationDate,
        custom_message: data.customMessage,
        form_link: data.formLink,
      }
    });
  }

  /**
   * Send document share notification
   */
  static async sendDocumentShare(data) {
    return this.sendEmail({
      to: data.to,
      template: "DOCUMENT_SHARE",
      templateData: {
        document_name: data.documentName,
        document_category: data.documentCategory,
        student_name: data.studentName,
        upload_date: data.uploadDate,
        description: data.description,
        document_url: data.documentUrl,
      }
    });
  }

  /**
   * Send automation-triggered notification
   */
  static async sendAutomationNotification(data) {
    return this.sendEmail({
      to: data.to,
      template: "AUTOMATION_NOTIFICATION",
      templateData: {
        notification_title: data.notificationTitle,
        student_name: data.studentName,
        notification_content: data.notificationContent,
        action_required: data.actionRequired,
      }
    });
  }

  /**
   * Send attendance alert to parent
   */
  static async sendAttendanceAlert(data) {
    return this.sendEmail({
      to: data.to,
      template: "ATTENDANCE_ALERT",
      templateData: {
        student_name: data.studentName,
        date: data.date,
        status: data.status,
        reason: data.reason,
      }
    });
  }

  /**
   * Send bulk emails (with rate limiting)
   */
  static async sendBulkEmails(recipients, emailData) {
    let successful = 0;
    let failed = 0;
    const errors = [];

    const batchSize = 5; // Smaller batches for Base44
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const promises = batch.map(async (recipient) => {
        try {
          await this.sendEmail({ ...emailData, to: recipient });
          successful++;
        } catch (error) {
          failed++;
          errors.push(`${recipient}: ${error.message}`);
        }
      });

      await Promise.all(promises);
      
      // Rate limiting pause between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return { successful, failed, errors };
  }
}

/**
 * Show email result notification
 */
export const showEmailResult = (result) => {
  if (result.success) {
    console.log("✅ Email sent:", result.message);
  } else {
    console.error("❌ Email failed:", result.error);
  }
};