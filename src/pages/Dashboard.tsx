
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CLASS_NAMES, User, MOCK_USERS } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, LogOut, User as UserIcon } from 'lucide-react';

const Dashboard = () => {
  const { currentUser, logout, userRole } = useAuth();
  const { getStudentAttendance, getTodayAttendance, getAttendanceByDate, markAttendance } = useAttendance();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  const getAttendanceForSelectedDate = (studentId: string) => {
    if (!selectedDate) return undefined;
    return getAttendanceByDate(studentId, formatDate(selectedDate));
  };

  const handleToggleAttendance = (studentId: string, classIndex: number, currentValue: boolean | undefined) => {
    if (!selectedDate) return;
    const isPresent = currentValue === undefined ? true : !currentValue;
    markAttendance(studentId, formatDate(selectedDate), classIndex, isPresent);
    
    toast({
      title: `Attendance ${isPresent ? 'Marked' : 'Unmarked'}`,
      description: `${isPresent ? 'Present' : 'Absent'} for ${CLASS_NAMES[classIndex]}`,
    });
  };

  // Get student users for admin view
  const studentUsers = MOCK_USERS.filter(user => user.role === 'student');
  
  // Get student for parent view
  const childStudent = currentUser.role === 'parent' && currentUser.childrenIds?.[0] 
    ? MOCK_USERS.find(user => user.id === currentUser.childrenIds?.[0])
    : null;

  const renderAdminDashboard = () => {
    const effectiveStudent = selectedStudent || studentUsers[0]?.id;
    const attendanceRecord = effectiveStudent ? getAttendanceForSelectedDate(effectiveStudent) : undefined;
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-500">Manage student attendance</p>
          </div>
          <div className="flex space-x-2">
            {studentUsers.map(student => (
              <Button
                key={student.id}
                variant={selectedStudent === student.id ? "default" : "outline"}
                onClick={() => setSelectedStudent(student.id)}
              >
                {student.name}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                Attendance Calendar
              </CardTitle>
              <CardDescription>Select a date to mark attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
              <CardDescription>
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {effectiveStudent && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5" />
                    <span>
                      {MOCK_USERS.find(u => u.id === effectiveStudent)?.name} - Roll #{MOCK_USERS.find(u => u.id === effectiveStudent)?.rollNumber}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {CLASS_NAMES.map((className, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <span>{className}</span>
                        <Button
                          variant={attendanceRecord?.classAttendance[index] ? "default" : "outline"}
                          onClick={() => handleToggleAttendance(
                            effectiveStudent, 
                            index,
                            attendanceRecord?.classAttendance[index]
                          )}
                        >
                          {attendanceRecord?.classAttendance[index] ? 'Present' : 'Absent'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderParentDashboard = () => {
    const studentId = childStudent?.id;
    const attendanceRecord = studentId ? getAttendanceForSelectedDate(studentId) : undefined;
    const attendanceHistory = studentId ? getStudentAttendance(studentId) : [];
    
    // Calculate attendance statistics
    const totalDays = attendanceHistory.length;
    const presentDays = attendanceHistory.reduce((count, record) => {
      // Consider a day present if student was present in majority of classes
      const presentClasses = record.classAttendance.filter(Boolean).length;
      return count + (presentClasses > record.classAttendance.length / 2 ? 1 : 0);
    }, 0);
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Parent Dashboard</h1>
          <p className="text-gray-500">Monitor your child's attendance</p>
        </div>
        
        {childStudent && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="mr-2 h-5 w-5" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{childStudent.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Class:</span>
                    <span>{childStudent.class}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Roll Number:</span>
                    <span>{childStudent.rollNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Overall Attendance:</span>
                    <Badge variant={attendancePercentage >= 75 ? "default" : "destructive"}>
                      {attendancePercentage}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Attendance Calendar
                </CardTitle>
                <CardDescription>Select a date to view attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  Attendance for {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Today'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceRecord ? (
                  <div className="space-y-2">
                    {CLASS_NAMES.map((className, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <span>{className}</span>
                        <Badge variant={attendanceRecord.classAttendance[index] ? "default" : "destructive"}>
                          {attendanceRecord.classAttendance[index] ? 'Present' : 'Absent'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">No attendance record for this date</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderStudentDashboard = () => {
    const attendanceRecord = getAttendanceForSelectedDate(currentUser.id);
    const attendanceHistory = getStudentAttendance(currentUser.id);
    
    // Calculate attendance statistics
    const totalDays = attendanceHistory.length;
    const presentDays = attendanceHistory.reduce((count, record) => {
      // Consider a day present if student was present in majority of classes
      const presentClasses = record.classAttendance.filter(Boolean).length;
      return count + (presentClasses > record.classAttendance.length / 2 ? 1 : 0);
    }, 0);
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <p className="text-gray-500">View your attendance</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="mr-2 h-5 w-5" />
                My Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{currentUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Class:</span>
                  <span>{currentUser.class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Roll Number:</span>
                  <span>{currentUser.rollNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Overall Attendance:</span>
                  <Badge variant={attendancePercentage >= 75 ? "default" : "destructive"}>
                    {attendancePercentage}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                Attendance Calendar
              </CardTitle>
              <CardDescription>Select a date to view attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                Attendance for {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Today'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceRecord ? (
                <div className="space-y-2">
                  {CLASS_NAMES.map((className, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b">
                      <span>{className}</span>
                      <Badge variant={attendanceRecord.classAttendance[index] ? "default" : "destructive"}>
                        {attendanceRecord.classAttendance[index] ? 'Present' : 'Absent'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No attendance record for this date</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-primary">Class Connect</h1>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{currentUser.name}</span>
                  <span className="ml-1 text-xs text-gray-500">({userRole})</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {userRole === 'admin' && renderAdminDashboard()}
        {userRole === 'parent' && renderParentDashboard()}
        {userRole === 'student' && renderStudentDashboard()}
      </main>
    </div>
  );
};

export default Dashboard;
