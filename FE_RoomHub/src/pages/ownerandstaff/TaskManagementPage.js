import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import AdminLayout from "../layout/admin/AdminLayout";
import { getOwnerStaffs } from "../../api/ownerandstaff/staffManagement";
import {
  createManagedTask,
  deleteManagedTask,
  getManagedTasks,
  updateManagedTask,
} from "../../api/ownerandstaff/taskManagement";

const pageSizeOptions = [5, 10, 20];

const emptyPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 10,
};

const initialFilters = {
  search: "",
  status: "",
  priority: "",
  responsibleBy: "",
  dueDateFrom: "",
  dueDateTo: "",
};

const statusColors = {
  "In Progress": "processing",
  Completed: "success",
  Cancelled: "default",
};

const priorityColors = {
  Low: "green",
  Medium: "gold",
  High: "red",
};

export default function TaskManagementPage() {
  const [form] = Form.useForm();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner = user?.role === "owner";
  const currentUserId = user?._id || user?.userId || "";

  const [tasks, setTasks] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(
    async ({ page = 1, limit = pagination.limit, nextFilters = appliedFilters } = {}) => {
      try {
        setLoading(true);
        const res = await getManagedTasks({
          page,
          limit,
          ...nextFilters,
        });

        setTasks(res?.data || []);
        setPagination({
          ...emptyPagination,
          ...(res?.pagination || {}),
        });
      } catch (error) {
        setTasks([]);
        message.error(error.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters, pagination.limit]
  );

  const fetchStaffs = useCallback(async () => {
    if (!isOwner) return;

    try {
      setStaffLoading(true);
      const res = await getOwnerStaffs({ page: 1, limit: 100 });
      setStaffs(res?.data || []);
    } catch (error) {
      setStaffs([]);
      message.error(error.message || "Failed to load staffs");
    } finally {
      setStaffLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    fetchTasks({ page: 1 });
    fetchStaffs();
  }, [fetchTasks, fetchStaffs]);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "Completed").length;
    const overdue = tasks.filter(
      (task) => task.status !== "Completed" && isOverdue(task.dueDate)
    ).length;

    return {
      total: pagination.totalItems || 0,
      completed,
      overdue,
    };
  }, [tasks, pagination.totalItems]);

  const responsibleOptions = useMemo(
    () => [
      { value: "", label: "All responsible" },
      ...(currentUserId ? [{ value: currentUserId, label: "Me" }] : []),
      ...staffs.map((staff) => ({
        value: staff._id,
        label: staff.fullname || staff.username || staff.email,
      })),
    ],
    [currentUserId, staffs]
  );

  const taskResponsibleOptions = useMemo(
    () => [
      ...(currentUserId ? [{ value: currentUserId, label: "Me" }] : []),
      ...(isOwner
        ? staffs.map((staff) => ({
            value: staff._id,
            label: staff.fullname || staff.username || staff.email,
          }))
        : []),
    ],
    [currentUserId, isOwner, staffs]
  );

  const applyFilters = () => {
    setAppliedFilters(filters);
    fetchTasks({ page: 1, nextFilters: filters });
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    fetchTasks({ page: 1, nextFilters: initialFilters });
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({
      priority: "Medium",
      status: "In Progress",
      responsibleBy: currentUserId || undefined,
      dueDate: formatDateInput(new Date()),
    });
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      details: task.details,
      priority: task.priority || "Medium",
      status: task.status || "In Progress",
      responsibleBy: task.responsibleBy?._id || task.responsibleBy || currentUserId,
      dueDate: formatDateInput(task.dueDate),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTask(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
      };

      if (!isOwner) {
        delete payload.responsibleBy;
      }

      setSubmitting(true);

      if (editingTask) {
        const res = await updateManagedTask(editingTask._id, payload);
        showTaskSaveMessage(res, "Task updated successfully");
      } else {
        const res = await createManagedTask(payload);
        showTaskSaveMessage(res, "Task created successfully");
      }

      closeModal();
      fetchTasks({ page: editingTask ? pagination.currentPage : 1 });
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Save task failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteManagedTask(taskId);
      message.success("Task deleted successfully");
      fetchTasks({ page: pagination.currentPage });
    } catch (error) {
      message.error(error.message || "Delete task failed");
    }
  };

  const canDeleteTask = (task) =>
    isOwner ||
    task.createdBy?._id === currentUserId ||
    task.createdBy === currentUserId;

  const columns = [
    {
      title: "Task",
      dataIndex: "title",
      key: "title",
      render: (_, task) => (
        <div style={taskCellStyle}>
          <div style={taskTitleStyle}>{task.title || "N/A"}</div>
          <div style={mutedTextStyle}>{task.details || "No details"}</div>
        </div>
      ),
    },
    {
      title: "Responsible",
      dataIndex: "responsibleBy",
      key: "responsibleBy",
      render: (responsible) => (
        <div style={personCellStyle}>
          <UserRound size={16} />
          <div>
            <div>{responsible?.fullname || responsible?.username || "N/A"}</div>
            <div style={mutedTextStyle}>{responsible?.email || responsible?.role || ""}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => (
        <Tag color={priorityColors[priority] || "default"}>{priority || "N/A"}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status] || "default"}>{status || "N/A"}</Tag>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (dueDate, task) => (
        <div>
          <div>{formatDate(dueDate)}</div>
          {task.status !== "Completed" && isOverdue(dueDate) && (
            <div style={overdueTextStyle}>Overdue</div>
          )}
        </div>
      ),
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (creator) => creator?.fullname || creator?.username || "N/A",
    },
    {
      title: "Action",
      key: "action",
      width: 128,
      render: (_, task) => (
        <Space>
          <Button
            title="Update"
            aria-label="Update task"
            icon={<Pencil size={16} />}
            onClick={() => openEditModal(task)}
          />
          <Popconfirm
            title="Delete this task?"
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            disabled={!canDeleteTask(task)}
            onConfirm={() => handleDelete(task._id)}
          >
            <Button
              danger
              disabled={!canDeleteTask(task)}
              title="Delete"
              aria-label="Delete task"
              icon={<Trash2 size={16} />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Task Management</h2>
          <div style={summaryStyle}>
            <span style={summaryItemStyle}>
              <ClipboardList size={16} />
              {stats.total} tasks
            </span>
            <span style={summaryItemStyle}>
              <CheckCircle2 size={16} />
              {stats.completed} completed
            </span>
            <span style={summaryItemStyle}>
              <CircleAlert size={16} />
              {stats.overdue} overdue
            </span>
          </div>
        </div>

        <Button type="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
          Add Task
        </Button>
      </div>

      <div style={filterPanelStyle}>
        <Input
          allowClear
          prefix={<Search size={16} />}
          placeholder="Search task"
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
          onPressEnter={applyFilters}
          style={searchInputStyle}
        />

        <Select
          value={filters.status}
          onChange={(value) => updateFilter("status", value)}
          options={[
            { value: "", label: "All status" },
            { value: "In Progress", label: "In Progress" },
            { value: "Completed", label: "Completed" },
            { value: "Cancelled", label: "Cancelled" },
          ]}
          style={filterSelectStyle}
        />

        <Select
          value={filters.priority}
          onChange={(value) => updateFilter("priority", value)}
          options={[
            { value: "", label: "All priority" },
            { value: "Low", label: "Low" },
            { value: "Medium", label: "Medium" },
            { value: "High", label: "High" },
          ]}
          style={filterSelectStyle}
        />

        {isOwner && (
          <Select
            showSearch
            value={filters.responsibleBy}
            onChange={(value) => updateFilter("responsibleBy", value)}
            options={responsibleOptions}
            loading={staffLoading}
            optionFilterProp="label"
            style={filterSelectStyle}
          />
        )}

        <Input
          type="date"
          value={filters.dueDateFrom}
          onChange={(event) => updateFilter("dueDateFrom", event.target.value)}
          prefix={<CalendarClock size={16} />}
          style={dateInputStyle}
        />

        <Input
          type="date"
          value={filters.dueDateTo}
          onChange={(event) => updateFilter("dueDateTo", event.target.value)}
          prefix={<CalendarClock size={16} />}
          style={dateInputStyle}
        />

        <Space>
          <Button type="primary" icon={<Search size={16} />} onClick={applyFilters}>
            Filter
          </Button>
          <Button icon={<RotateCcw size={16} />} onClick={resetFilters}>
            Reset
          </Button>
        </Space>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={tasks}
        loading={loading}
        scroll={{ x: 980 }}
        style={tableStyle}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.limit,
          total: pagination.totalItems,
          pageSizeOptions,
          showSizeChanger: true,
          showTotal: (total) => `${total} tasks`,
          onChange: (page, pageSize) =>
            fetchTasks({ page, limit: pageSize, nextFilters: appliedFilters }),
        }}
      />

      <Modal
        title={editingTask ? "Update Task" : "Add Task"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        okText={editingTask ? "Save" : "Create"}
        confirmLoading={submitting}
        destroyOnHidden
        width={720}
      >
        <Form form={form} layout="vertical" style={formStyle}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="Task title" />
          </Form.Item>

          <Form.Item name="details" label="Details">
            <Input.TextArea rows={4} placeholder="Task details" />
          </Form.Item>

          <div style={formGridStyle}>
            <Form.Item name="priority" label="Priority">
              <Select
                options={[
                  { value: "Low", label: "Low" },
                  { value: "Medium", label: "Medium" },
                  { value: "High", label: "High" },
                ]}
              />
            </Form.Item>

            <Form.Item name="status" label="Status">
              <Select
                options={[
                  { value: "In Progress", label: "In Progress" },
                  { value: "Completed", label: "Completed" },
                  { value: "Cancelled", label: "Cancelled" },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="dueDate"
              label="Due date"
              rules={[{ required: true, message: "Due date is required" }]}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item
              name="responsibleBy"
              label="Responsible"
              rules={[
                {
                  required: isOwner,
                  message: "Responsible user is required",
                },
              ]}
            >
              <Select
                showSearch
                disabled={!isOwner}
                loading={staffLoading}
                options={taskResponsibleOptions}
                optionFilterProp="label"
                placeholder="Select responsible"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </AdminLayout>
  );
}

const isOverdue = (value) => {
  if (!value) return false;

  const dueDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
};

const showTaskSaveMessage = (response, successMessage) => {
  if (response?.taskAssignmentEmailError) {
    message.warning(`${successMessage}, but assignment email was not sent`);
    return;
  }

  message.success(successMessage);
};

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatDateInput = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 18,
  flexWrap: "wrap",
};

const titleStyle = {
  margin: "0 0 10px",
  color: "#27364a",
  fontWeight: 700,
};

const summaryStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const summaryItemStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fff",
  color: "#344054",
  padding: "8px 12px",
  fontWeight: 600,
};

const filterPanelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  padding: 14,
  marginBottom: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fff",
};

const searchInputStyle = {
  width: 260,
};

const filterSelectStyle = {
  width: 180,
};

const dateInputStyle = {
  width: 170,
};

const tableStyle = {
  background: "#fff",
  borderRadius: 8,
  overflow: "hidden",
};

const taskCellStyle = {
  minWidth: 240,
};

const taskTitleStyle = {
  color: "#27364a",
  fontWeight: 700,
};

const personCellStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 180,
};

const mutedTextStyle = {
  color: "#667085",
  fontSize: 12,
};

const overdueTextStyle = {
  color: "#d92d20",
  fontSize: 12,
  fontWeight: 700,
};

const formStyle = {
  marginTop: 18,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "0 14px",
};
