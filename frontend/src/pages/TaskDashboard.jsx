import React, { useState, useEffect } from 'react';
import { getTasks, updateTaskStatus } from '../services/api';

function TaskDashboard({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getTasks();
      const taskList = Array.isArray(data) ? data : (data.tasks || []);

      if (user && user.role !== 'Admin') {
        const myTasks = taskList.filter((task) => {
          const assignee = task.assignedUser || task.assignedTo || '';
          return (
            assignee.toLowerCase() === (user.email || '').toLowerCase() ||
            assignee.toLowerCase() === (user.name || '').toLowerCase() ||
            assignee === user._id ||
            assignee === user.id
          );
        });
        setTasks(myTasks);
      } else {
        setTasks(taskList);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load tasks from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      setSuccessMessage('Task status updated successfully!');

      setTasks((prevTasks) =>
        prevTasks.map((t) => (t._id === taskId || t.id === taskId ? { ...t, status: newStatus } : t))
      );

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.message || 'Could not update task status.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Completed') return 'badge badge-completed';
    if (status === 'In Progress') return 'badge badge-in-progress';
    return 'badge badge-pending';
  };

  const getPriorityBadgeClass = (priority) => {
    if (priority === 'High') return 'badge badge-priority-high';
    if (priority === 'Medium') return 'badge badge-priority-medium';
    return 'badge badge-priority-low';
  };

  return (
    <div className="container">
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="card-title">My Task Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            View your assigned tasks and update your current progress.
          </p>
        </div>
        <button onClick={fetchTasks} className="btn btn-secondary btn-sm">
          Refresh Tasks
        </button>
      </div>

      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {loading ? (
        <div className="empty-state">Loading your tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks assigned</h3>
          <p style={{ marginTop: '6px' }}>You currently have no tasks assigned to you.</p>
        </div>
      ) : (
        <div className="task-grid">
          {tasks.map((task) => {
            const taskId = task._id || task.id;
            return (
              <div key={taskId} className="task-item">
                <div>
                  <div className="badges-row">
                    <span className={getStatusBadgeClass(task.status)}>
                      {task.status || 'Pending'}
                    </span>
                    <span className={getPriorityBadgeClass(task.priority)}>
                      {task.priority || 'Low'} Priority
                    </span>
                  </div>

                  <h3 className="task-item-title">{task.title}</h3>
                  <p className="task-item-desc">{task.description}</p>
                </div>

                <div>
                  <div className="task-meta">
                    <div>
                      <strong>Due Date:</strong> {task.dueDate || 'No due date'}
                    </div>
                    <div>
                      <strong>Assigned To:</strong> {task.assignedUser || task.assignedTo || 'Unassigned'}
                    </div>
                  </div>

                  <div className="task-actions">
                    <label style={{ fontSize: '13px', fontWeight: '500' }}>
                      Update Status:
                    </label>
                    <select
                      className="form-control"
                      style={{ padding: '4px 8px', fontSize: '13px', width: 'auto' }}
                      value={task.status || 'Pending'}
                      onChange={(e) => handleStatusChange(taskId, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TaskDashboard;
