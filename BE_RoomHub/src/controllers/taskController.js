import mongoose from "mongoose";
import Task from "../models/task.js";
import { Staff } from "../models/account.js";

const ALLOWED_PRIORITIES = ["Low", "Medium", "High"];
const ALLOWED_STATUSES = ["In Progress", "Completed", "Cancelled"];
const ALLOWED_SORT_FIELDS = ["createdAt", "dueDate", "priority", "status", "title"];

class TaskController {
  getUserId(req) {
    return req.user?.userId || req.user?._id;
  }

  getRole(req) {
    return req.user?.role;
  }

  parsePagination(req) {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      100
    );

    return { page, limit };
  }

  parseDate(value) {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  buildSort(req) {
    const sortField = ALLOWED_SORT_FIELDS.includes(req.query.sortField)
      ? req.query.sortField
      : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    return { [sortField]: sortOrder };
  }

  async getOwnerStaffIds(ownerId) {
    return Staff.find({
      createdBy: ownerId,
      deleted: { $ne: true },
    }).distinct("_id");
  }

  async buildAccessFilter(req) {
    const userId = this.getUserId(req);
    const role = this.getRole(req);

    if (role === "owner") {
      const staffIds = await this.getOwnerStaffIds(userId);

      return {
        $or: [
          { createdBy: userId },
          { responsibleBy: userId },
          { responsibleBy: { $in: staffIds } },
        ],
      };
    }

    return {
      $or: [
        { createdBy: userId },
        { responsibleBy: userId },
      ],
    };
  }

  async buildTaskFilter(req) {
    const accessFilter = await this.buildAccessFilter(req);
    const filterParts = [
      { deleted: { $ne: true } },
      accessFilter,
    ];
    const {
      search,
      status,
      priority,
      responsibleBy,
      dueDateFrom,
      dueDateTo,
      fromDate,
      toDate,
    } = req.query;

    if (search) {
      const regex = new RegExp(search, "i");
      filterParts.push({
        $or: [
          { title: regex },
          { details: regex },
        ],
      });
    }

    if (status && status !== "all") {
      if (!ALLOWED_STATUSES.includes(status)) {
        return { error: "Invalid status" };
      }

      filterParts.push({ status });
    }

    if (priority && priority !== "all") {
      if (!ALLOWED_PRIORITIES.includes(priority)) {
        return { error: "Invalid priority" };
      }

      filterParts.push({ priority });
    }

    if (responsibleBy && responsibleBy !== "all") {
      if (!mongoose.Types.ObjectId.isValid(responsibleBy)) {
        return { error: "Invalid responsible user id" };
      }

      filterParts.push({ responsibleBy });
    }

    const startDate = this.parseDate(dueDateFrom || fromDate);
    const endDate = this.parseDate(dueDateTo || toDate);

    if (startDate || endDate) {
      const dueDateFilter = {};
      if (startDate) dueDateFilter.$gte = startDate;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
        dueDateFilter.$lte = endDate;
      }
      filterParts.push({ dueDate: dueDateFilter });
    }

    return { filter: { $and: filterParts } };
  }

  async findScopedTask(taskId, req) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return { error: "Invalid task id" };
    }

    const accessFilter = await this.buildAccessFilter(req);
    const task = await Task.findOne({
      $and: [
        { _id: taskId },
        { deleted: { $ne: true } },
        accessFilter,
      ],
    });

    return { task };
  }

  async resolveResponsibleBy(req, responsibleBy, fallbackResponsibleBy) {
    const userId = this.getUserId(req);
    const role = this.getRole(req);
    const nextResponsibleBy = responsibleBy || fallbackResponsibleBy || userId;

    if (!mongoose.Types.ObjectId.isValid(nextResponsibleBy)) {
      return { error: "Invalid responsible user id" };
    }

    if (role === "staff") {
      if (nextResponsibleBy.toString() !== userId.toString()) {
        return { error: "Staff can only assign tasks to themselves" };
      }

      return { responsibleBy: userId };
    }

    if (nextResponsibleBy.toString() === userId.toString()) {
      return { responsibleBy: userId };
    }

    const staff = await Staff.findOne({
      _id: nextResponsibleBy,
      createdBy: userId,
      deleted: { $ne: true },
    }).select("_id");

    if (!staff) {
      return { error: "Responsible staff does not belong to this owner" };
    }

    return { responsibleBy: staff._id };
  }

  validateTaskPayload(body, isCreate = false) {
    const errors = [];
    const payload = {};

    if (isCreate && !body.title) errors.push("Title is required");
    if (isCreate && !body.dueDate) errors.push("Due date is required");

    if (body.title !== undefined) payload.title = String(body.title).trim();
    if (body.details !== undefined) payload.details = body.details;

    if (body.priority !== undefined) {
      if (!ALLOWED_PRIORITIES.includes(body.priority)) {
        errors.push("Invalid priority");
      } else {
        payload.priority = body.priority;
      }
    }

    if (body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(body.status)) {
        errors.push("Invalid status");
      } else {
        payload.status = body.status;
      }
    }

    if (body.dueDate !== undefined) {
      const dueDate = this.parseDate(body.dueDate);
      if (!dueDate) {
        errors.push("Invalid due date");
      } else {
        payload.dueDate = dueDate;
      }
    }

    if (payload.title !== undefined && !payload.title) {
      errors.push("Title is required");
    }

    return { payload, errors };
  }

  canStaffUpdateField(task, req, field) {
    const userId = this.getUserId(req)?.toString();
    const createdBy = task.createdBy?.toString();

    if (createdBy === userId) return true;

    return ["status", "details"].includes(field);
  }

  async populateTask(task) {
    return task.populate([
      { path: "createdBy", select: "username fullname email role" },
      { path: "responsibleBy", select: "username fullname email phoneNumber role" },
    ]);
  }

  async getManagedTasks(req, res) {
    try {
      const { page, limit } = this.parsePagination(req);
      const filterResult = await this.buildTaskFilter(req);

      if (filterResult.error) {
        return res.status(400).json({
          success: false,
          message: filterResult.error,
        });
      }

      const filter = filterResult.filter;
      const sort = this.buildSort(req);
      const [totalItems, tasks] = await Promise.all([
        Task.countDocuments(filter),
        Task.find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("createdBy", "username fullname email role")
          .populate("responsibleBy", "username fullname email phoneNumber role")
          .lean(),
      ]);

      return res.status(200).json({
        success: true,
        data: tasks,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          limit,
          hasNextPage: page * limit < totalItems,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch tasks",
        error: error.message,
      });
    }
  }

  async getManagedTaskDetail(req, res) {
    try {
      const { taskId } = req.params;
      const { task, error } = await this.findScopedTask(taskId, req);

      if (error) return res.status(400).json({ success: false, message: error });
      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      await this.populateTask(task);

      return res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch task detail",
        error: error.message,
      });
    }
  }

  async createManagedTask(req, res) {
    try {
      const { payload, errors } = this.validateTaskPayload(req.body, true);
      const resolved = await this.resolveResponsibleBy(req, req.body.responsibleBy);

      if (resolved.error) errors.push(resolved.error);

      if (errors.length) {
        return res.status(400).json({
          success: false,
          message: errors[0],
          errors,
        });
      }

      const task = await Task.create({
        ...payload,
        createdBy: this.getUserId(req),
        responsibleBy: resolved.responsibleBy,
      });

      await this.populateTask(task);

      return res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: task,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create task",
        error: error.message,
      });
    }
  }

  async updateManagedTask(req, res) {
    try {
      const { taskId } = req.params;
      const { task, error } = await this.findScopedTask(taskId, req);

      if (error) return res.status(400).json({ success: false, message: error });
      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      const { payload, errors } = this.validateTaskPayload(req.body);
      const role = this.getRole(req);

      if (req.body.responsibleBy !== undefined) {
        const resolved = await this.resolveResponsibleBy(
          req,
          req.body.responsibleBy,
          task.responsibleBy
        );

        if (resolved.error) {
          errors.push(resolved.error);
        } else {
          payload.responsibleBy = resolved.responsibleBy;
        }
      }

      if (role === "staff") {
        Object.keys(payload).forEach((field) => {
          if (!this.canStaffUpdateField(task, req, field)) {
            errors.push(`Staff cannot update ${field}`);
          }
        });
      }

      if (errors.length) {
        return res.status(400).json({
          success: false,
          message: errors[0],
          errors,
        });
      }

      Object.assign(task, payload);
      await task.save();
      await this.populateTask(task);

      return res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data: task,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update task",
        error: error.message,
      });
    }
  }

  async deleteManagedTask(req, res) {
    try {
      const { taskId } = req.params;
      const { task, error } = await this.findScopedTask(taskId, req);

      if (error) return res.status(400).json({ success: false, message: error });
      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      const role = this.getRole(req);
      const userId = this.getUserId(req)?.toString();

      if (role === "staff" && task.createdBy?.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Staff can only delete tasks they created",
        });
      }

      task.deleted = true;
      task.deletedAt = new Date();
      await task.save();

      return res.status(200).json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete task",
        error: error.message,
      });
    }
  }
}

export default new TaskController();
