const CourseCard = ({ course, onEnroll, onView, showEnroll = false, showView = false }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{course.title}</h3>
          <p className="text-sm text-gray-500">{course.code}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
          {course.credit_hours} Credits
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Instructor:</span> {course.teacher_name || 'TBA'}
        </p>
        {course.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
        )}
      </div>
      
      <div className="flex space-x-2">
        {showEnroll && (
          <button
            onClick={() => onEnroll(course.id)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded hover:opacity-90 transition"
          >
            Enroll
          </button>
        )}
        {showView && (
          <button
            onClick={() => onView(course.id)}
            className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 rounded hover:opacity-90 transition"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCard;