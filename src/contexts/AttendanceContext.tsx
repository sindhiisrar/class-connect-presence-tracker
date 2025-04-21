
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { AttendanceRecord, User, generateMockAttendance } from '@/lib/types';
import { useAuth } from './AuthContext';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  markAttendance: (studentId: string, date: string, classIndex: number, isPresent: boolean) => void;
  getStudentAttendance: (studentId: string) => AttendanceRecord[];
  getTodayAttendance: (studentId: string) => AttendanceRecord | undefined;
  getAttendanceByDate: (studentId: string, date: string) => AttendanceRecord | undefined;
  loadingAttendance: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const { currentUser } = useAuth();

  // In a real app, we would fetch attendance data from a backend
  // For this demo, we'll generate mock data
  useEffect(() => {
    if (currentUser) {
      // Initialize with mock data
      let records: AttendanceRecord[] = [];
      
      if (currentUser.role === 'admin') {
        // For admin, load all student records
        const studentIds = ["3"]; // In a real app, this would be fetched from the backend
        studentIds.forEach(id => {
          records = [...records, ...generateMockAttendance(id)];
        });
      } else if (currentUser.role === 'parent' && currentUser.childrenIds) {
        // For parent, load their children's records
        currentUser.childrenIds.forEach(id => {
          records = [...records, ...generateMockAttendance(id)];
        });
      } else if (currentUser.role === 'student') {
        // For student, load their own records
        records = generateMockAttendance(currentUser.id);
      }
      
      setAttendanceRecords(records);
    }
    
    setLoadingAttendance(false);
  }, [currentUser]);

  // Function to mark attendance for a student
  const markAttendance = (studentId: string, date: string, classIndex: number, isPresent: boolean) => {
    setAttendanceRecords(prevRecords => {
      const existingRecordIndex = prevRecords.findIndex(
        record => record.studentId === studentId && record.date === date
      );
      
      if (existingRecordIndex >= 0) {
        // Update existing record
        const updatedRecords = [...prevRecords];
        const record = {...updatedRecords[existingRecordIndex]};
        record.classAttendance[classIndex] = isPresent;
        updatedRecords[existingRecordIndex] = record;
        return updatedRecords;
      } else {
        // Create new record
        const newRecord: AttendanceRecord = {
          id: `${studentId}-${date}`,
          studentId,
          date,
          classAttendance: Array(7).fill(null).map((_, i) => i === classIndex ? isPresent : false)
        };
        return [...prevRecords, newRecord];
      }
    });
  };

  // Function to get all attendance records for a student
  const getStudentAttendance = (studentId: string) => {
    return attendanceRecords.filter(record => record.studentId === studentId);
  };

  // Function to get today's attendance for a student
  const getTodayAttendance = (studentId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return attendanceRecords.find(
      record => record.studentId === studentId && record.date === today
    );
  };

  // Function to get attendance for a specific date
  const getAttendanceByDate = (studentId: string, date: string) => {
    return attendanceRecords.find(
      record => record.studentId === studentId && record.date === date
    );
  };

  const value = {
    attendanceRecords,
    markAttendance,
    getStudentAttendance,
    getTodayAttendance,
    getAttendanceByDate,
    loadingAttendance
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = (): AttendanceContextType => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
