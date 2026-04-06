# CRM Relationship Architecture Stabilization

## Single Sources of Truth (Implemented)

### 1. Student ↔ Parent Relationship
- **SINGLE SOURCE**: `Student.parent_ids[]` ← ONLY authority
- **DEPRECATED**: `Parent.student_ids[]` ← NOT used in any logic

#### Updated Query Logic
```javascript
// lib/entitySyncUtils.js - getStudentsForParent()
export async function getStudentsForParent(parentId) {
  const allStudents = await base44.entities.Student.list();
  // SINGLE SOURCE OF TRUTH: Filter by Student.parent_ids[]
  const children = allStudents.filter(s => s.parent_ids?.includes(parentId));
  return { students: children, error: null };
}
```

#### Used By
- `pages/ParentDashboard` — Fetches parent's children
- `pages/ParentStudents` — Lists parent's children
- `components/layouts/ParentLayout` — Identity resolution

---

### 2. Teacher ↔ Student Relationship  
- **SINGLE SOURCE**: `ClassSection.teacher_id` + `ClassSection.student_ids[]` ← ONLY authority
- **DEPRECATED**: `Student.teacher_ids[]` ← NOT used in any logic

#### Updated Query Logic
```javascript
// lib/entitySyncUtils.js - NEW getStudentsForTeacher()
export async function getStudentsForTeacher(teacherId) {
  // SINGLE SOURCE OF TRUTH: Derive via ClassSection ONLY
  const allClasses = await base44.entities.ClassSection.list();
  const teacherClasses = allClasses.filter(c => c.teacher_id === teacherId);
  
  // Collect unique student IDs from teacher's classes
  const studentIds = new Set();
  teacherClasses.forEach(cls => {
    if (cls.student_ids && Array.isArray(cls.student_ids)) {
      cls.student_ids.forEach(id => studentIds.add(id));
    }
  });
  
  const allStudents = await base44.entities.Student.list();
  const students = allStudents.filter(s => studentIds.has(s.id));
  return { students, classes: teacherClasses, error: null };
}
```

#### Updated Pages
- `pages/TeacherDashboard` (line 47-51)
  - **BEFORE**: `allStudents.filter(s => s.teacher_ids?.includes(teacherId))`
  - **AFTER**: Counts unique students from `ClassSection.student_ids[]`

- `pages/StudentDirectory` (line 37-42)
  - **BEFORE**: `studentsData.filter(s => s.teacher_ids?.includes(teacherId))`
  - **AFTER**: Uses `getStudentsForTeacher(teacherId)`

---

### 3. Student ↔ Class Relationship
- **SINGLE SOURCE**: `ClassSection.student_ids[]` ← ONLY authority
- Already correctly implemented (no changes needed)

#### Used By
- All class-based queries (gradebook, assignments, attendance)
- Parent dashboard (enrollment detection)

---

## Files Changed

### Core Query Logic
| File | Change | Impact |
|------|--------|--------|
| `lib/entitySyncUtils.js` | Added `getStudentsForTeacher()` | New function for teacher→students queries |
| `lib/entitySyncUtils.js` | Updated `getStudentsForParent()` | Added SSoT comment |
| `lib/entitySyncUtils.js` | Updated `getParentsForStudent()` | Added SSoT comment |

### Pages Updated
| Page | Change | Lines |
|------|--------|-------|
| `pages/TeacherDashboard` | Changed student count logic | 31-64 |
| `pages/StudentDirectory` | Changed myStudents filter | 31-48 |
| `pages/ParentDashboard` | Added SSoT comment | 35-37 |
| `pages/ParentStudents` | Added SSoT comment | 16-26 |

---

## Dashboards — Testing Checklist

### ✅ Teacher Dashboard
- Loads without errors
- Shows correct class count (from ClassSection.teacher_id)
- Shows correct student count (from ClassSection.student_ids[] uniqueness)
- Displays correct assignment count
- Quick links work

### ✅ Parent Dashboard  
- Loads without errors
- Shows correct child count (from Student.parent_ids[])
- Loads children's assignment, billing, and attendance data
- No errors on empty child list
- Quick links work

### ✅ Student Dashboard
- No changes (already correct)

### ✅ Teacher Classes
- Lists only teacher's classes (ClassSection.teacher_id)
- No changes needed (already correct)

### ✅ Student Directory (Teachers view)
- Shows all students
- "My Students" tab filters via ClassSection correctly
- Can click to view student profile

---

## Data Integrity Notes

### No Dual-Write Risk
- Parent-child relationship: Only Student.parent_ids[] is queried
- Teacher-student relationship: Only ClassSection is queried
- No logic tries to sync between Student.teacher_ids[] and ClassSection

### Backward Compatibility
- `Student.teacher_ids[]` field still exists (NOT deleted)
- `Parent.student_ids[]` field still exists (NOT deleted)
- If data drift occurs, fields can be used for auditing

### Next Steps (Phase 2)
1. Monitor for data inconsistencies between Student.teacher_ids[] and ClassSection
2. Create admin cleanup function to remove Student.teacher_ids[] values if they don't match ClassSection
3. Eventually delete deprecated fields after validation period

---

## Summary

✅ **Single source of truth established**
- Parent→Children: `Student.parent_ids[]` only
- Teacher→Students: `ClassSection.teacher_id` + `ClassSection.student_ids[]` only
- No circular dependencies or redundant queries
- All dashboards working without breaking changes