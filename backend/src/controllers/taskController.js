const Task = require("../models/Task");
const User = require("../models/User");

const taskController = {
    getTasks: async (req, res) => {
        try {
            const isAdmin = req.user.role && req.user.role.toLowerCase() === "admin";

            let tasks;
            if (isAdmin) {
                tasks = await Task.find()
                    .populate("assignedTo", "name email role")
                    .populate("createdBy", "name email role");
            } else {
                tasks = await Task.find({ assignedTo: req.user._id })
                    .populate("assignedTo", "name email role")
                    .populate("createdBy", "name email role");
            }

            res.status(200).json({
                count: tasks.length,
                tasks
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Server error while fetching tasks", error: err.message });
        }
    },

    getTaskById: async (req, res) => {
        try {
            const task = await Task.findById(req.params.id)
                .populate("assignedTo", "name email role")
                .populate("createdBy", "name email role");

            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            const isAdmin = req.user.role && req.user.role.toLowerCase() === "admin";

            if (!isAdmin && task.assignedTo._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    message: "Access denied. You can only view tasks assigned to you."
                });
            }

            res.status(200).json({ task });
        } catch (err) {
            if (err.kind === "ObjectId") {
                return res.status(400).json({ message: "Invalid task ID format" });
            }
            console.log(err);
            res.status(500).json({ message: "Server error while fetching task", error: err.message });
        }
    },

    createTask: async (req, res) => {
        try {
            const { title, description, status, priority, dueDate, assignedTo } = req.body;

            if (!title || !description || !assignedTo) {
                return res.status(400).json({
                    message: "Please provide title, description, and assignedTo user ID"
                });
            }

            const assignedUser = await User.findById(assignedTo);
            if (!assignedUser) {
                return res.status(404).json({ message: "Assigned user not found" });
            }

            const task = await Task.create({
                title,
                description,
                status: status || "Pending",
                priority: priority || "Medium",
                dueDate: dueDate || null,
                assignedTo,
                createdBy: req.user._id
            });

            const populatedTask = await Task.findById(task._id)
                .populate("assignedTo", "name email role")
                .populate("createdBy", "name email role");

            res.status(201).json({
                message: "Task created successfully",
                task: populatedTask
            });
        } catch (err) {
            if (err.kind === "ObjectId") {
                return res.status(400).json({ message: "Invalid user ID format for assignedTo" });
            }
            console.log(err);
            res.status(500).json({ message: "Server error while creating task", error: err.message });
        }
    },

    updateTask: async (req, res) => {
        try {
            const task = await Task.findById(req.params.id);

            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            const isAdmin = req.user.role && req.user.role.toLowerCase() === "admin";
            const allowedStatuses = ["Pending", "In Progress", "Completed"];

            if (isAdmin) {
                const { title, description, status, priority, dueDate, assignedTo } = req.body;

                if (title !== undefined) task.title = title;
                if (description !== undefined) task.description = description;
                if (status !== undefined) {
                    if (!allowedStatuses.includes(status)) {
                        return res.status(400).json({
                            message: "Invalid status. Allowed values are: Pending, In Progress, Completed"
                        });
                    }
                    task.status = status;
                }
                if (priority !== undefined) task.priority = priority;
                if (dueDate !== undefined) task.dueDate = dueDate;

                if (assignedTo !== undefined) {
                    const userExists = await User.findById(assignedTo);
                    if (!userExists) {
                        return res.status(404).json({ message: "Assigned user not found" });
                    }
                    task.assignedTo = assignedTo;
                }
            } else {
                const assignedId = task.assignedTo ? task.assignedTo.toString() : "";
                if (assignedId !== req.user._id.toString()) {
                    return res.status(403).json({
                        message: "Access denied. You can only update tasks assigned to you."
                    });
                }

                const { status } = req.body;
                if (!status) {
                    return res.status(400).json({
                        message: "Regular users can only update the task status"
                    });
                }

                if (!allowedStatuses.includes(status)) {
                    return res.status(400).json({
                        message: "Invalid status. Allowed values are: Pending, In Progress, Completed"
                    });
                }

                task.status = status;
            }

            await task.save();

            const updatedTask = await Task.findById(task._id)
                .populate("assignedTo", "name email role")
                .populate("createdBy", "name email role");

            res.status(200).json({
                message: "Task updated successfully",
                task: updatedTask
            });
        } catch (err) {
            if (err.kind === "ObjectId" || err.name === "CastError") {
                return res.status(400).json({ message: "Invalid ID format" });
            }
            console.log(err);
            res.status(500).json({ message: "Server error while updating task", error: err.message });
        }
    },

    updateTaskStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const allowedStatuses = ["Pending", "In Progress", "Completed"];

            if (!status || !allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid status. Allowed values are: Pending, In Progress, Completed"
                });
            }

            const task = await Task.findById(req.params.id);

            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            const isAdmin = req.user.role && req.user.role.toLowerCase() === "admin";
            const assignedId = task.assignedTo ? task.assignedTo.toString() : "";

            if (!isAdmin && assignedId !== req.user._id.toString()) {
                return res.status(403).json({
                    message: "Access denied. You can only update tasks assigned to you."
                });
            }

            task.status = status;
            await task.save();

            const updatedTask = await Task.findById(task._id)
                .populate("assignedTo", "name email role")
                .populate("createdBy", "name email role");

            res.status(200).json({
                message: "Task status updated successfully",
                task: updatedTask
            });
        } catch (err) {
            if (err.kind === "ObjectId" || err.name === "CastError") {
                return res.status(400).json({ message: "Invalid task ID format" });
            }
            console.log(err);
            res.status(500).json({ message: "Server error while updating task status", error: err.message });
        }
    },

    deleteTask: async (req, res) => {
        try {
            const task = await Task.findById(req.params.id);

            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            await task.deleteOne();

            res.status(200).json({
                message: "Task deleted successfully",
                deletedTaskId: req.params.id
            });
        } catch (err) {
            if (err.kind === "ObjectId") {
                return res.status(400).json({ message: "Invalid task ID format" });
            }
            console.log(err);
            res.status(500).json({ message: "Server error while deleting task", error: err.message });
        }
    }
};

module.exports = taskController;
