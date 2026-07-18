import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
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
  Building2,
  Mail,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import AdminLayout from "../layout/admin/AdminLayout";
import { getOwnBoardingHouses } from "../../api/boardingHouse";
import {
  createOwnerStaff,
  deleteOwnerStaff,
  getOwnerStaffs,
  resendOwnerStaffInvitation,
  updateOwnerStaff,
} from "../../api/ownerandstaff/staffManagement";

const pageSizeOptions = [5, 10, 20];

const emptyPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 10,
};

export default function StaffManagementPage() {
  const [form] = Form.useForm();
  const [staffs, setStaffs] = useState([]);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [boardingHouseLoading, setBoardingHouseLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendingStaffId, setResendingStaffId] = useState(null);

  const fetchStaffs = useCallback(
    async ({ page = 1, limit = pagination.limit, searchValue = search } = {}) => {
      try {
        setLoading(true);
        const res = await getOwnerStaffs({
          page,
          limit,
          search: searchValue.trim(),
        });

        setStaffs(res?.data || []);
        setPagination({
          ...emptyPagination,
          ...(res?.pagination || {}),
        });
      } catch (error) {
        setStaffs([]);
        message.error(error.message || "Failed to load staffs");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, search]
  );

  const fetchBoardingHouses = useCallback(async () => {
    try {
      setBoardingHouseLoading(true);
      const res = await getOwnBoardingHouses({ page: 1, limit: 100 });
      setBoardingHouses(res?.data || []);
    } catch (error) {
      setBoardingHouses([]);
      message.error(error.message || "Failed to load boarding houses");
    } finally {
      setBoardingHouseLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffs({ page: 1 });
    fetchBoardingHouses();
  }, [fetchStaffs, fetchBoardingHouses]);

  const boardingHouseOptions = useMemo(
    () =>
      boardingHouses.map((house) => ({
        value: house._id,
        label: house.name || "Unnamed boarding house",
      })),
    [boardingHouses]
  );

  const assignedHouseTotal = useMemo(
    () =>
      staffs.reduce(
        (total, staff) => total + (staff.assignedBoardingHouseCount || 0),
        0
      ),
    [staffs]
  );

  const openCreateModal = () => {
    setEditingStaff(null);
    form.resetFields();
    form.setFieldsValue({
      gender: "male",
      boardingHouseIds: [],
      sendInvitationEmail: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    form.setFieldsValue({
      username: staff.username,
      email: staff.email,
      fullname: staff.fullname,
      phoneNumber: staff.phoneNumber,
      gender: staff.gender || "male",
      hireDate: formatDateInput(staff.hireDate),
      boardingHouseIds: (staff.assignedBoardingHouses || []).map((house) => house._id),
      password: "",
      sendInvitationEmail: false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStaff(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        boardingHouseIds: values.boardingHouseIds || [],
      };

      if (editingStaff && !payload.password) {
        delete payload.password;
      }

      if (editingStaff) {
        delete payload.sendInvitationEmail;
      }

      if (!editingStaff && payload.sendInvitationEmail) {
        delete payload.password;
      }

      setSubmitting(true);

      if (editingStaff) {
        await updateOwnerStaff(editingStaff._id, payload);
        message.success("Staff updated successfully");
      } else {
        const res = await createOwnerStaff(payload);
        if (payload.sendInvitationEmail && res?.invitationEmailSent === false) {
          message.warning(
            getInvitationWarningMessage(
              "Staff created, but invitation email was not sent",
              res?.invitationEmailError
            )
          );
        } else if (payload.sendInvitationEmail) {
          message.success("Staff created and invitation email sent");
        } else {
          message.success("Staff created successfully");
        }
      }

      closeModal();
      fetchStaffs({ page: editingStaff ? pagination.currentPage : 1 });
      fetchBoardingHouses();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Save staff failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (staffId) => {
    try {
      await deleteOwnerStaff(staffId);
      message.success("Staff deleted successfully");
      fetchStaffs({ page: pagination.currentPage });
      fetchBoardingHouses();
    } catch (error) {
      message.error(error.message || "Delete staff failed");
    }
  };

  const handleResendInvitation = async (staffId) => {
    try {
      setResendingStaffId(staffId);
      const res = await resendOwnerStaffInvitation(staffId);

      if (res?.data) {
        setStaffs((currentStaffs) =>
          currentStaffs.map((staff) => (staff._id === staffId ? res.data : staff))
        );
      }

      if (res?.invitationEmailSent) {
        message.success("Invitation email sent successfully");
      } else {
        message.warning(
          getInvitationWarningMessage(
            "Invitation email was not sent",
            res?.invitationEmailError
          )
        );
      }
    } catch (error) {
      message.error(error.message || "Send invitation failed");
    } finally {
      setResendingStaffId(null);
    }
  };

  const handleSearch = () => {
    fetchStaffs({ page: 1, searchValue: search });
  };

  const handleReset = () => {
    setSearch("");
    fetchStaffs({ page: 1, searchValue: "" });
  };

  const columns = [
    {
      title: "Staff",
      dataIndex: "fullname",
      key: "staff",
      render: (_, staff) => (
        <div style={staffCellStyle}>
          <div style={avatarStyle}>{getInitials(staff.fullname || staff.username)}</div>
          <div>
            <div style={nameStyle}>{staff.fullname || "N/A"}</div>
            <div style={mutedTextStyle}>@{staff.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, staff) => (
        <div>
          <div>{staff.email || "N/A"}</div>
          <div style={mutedTextStyle}>{staff.phoneNumber || "No phone"}</div>
          {getInvitationStatusTag(staff)}
        </div>
      ),
    },
    {
      title: "Assigned Houses",
      dataIndex: "assignedBoardingHouses",
      key: "assignedBoardingHouses",
      render: (houses = []) => (
        <Space size={[6, 6]} wrap>
          {houses.length ? (
            houses.map((house) => (
              <Tag key={house._id} color="blue">
                {house.name}
              </Tag>
            ))
          ) : (
            <Tag>Unassigned</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Hire Date",
      dataIndex: "hireDate",
      key: "hireDate",
      render: (value) => formatDate(value),
    },
    {
      title: "Action",
      key: "action",
      width: 168,
      render: (_, staff) => (
        <Space>
          <Button
            title="Resend invitation"
            aria-label="Resend invitation email"
            icon={<Mail size={16} />}
            loading={resendingStaffId === staff._id}
            onClick={() => handleResendInvitation(staff._id)}
          />
          <Button
            title="Update"
            aria-label="Update staff"
            icon={<Pencil size={16} />}
            onClick={() => openEditModal(staff)}
          />
          <Popconfirm
            title="Delete this staff?"
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(staff._id)}
          >
            <Button
              danger
              title="Delete"
              aria-label="Delete staff"
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
          <h2 style={titleStyle}>Staff Management</h2>
          <div style={summaryStyle}>
            <span style={summaryItemStyle}>
              <Users size={16} />
              {pagination.totalItems || 0} staffs
            </span>
            <span style={summaryItemStyle}>
              <Building2 size={16} />
              {assignedHouseTotal} assigned houses
            </span>
          </div>
        </div>

        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={openCreateModal}
        >
          Add Staff
        </Button>
      </div>

      <div style={toolbarStyle}>
        <Input
          allowClear
          prefix={<Search size={16} />}
          placeholder="Search staff"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onPressEnter={handleSearch}
          style={searchInputStyle}
        />
        <Space>
          <Button icon={<Search size={16} />} onClick={handleSearch}>
            Search
          </Button>
          <Button icon={<RotateCcw size={16} />} onClick={handleReset}>
            Reset
          </Button>
        </Space>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={staffs}
        loading={loading}
        scroll={{ x: 920 }}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.limit,
          total: pagination.totalItems,
          pageSizeOptions,
          showSizeChanger: true,
          showTotal: (total) => `${total} staffs`,
          onChange: (page, pageSize) => fetchStaffs({ page, limit: pageSize }),
        }}
        style={tableStyle}
      />

      <Modal
        title={
          <Space>
            <UserPlus size={18} />
            {editingStaff ? "Update Staff" : "Add Staff"}
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        okText={editingStaff ? "Save" : "Create"}
        confirmLoading={submitting}
        destroyOnHidden
        width={720}
      >
        <Form form={form} layout="vertical" style={formStyle}>
          <div style={formGridStyle}>
            <Form.Item
              name="fullname"
              label="Full name"
              rules={[{ required: true, message: "Full name is required" }]}
            >
              <Input placeholder="Full name" />
            </Form.Item>

            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Username is required" }]}
            >
              <Input placeholder="Username" disabled={Boolean(editingStaff)} />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Email is invalid" },
              ]}
            >
              <Input placeholder="Email" />
            </Form.Item>

            <Form.Item name="phoneNumber" label="Phone">
              <Input placeholder="Phone" />
            </Form.Item>

            <Form.Item name="gender" label="Gender">
              <Select
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
              />
            </Form.Item>

            <Form.Item name="hireDate" label="Hire date">
              <Input type="date" />
            </Form.Item>
          </div>

          {!editingStaff && (
            <Form.Item name="sendInvitationEmail" valuePropName="checked">
              <Checkbox>Send invitation email</Checkbox>
            </Form.Item>
          )}

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.sendInvitationEmail !== currentValues.sendInvitationEmail
            }
          >
            {({ getFieldValue }) => {
              const hidePassword =
                !editingStaff && getFieldValue("sendInvitationEmail");

              if (hidePassword) return null;

              return (
                <Form.Item
                  name="password"
                  label={editingStaff ? "New password" : "Password"}
                  rules={[
                    {
                      required: !editingStaff,
                      message: "Password is required",
                    },
                  ]}
                >
                  <Input.Password
                    placeholder={
                      editingStaff
                        ? "Leave blank to keep current password"
                        : "Password"
                    }
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="boardingHouseIds" label="Boarding houses">
            <Select
              mode="multiple"
              allowClear
              loading={boardingHouseLoading}
              options={boardingHouseOptions}
              placeholder="Select boarding houses"
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
}

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatDateInput = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const getInvitationStatusTag = (staff) => {
  if (staff.invitationEmailSent) {
    return (
      <div style={inviteTagWrapperStyle}>
        <Tag color="green">Invite sent</Tag>
      </div>
    );
  }

  if (staff.invitationEmailError) {
    return (
      <div style={inviteTagWrapperStyle}>
        <Tag color="orange" title={staff.invitationEmailError}>
          Invite not sent
        </Tag>
      </div>
    );
  }

  return null;
};

const getInvitationWarningMessage = (messageText, errorText) => {
  if (!errorText) return messageText;
  return `${messageText}: ${errorText}`;
};

const getInitials = (value = "") =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "S";

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

const toolbarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
  flexWrap: "wrap",
};

const searchInputStyle = {
  width: "min(100%, 360px)",
};

const tableStyle = {
  background: "#fff",
  borderRadius: 8,
  overflow: "hidden",
};

const staffCellStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 220,
};

const avatarStyle = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "#eef4ff",
  color: "#2563eb",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  flexShrink: 0,
};

const nameStyle = {
  color: "#27364a",
  fontWeight: 700,
};

const mutedTextStyle = {
  color: "#667085",
  fontSize: 12,
};

const inviteTagWrapperStyle = {
  marginTop: 6,
};

const formStyle = {
  marginTop: 18,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "0 14px",
};
