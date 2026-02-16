import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { User, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function TimeOff() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    work_email: "",
    submission_date: new Date().toISOString().split('T')[0],
    full_day: true,
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    total_hours: "",
    reason_notes: "",
    use_pto: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const requiredFields = !formData.first_name || !formData.last_name || !formData.work_email || 
        !formData.start_date || !formData.end_date || !formData.total_hours || !formData.reason_notes;
    
    const timeFieldsRequired = !formData.full_day && (!formData.start_time || !formData.end_time);
    
    if (requiredFields || timeFieldsRequired) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (formData.reason_notes.length < 10) {
      toast({
        title: "Invalid Input",
        description: "Please provide at least 10 characters for your reason.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create time off request
      const request = await base44.entities.TimeOffRequest.create({
        ...formData,
        total_hours: parseFloat(formData.total_hours),
        status: "pending"
      });

      // Sync to Google Sheets and send admin notification
      try {
        await base44.functions.invoke('syncTimeOffToSheets', { requestId: request.id });
      } catch (syncError) {
        console.error("Failed to sync to sheets:", syncError);
      }

      // Send email notification to admin
      try {
        await base44.integrations.Core.SendEmail({
          to: "troy@reputationguardians.net", // Update with your admin email
          subject: "New Time-Off Request Submitted",
          body: `
            <h2>New Time-Off Request</h2>
            <p><strong>Employee:</strong> ${formData.first_name} ${formData.last_name}</p>
            <p><strong>Email:</strong> ${formData.work_email}</p>
            <p><strong>Start Date:</strong> ${formData.start_date}</p>
            <p><strong>End Date:</strong> ${formData.end_date}</p>
            <p><strong>Full Day:</strong> ${formData.full_day ? 'Yes' : 'No'}</p>
            ${!formData.full_day ? `<p><strong>Time:</strong> ${formData.start_time} - ${formData.end_time}</p>` : ''}
            <p><strong>Total Hours:</strong> ${formData.total_hours}</p>
            <p><strong>Use PTO:</strong> ${formData.use_pto ? 'Yes' : 'No'}</p>
            <p><strong>Reason:</strong> ${formData.reason_notes}</p>
            <p>Please review in Google Sheets and mark Yes/No in the approval column.</p>
          `
        });
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }

      toast({
        title: "Request Submitted!",
        description: "Your time-off request has been submitted. Admin will be notified automatically."
      });

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        work_email: "",
        submission_date: new Date().toISOString().split('T')[0],
        full_day: true,
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        total_hours: "",
        reason_notes: "",
        use_pto: false
      });

    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6934d527b5d299be1ef1388b/45bebf8b0_71bb1844-5ca0-4a10-849d-ad0872b11863.png"
              alt="CCS Logo"
              className="h-20 w-20"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">CCS Time-Off Request</h1>
          <p className="text-gray-600">
            Request time off in under a minute. CCS admin will be notified automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Employee Information</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="work_email">Work Email *</Label>
                  <Input
                    id="work_email"
                    type="email"
                    value={formData.work_email}
                    onChange={(e) => setFormData({...formData, work_email: e.target.value})}
                    placeholder="Enter work email"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
              </div>

              <div className="space-y-4">
                {/* Submission Date */}
                <div>
                  <Label htmlFor="submission_date">Request Date (Today's Date) *</Label>
                  <Input
                    id="submission_date"
                    type="date"
                    value={formData.submission_date}
                    onChange={(e) => setFormData({...formData, submission_date: e.target.value})}
                    required
                  />
                </div>

                {/* Full Day Toggle */}
                <div className="flex items-center space-x-3">
                  <Switch
                    id="full_day"
                    checked={formData.full_day}
                    onCheckedChange={(checked) => setFormData({...formData, full_day: checked})}
                  />
                  <Label htmlFor="full_day" className="font-medium">Full Day</Label>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Times - Only show if not full day */}
                {!formData.full_day && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold">i</span>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 text-sm">Time Entry Example</p>
                        <p className="text-blue-800 text-sm mt-1">
                          <span className="font-medium">Example:</span> If you work 6:00 AM - 12:00 PM and want 2 hours off, enter:
                        </p>
                        <p className="text-blue-800 text-sm">Start Time: 10:00 AM (when your leave begins)</p>
                        <p className="text-blue-800 text-sm">End Time: 12:00 PM (when your leave ends)</p>
                      </div>
                    </div>
                  </div>
                )}

                {!formData.full_day && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                        required={!formData.full_day}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                        required={!formData.full_day}
                      />
                    </div>
                  </div>
                )}

                {/* Total Hours */}
                <div>
                  <Label htmlFor="total_hours">Total Hours *</Label>
                  <Input
                    id="total_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.total_hours}
                    onChange={(e) => setFormData({...formData, total_hours: e.target.value})}
                    placeholder="Enter total hours (e.g., 8 for full day)"
                    required
                  />
                </div>

                {/* Reason */}
                <div>
                  <Label htmlFor="reason_notes">Reason / Notes *</Label>
                  <Textarea
                    id="reason_notes"
                    value={formData.reason_notes}
                    onChange={(e) => setFormData({...formData, reason_notes: e.target.value})}
                    placeholder="Please provide details about your time-off request..."
                    rows={5}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.reason_notes.length}/10 characters minimum
                  </p>
                </div>

                {/* Use PTO Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use_pto"
                    checked={formData.use_pto}
                    onCheckedChange={(checked) => setFormData({...formData, use_pto: checked})}
                  />
                  <Label htmlFor="use_pto" className="text-sm font-normal cursor-pointer">
                    Use PTO if available?
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}