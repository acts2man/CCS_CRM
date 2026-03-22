import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X, Plus } from "lucide-react";

export default function AddTeacherModal({ open, onOpenChange, onTeacherAdded }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const fileInputRef = useRef(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedGradeLevels, setSelectedGradeLevels] = useState([]);
  const [currentSubject, setCurrentSubject] = useState("");
  const [currentGradeLevel, setCurrentGradeLevel] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    employment_start: "",
    status: "Active",
    homeroom: "",
    education: "",
    biography: "",
  });

  const departments = [
    "Mathematics",
    "English",
    "Science",
    "Social Studies",
    "Physical Education",
    "Arts",
    "Music",
    "Technology",
    "Foreign Language",
  ];

  const availableSubjects = [
    "Mathematics",
    "English",
    "World History",
    "Government",
    "Economics",
    "Literature",
    "Physics",
    "Chemistry",
    "Biology",
    "Physical Education",
    "Art",
    "Music",
  ];

  const availableGradeLevels = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const addSubject = () => {
    if (currentSubject && !selectedSubjects.includes(currentSubject)) {
      setSelectedSubjects([...selectedSubjects, currentSubject]);
      setCurrentSubject("");
    }
  };

  const removeSubject = (subject) => {
    setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
  };

  const addGradeLevel = () => {
    if (currentGradeLevel && !selectedGradeLevels.includes(currentGradeLevel)) {
      setSelectedGradeLevels([...selectedGradeLevels, currentGradeLevel]);
      setCurrentGradeLevel("");
    }
  };

  const removeGradeLevel = (level) => {
    setSelectedGradeLevels(selectedGradeLevels.filter(l => l !== level));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const teacherData = {
        ...formData,
        subjects: selectedSubjects,
        grade_levels: selectedGradeLevels,
        avatar: photoUrl || undefined,
      };

      await base44.entities.Teacher.create(teacherData);

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        department: "",
        employment_start: "",
        status: "Active",
        homeroom: "",
        education: "",
        biography: "",
      });
      setPhotoUrl("");
      setSelectedSubjects([]);
      setSelectedGradeLevels([]);

      if (onTeacherAdded) onTeacherAdded();
    } catch (error) {
      console.error("Error creating teacher:", error);
      alert("Failed to create teacher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Teacher</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="w-24 h-24">
              <AvatarImage src={photoUrl} alt="Teacher photo" />
              <AvatarFallback className="bg-gray-100">
                <Upload className="w-8 h-8 text-gray-400" />
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Photo'
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@calvary.edu"
              />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employment Start Date *</Label>
              <Input
                type="date"
                required
                value={formData.employment_start}
                onChange={(e) => setFormData({ ...formData, employment_start: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Homeroom</Label>
              <Input
                value={formData.homeroom}
                onChange={(e) => setFormData({ ...formData, homeroom: e.target.value })}
                placeholder="e.g., 9C"
              />
            </div>
          </div>

          <div>
            <Label>Education *</Label>
            <Input
              required
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              placeholder="e.g., M.S. in Mathematics, Stanford University"
            />
          </div>

          <div>
            <Label>Subjects</Label>
            <div className="flex gap-2 mb-2">
              <Select value={currentSubject} onValueChange={setCurrentSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addSubject} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedSubjects.map((subject) => (
                <div
                  key={subject}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {subject}
                  <button type="button" onClick={() => removeSubject(subject)}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Grade Levels</Label>
            <div className="flex gap-2 mb-2">
              <Select value={currentGradeLevel} onValueChange={setCurrentGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableGradeLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      Grade {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addGradeLevel} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedGradeLevels.map((level) => (
                <div
                  key={level}
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  Grade {level}
                  <button type="button" onClick={() => removeGradeLevel(level)}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Biography</Label>
            <Textarea
              value={formData.biography}
              onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
              placeholder="Brief biography and teaching philosophy..."
              className="h-24"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Teacher'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}