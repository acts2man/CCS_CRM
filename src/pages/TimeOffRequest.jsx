import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { User, Calendar, Loader2, CheckCircle2 } from "lucide-react";

export default function TimeOffRequest() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
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
    setError("");

    const missingRequired = !formData.first_name || !formData.last_name || !formData.work_email ||
      !formData.start_date || !formData.end_date || !formData.total_hours || !formData.reason_notes;
    const missingTime = !formData.full_day && (!formData.start_time || !formData.end_time);

    if (missingRequired || missingTime) {
      setError("Please fill in all required fields.");
      return;
    }
    if (formData.reason_notes.length < 10) {
      setError("Please provide at least 10 characters for your reason.");
      return;
    }

    setLoading(true);
    const request = await base44.entities.TimeOffRequest.create({
      ...formData,
      total_hours: parseFloat(formData.total_hours),
      status: "pending"
    });

    base44.functions.invoke('sendAdminNotification', {
      requestId: request.id,
      firstName: formData.first_name,
      lastName: formData.last_name,
      email: formData.work_email,
      startDate: formData.start_date,
      endDate: formData.end_date,
      fullDay: formData.full_day,
      startTime: formData.start_time,
      endTime: formData.end_time,
      totalHours: formData.total_hours,
      usePto: formData.use_pto,
      reason: formData.reason_notes
    });

    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-12 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Request Submitted!</h2>
          <p className="text-gray-600 mb-2">Your time-off request has been sent to the admin for review.</p>
          <p className="text-gray-500 text-sm">You'll receive an email once a decision has been made.</p>
          <button
            onClick={() => { setSubmitted(false); setFormData({ first_name: "", last_name: "", work_email: "", submission_date: new Date().toISOString().split('T')[0], full_day: true, start_date: "", end_date: "", start_time: "", end_time: "", total_hours: "", reason_notes: "", use_pto: false }); }}
            className="mt-8 text-sm text-blue-600 hover:underline"
          >
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6934d527b5d299be1ef1388b/45bebf8b0_71bb1844-5ca0-4a10-849d-ad0872b11863.png"
              alt="CCS Logo"
              className="h-20 w-20"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">CCS Time-Off Request</h1>
          <p className="text-gray-600">Request time off in under a minute. Admin will be notified automatically.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

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
                    <Input id="first_name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} placeholder="Enter first name" required />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input id="last_name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} placeholder="Enter last name" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="work_email">Work Email *</Label>
                  <Input id="work_email" type="email" value={formData.work_email} onChange={(e) => setFormData({ ...formData, work_email: e.target.value })} placeholder="Enter work email" required />
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
                <div>
                  <Label htmlFor="submission_date">Request Date *</Label>
                  <Input id="submission_date" type="date" value={formData.submission_date} onChange={(e) => setFormData({ ...formData, submission_date: e.target.value })} required />
                </div>

                <div className="flex items-center space-x-3">
                  <Switch id="full_day" checked={formData.full_day} onCheckedChange={(checked) => setFormData({ ...formData, full_day: checked })} />
                  <Label htmlFor="full_day" className="font-medium">Full Day</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input id="start_date" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input id="end_date" type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
                  </div>
                </div>

                {!formData.full_day && (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-blue-900 text-sm font-semibold mb-1">Time Entry Example</p>
                      <p className="text-blue-800 text-sm">Enter the start and end times for your partial day leave (e.g., 10:00 AM – 12:00 PM).</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_time">Start Time *</Label>
                        <Input id="start_time" type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} required={!formData.full_day} />
                      </div>
                      <div>
                        <Label htmlFor="end_time">End Time *</Label>
                        <Input id="end_time" type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} required={!formData.full_day} />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="total_hours">Total Hours *</Label>
                  <Input id="total_hours" type="number" step="0.5" min="0" value={formData.total_hours} onChange={(e) => setFormData({ ...formData, total_hours: e.target.value })} placeholder="e.g., 8 for a full day" required />
                </div>

                <div>
                  <Label htmlFor="reason_notes">Reason / Notes *</Label>
                  <Textarea id="reason_notes" value={formData.reason_notes} onChange={(e) => setFormData({ ...formData, reason_notes: e.target.value })} placeholder="Please provide details about your time-off request..." rows={5} required />
                  <p className="text-xs text-gray-500 mt-1">{formData.reason_notes.length}/10 characters minimum</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="use_pto" checked={formData.use_pto} onCheckedChange={(checked) => setFormData({ ...formData, use_pto: checked })} />
                  <Label htmlFor="use_pto" className="text-sm font-normal cursor-pointer">Use PTO if available?</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg">
              {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting...</> : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}