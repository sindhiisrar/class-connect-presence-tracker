
// Type definitions for the attendance application

export type UserRole = 'admin' | 'parent' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  // For parent users
  childrenIds?: string[];
  // For student users
  rollNumber?: string;
  class?: string;
  section?: string;
  parentId?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO format
  // Array of attendance status for each class (true = present, false = absent)
  classAttendance: boolean[];
}

// Mock data for demonstration
export const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@college.edu",
    role: "admin"
  },
  {
    id: "2",
    name: "Parent User",
    email: "parent@example.com",
    role: "parent",
    childrenIds: ["3"]
  },
  {
    id: "3",
    name: "Student User",
    email: "student@example.com",
    role: "student",
    rollNumber: "1001",
    class: "10",
    section: "A",
    parentId: "2"
  }
];

export const CLASS_NAMES = [
  "Mathematics",
  "Science",
  "Literature",
  "History",
  "Computer Science",
  "Physical Education",
  "Art"
];

// Generate mock attendance data for the current month
export const generateMockAttendance = (studentId: string): AttendanceRecord[] => {
  const today = new Date();
  const records: AttendanceRecord[] = [];
  
  // Generate records for the past 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    records.push({
      id: `${studentId}-${date.toISOString().split('T')[0]}`,
      studentId,
      date: date.toISOString().split('T')[0],
      classAttendance: Array(7).fill(null).map(() => Math.random() > 0.2) // 80% chance of being present
    });
  }
  
  return records;
};
