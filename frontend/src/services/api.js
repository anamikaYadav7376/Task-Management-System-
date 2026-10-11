const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to include authorization token in requests
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Login user
export const loginUser = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
};

// Register user
export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
};

// Fetch tasks from backend
export const getTasks = async () => {
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tasks');
  }
  return data;
};

// Create a new task (Admin)
export const createTask = async (taskData) => {
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(taskData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create task');
  }
  return data;
};

// Update task details (Admin)
export const updateTask = async (id, taskData) => {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(taskData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update task');
  }
  return data;
};

// Delete a task (Admin)
export const deleteTask = async (id) => {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete task');
  }
  return data;
};

// Update task status (User)
export const updateTaskStatus = async (id, status) => {
  const response = await fetch(`${API_URL}/tasks/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update task status');
  }
  return data;
};
