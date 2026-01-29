import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CourseCard from '../components/CourseCard';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../api';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  // State for course list
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

  // State for course details
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [editingMarks, setEditingMarks] = useState(null);
  const [marksForm, setMarksForm] = useState({
    class_quiz: 0,
    class_assignment: 0,
    class_mid: 0,
    class_final: 0,
    lab_quiz: 0,
    lab_assignment: 0,
    lab_mid: 0,
    lab_final: 0
  });

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
    } else {
      fetchCourses();
    }
  }, [id]);

  const fetchCourses = async () => {
    try {
      const data = await apiGet('/courses/available', {
        'Authorization': `Bearer ${token}`
      });
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      const [courseData, studentsData] = await Promise.all([
        apiGet(`/courses/${id}`, {
          'Authorization': `Bearer ${token}`
        }),
        user.role === 'TEACHER' ? apiGet(`/teachers/courses/${id}/students`, {
          'Authorization': `Bearer ${token}`
        }) : null
      ]);

      setCourse(courseData);
      if (studentsData) {
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await apiPost('/students/enroll', { course_id: courseId }, {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      alert('Successfully enrolled in course!');
      fetchCourses(); // Refresh the list
    } catch (error) {
      alert(error.message || 'Enrollment failed');
    } finally {
      setEnrolling(null);
    }
  };

  const handleUpdateMarks = async (studentId) => {
    try {
      await apiPost(`/teachers/marks/${studentId}/${id}`, marksForm, {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      alert('Marks updated successfully!');
      setEditingMarks(null);
      setMarksForm({
        class_quiz: 0, class_assignment: 0, class_mid: 0, class_final: 0,
        lab_quiz: 0, lab_assignment: 0, lab_mid: 0, lab_final: 0
      });
    } catch (error) {
      alert(error.message || 'Failed to update marks');
    }
  };

  const handleEditMarks = async (studentId) => {
    setActiveTab('marks');
    try {
      const marksData = await apiGet(`/teachers/marks/${studentId}/${id}`, {
        'Authorization': `Bearer ${token}`
      });

      setMarksForm({
        class_quiz: marksData.class_quiz || 0,
        class_assignment: marksData.class_assignment || 0,
        class_mid: marksData.class_mid || 0,
        class_final: marksData.class_final || 0,
        lab_quiz: marksData.lab_quiz || 0,
        lab_assignment: marksData.lab_assignment || 0,
        lab_mid: marksData.lab_mid || 0,
        lab_final: marksData.lab_final || 0 // Fixed comma here
      });
    } catch (error) {
      console.error('Error fetching marks:', error);
      // Keep defaults if fetch fails
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // If we're viewing a specific course
  if (id && course) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(user.role === 'TEACHER' ? '/teacher/courses' : '/student/courses')}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Courses
          </button>

          {/* Course Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{course?.title}</h1>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Course Code</p>
                <p className="font-semibold">{course?.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Credit Hours</p>
                <p className="font-semibold">{course?.credit_hours}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Semester</p>
                <p className="font-semibold">{course?.semester}</p>
              </div>
              {user.role === 'TEACHER' && (
                <div>
                  <p className="text-sm text-gray-500">Enrolled Students</p>
                  <p className="font-semibold">{students.length}</p>
                </div>
              )}
            </div>
            {course?.description && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-700">{course.description}</p>
              </div>
            )}
          </div>

          {/* Tabs - Only show for teachers */}
          {user.role === 'TEACHER' && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`px-6 py-3 font-medium ${activeTab === 'students'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    Students
                  </button>
                  <button
                    onClick={() => setActiveTab('marks')}
                    className={`px-6 py-3 font-medium ${activeTab === 'marks'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    Manage Marks
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'students' && (
                  <div>
                    {students.length > 0 ? (
                      <div className="space-y-4">
                        {students.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                          >
                            <div>
                              <p className="font-semibold text-gray-800">{student.name}</p>
                              <p className="text-sm text-gray-500">{student.email}</p>
                            </div>
                            <button
                              onClick={() => {
                                setEditingMarks(student.id);
                                handleEditMarks(student.id);
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                            >
                              Update Marks
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No students enrolled yet</p>
                    )}
                  </div>
                )}

                {activeTab === 'marks' && (
                  <div>
                    {editingMarks ? (
                      <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Update Student Marks</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quiz Marks (out of 10)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={marksForm.class_quiz}
                              onChange={(e) => setMarksForm({ ...marksForm, class_quiz: parseFloat(e.target.value) || 0 })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Assignment Marks (out of 15)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="15"
                              value={marksForm.class_assignment}
                              onChange={(e) => setMarksForm({ ...marksForm, class_assignment: parseFloat(e.target.value) || 0 })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mid Term Marks (out of 25)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="25"
                              value={marksForm.class_mid}
                              onChange={(e) => setMarksForm({ ...marksForm, class_mid: parseFloat(e.target.value) || 0 })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Final Marks (out of 50)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={marksForm.class_final}
                              onChange={(e) => setMarksForm({ ...marksForm, class_final: parseFloat(e.target.value) || 0 })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="flex space-x-4 pt-4">
                            <button
                              onClick={() => {
                                setEditingMarks(null);
                                setMarksForm({
                                  class_quiz: 0, class_assignment: 0, class_mid: 0, class_final: 0,
                                  lab_quiz: 0, lab_assignment: 0, lab_mid: 0, lab_final: 0
                                });
                              }}
                              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateMarks(editingMarks)}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:opacity-90 transition"
                            >
                              Save Marks
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Select a student from the Students tab to update their marks
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div >
    );
  }

  // If we're viewing the course list
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Available Courses</h1>
          <p className="text-gray-600 mt-2">Browse and enroll in courses</p>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEnroll={handleEnroll}
                showEnroll={true}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Available Courses</h3>
            <p className="text-gray-600">You're enrolled in all available courses!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePage;