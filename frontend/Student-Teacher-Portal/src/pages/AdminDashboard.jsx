import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  
  // State for course creation/editing form
  const [courseForm, setCourseForm] = useState({
    title: '',
    code: '',
    credit_hours: ''
  });
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null); // Track if we're editing a course
  const [courseError, setCourseError] = useState('');

  // State for section creation/editing form
  const [sectionForm, setSectionForm] = useState({
    course_id: '',
    teacher_id: '',
    program: ''
  });
  const [addingSection, setAddingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null); // Track if we're editing a section
  const [sectionError, setSectionError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [teachersRes, usersRes, coursesRes] = await Promise.all([
        apiGet('/admin/pending-teachers', { 'Authorization': `Bearer ${token}` }),
        apiGet('/admin/all-users', { 'Authorization': `Bearer ${token}` }),
        apiGet('/admin/all-courses', { 'Authorization': `Bearer ${token}` })
      ]);

      setPendingTeachers(teachersRes);
      setAllUsers(usersRes);
      setAllCourses(coursesRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApproveTeacher = async (teacherId) => {
    try {
      await apiPut(`/admin/approve-teacher/${teacherId}`, {}, { 'Authorization': `Bearer ${token}` });
      
      alert('Teacher approved successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to approve teacher: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiDelete(`/admin/delete-user/${userId}`, { 'Authorization': `Bearer ${token}` });
      
      alert('User deleted successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to delete user: ' + error.message);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCreatingCourse(true);
    setCourseError('');
    
    try {
      await apiPost('/admin/create-course', {
        title: courseForm.title,
        code: courseForm.code,
        credit_hours: parseInt(courseForm.credit_hours)
      }, { 'Authorization': `Bearer ${token}` });
      
      alert('Course created successfully!');
      // Reset form
      setCourseForm({
        title: '',
        code: '',
        credit_hours: ''
      });
      // Refresh courses list
      fetchData();
      // Switch to courses tab
      setActiveTab('courses');
    } catch (error) {
      setCourseError(error.message || 'Failed to create course');
    } finally {
      setCreatingCourse(false);
    }
  };

  // Function to populate form with course data for editing
  const handleEditCourse = (course) => {
    setCourseForm({
      title: course.title,
      code: course.code,
      credit_hours: course.credit_hours.toString(),
      semester: course.semester,
      description: course.description || ''
    });
    setEditingCourseId(course.id);
    setActiveTab('create-course'); // Reuse the create course tab for editing
  };

  // Function to update an existing course
  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setCreatingCourse(true);
    setCourseError('');
    
    try {
      await apiPut(`/admin/update-course/${editingCourseId}`, {
        title: courseForm.title,
        code: courseForm.code,
        credit_hours: parseInt(courseForm.credit_hours)
      }, { 'Authorization': `Bearer ${token}` });
      
      alert('Course updated successfully!');
      // Reset form and editing state
      setCourseForm({
        title: '',
        code: '',
        credit_hours: ''
      });
      setEditingCourseId(null);
      // Refresh courses list
      fetchData();
      // Switch to courses tab
      setActiveTab('courses');
    } catch (error) {
      setCourseError(error.message || 'Failed to update course');
    } finally {
      setCreatingCourse(false);
    }
  };

  // Function to delete a course
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiDelete(`/admin/delete-course/${courseId}`, { 'Authorization': `Bearer ${token}` });
      
      alert('Course deleted successfully!');
      // Refresh courses list
      fetchData();
    } catch (error) {
      alert(error.message || 'Failed to delete course');
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    setAddingSection(true);
    setSectionError('');
    
    try {
      await apiPost('/admin/add-course-section', {
        course_id: parseInt(sectionForm.course_id),
        teacher_id: sectionForm.teacher_id,
        program: sectionForm.program
      }, { 'Authorization': `Bearer ${token}` });
      
      alert('Section added successfully!');
      // Reset form
      setSectionForm({
        course_id: '',
        teacher_id: '',
        program: ''
      });
      // Refresh courses list
      fetchData();
    } catch (error) {
      setSectionError(error.message || 'Failed to add section');
    } finally {
      setAddingSection(false);
    }
  };

  // Function to populate form with section data for editing
  const handleEditSection = (section) => {
    setSectionForm({
      course_id: section.course_id,
      teacher_id: section.teacher_id,
      program: section.program
    });
    setEditingSectionId(section.id);
    setActiveTab('add-section'); // Switch to the add section tab for editing
  };

  // Function to update an existing section
  const handleUpdateSection = async (e) => {
    e.preventDefault();
    setAddingSection(true);
    setSectionError('');
    
    try {
      await apiPut(`/admin/update-section/${editingSectionId}`, {
        course_id: parseInt(sectionForm.course_id),
        teacher_id: sectionForm.teacher_id,
        program: sectionForm.program
      }, { 'Authorization': `Bearer ${token}` });
      
      alert('Section updated successfully!');
      // Reset form and editing state
      setSectionForm({
        course_id: '',
        teacher_id: '',
        program: ''
      });
      setEditingSectionId(null);
      // Refresh courses list
      fetchData();
      // Switch to courses tab to see the updated section
      setActiveTab('courses');
    } catch (error) {
      setSectionError(error.message || 'Failed to update section');
    } finally {
      setAddingSection(false);
    }
  };

  // Function to delete a section
  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiDelete(`/admin/delete-section/${sectionId}`, { 'Authorization': `Bearer ${token}` });
      
      alert('Section deleted successfully!');
      // Refresh courses list
      fetchData();
    } catch (error) {
      alert(error.message || 'Failed to delete section');
    }
  };

  const handleCourseFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Update the form state
    setCourseForm({
      ...courseForm,
      [name]: newValue
    });
    
    // Validate credit hours
    if (name === 'credit_hours') {
      const creditHours = parseInt(value);
      if (isNaN(creditHours) || creditHours < 1 || creditHours > 4) {
        alert('Credit hours must be between 1 and 4');
      }
    }
  };

  const handleSectionFormChange = (e) => {
    setSectionForm({
      ...sectionForm,
      [e.target.name]: e.target.value
    });
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

  // Get approved teachers for dropdowns
  const approvedTeachers = allUsers.filter(user => user.role === 'TEACHER' && user.is_approved);
  // Get courses for section creation dropdown
  const availableCourses = allCourses;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-500 text-sm">Pending Teachers</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{pendingTeachers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-500 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{allUsers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-500 text-sm">Total Courses</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{allCourses.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-500 text-sm">Active Students</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {allUsers.filter(u => u.role === 'student').length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending Teachers ({pendingTeachers.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'users'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'courses'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All Courses
              </button>
              <button
                onClick={() => setActiveTab('create-course')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'create-course'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Create Course
              </button>
              <button
                onClick={() => setActiveTab('add-section')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'add-section'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Add Section
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'pending' && (
              <div>
                {pendingTeachers.length > 0 ? (
                  <div className="space-y-4">
                    {pendingTeachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">{teacher.full_name}</p>
                          <p className="text-sm text-gray-500">{teacher.email}</p>
                        </div>
                        <button
                          onClick={() => handleApproveTeacher(teacher.id)}
                          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No pending teacher approvals</p>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'courses' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">All Courses</h2>
                {allCourses.length > 0 ? (
                  <div className="space-y-6">
                    {allCourses.map((course) => (
                      <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">{course.title}</h3>
                            <p className="text-sm text-gray-600">{course.code}</p>
                            <p className="text-xs text-gray-500">Credit Hours: {course.credit_hours}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditCourse(course)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        {/* Sections */}
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-700 mb-2">Sections:</h4>
                          {course.sections && course.sections.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {course.sections.map((section) => (
                                <div key={section.id} className="bg-gray-50 p-3 rounded">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-medium">{section.class_name}</p>
                                      <p className="text-xs text-gray-600">Program: {section.program}</p>
                                      <p className="text-xs text-gray-600">Teacher: {section.teacher_name}</p>
                                    </div>
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => handleEditSection(section)}
                                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSection(section.id)}
                                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm italic">No sections assigned yet</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No courses found</p>
                )}
              </div>
            )}

            {activeTab === 'create-course' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editingCourseId ? 'Edit Course' : 'Create New Course'}
                </h2>
                {courseError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {courseError}
                  </div>
                )}
                <form onSubmit={editingCourseId ? handleUpdateCourse : handleCreateCourse} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={courseForm.title}
                      onChange={handleCourseFormChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Introduction to Computer Science"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Code
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={courseForm.code}
                        onChange={handleCourseFormChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="CS101"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Credit Hours (2-4)
                      </label>
                      <input
                        type="number"
                        name="credit_hours"
                        value={courseForm.credit_hours}
                        onChange={handleCourseFormChange}
                        required
                        min="2"
                        max="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="2-4"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        2 credits: No lab | 3 credits: Optional lab | 4 credits: Mandatory lab
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {/* has_lab checkbox removed as it's not part of the Course model */}
                  </div>

                  <button
                    type="submit"
                    disabled={creatingCourse}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {creatingCourse ? 'Creating Course...' : 'Create Course'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'add-section' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editingSectionId ? 'Edit Course Section' : 'Add Course Section'}
                </h2>
                {sectionError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {sectionError}
                  </div>
                )}
                <form onSubmit={editingSectionId ? handleUpdateSection : handleAddSection} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Course
                    </label>
                    <select
                      name="course_id"
                      value={sectionForm.course_id}
                      onChange={handleSectionFormChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a course</option>
                      {availableCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title} ({course.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Teacher
                      </label>
                      <select
                        name="teacher_id"
                        value={sectionForm.teacher_id}
                        onChange={handleSectionFormChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a teacher</option>
                        {approvedTeachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Program
                      </label>
                      <select
                        name="program"
                        value={sectionForm.program}
                        onChange={handleSectionFormChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select program</option>
                        <option value="BCS">BCS</option>
                        <option value="BSE">BSE</option>
                        <option value="BAI">BAI</option>
                        <option value="BEE">BEE</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      {/* Class Name field removed as it's auto-generated */}</div>
                  </div>

                  <button
                    type="submit"
                    disabled={addingSection}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {addingSection ? 'Adding Section...' : 'Add Section'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;