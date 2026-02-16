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
    full_day: true,
    start_date: "",
    end_date: "",
    reason_notes: "",
    use_pto: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.first_name || !formData.last_name || !formData.work_email || 
        !formData.start_date || !formData.end_date || !formData.reason_notes) {
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
        status: "pending"
      });

      // Send email notification to admin
      try {
        await base44.integrations.Core.SendEmail({
          to: "admin@calvarychristian.org", // Update with your admin email
          subject: "New Time-Off Request Submitted",
          body: `
            <h2>New Time-Off Request</h2>
            <p><strong>Employee:</strong> ${formData.first_name} ${formData.last_name}</p>
            <p><strong>Email:</strong> ${formData.work_email}</p>
            <p><strong>Start Date:</strong> ${formData.start_date}</p>
            <p><strong>End Date:</strong> ${formData.end_date}</p>
            <p><strong>Full Day:</strong> ${formData.full_day ? 'Yes' : 'No'}</p>
            <p><strong>Use PTO:</strong> ${formData.use_pto ? 'Yes' : 'No'}</p>
            <p><strong>Reason:</strong> ${formData.reason_notes}</p>
            <p>Please review and approve/deny this request.</p>
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
        full_day: true,
        start_date: "",
        end_date: "",
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