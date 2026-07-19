import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import {
  CalculatorOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { getOwnBoardingHouses } from "../../api/boardingHouse";
import { getRoomsByBoardingHouse } from "../../api/room";
import {
  calculateMonthlyRent,
  getManagedMonthlyRents,
  updateManagedMonthlyRentStatus,
} from "../../api/monthlyRentAPI";
import AdminLayout from "../layout/admin/AdminLayout";
import "./ManageMonthlyRents.css";

const { Option } = Select;

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const getTenantNames = (rentBy = []) => {
  if (!rentBy.length) {
    return "No tenants";
  }

  return rentBy
    .map((tenant) => tenant?.fullname || tenant?.username || tenant?.email)
    .filter(Boolean)
    .join(", ");
};

const getRoomTenantNames = (room) => {
  const acceptedTenantNames = getTenantNames(room?.acceptedTenants || []);

  return acceptedTenantNames !== "No tenants"
    ? acceptedTenantNames
    : getTenantNames(room?.rentBy || []);
};

const getCurrentPeriod = () => {
  const date = new Date();
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
};

// Chỉ hiển thị phòng có người thuê chính thức để tạo hóa đơn tháng.
// Deposit "accepted" mới chỉ là giữ chỗ, chưa được tính là người thuê.
const hasConfirmedTenant = (room) => {
  const confirmedTenants = Array.isArray(room?.confirmedTenants)
    ? room.confirmedTenants
    : [];
  const rentBy = Array.isArray(room?.rentBy) ? room.rentBy : [];

  return (
    room?.hasConfirmedDeposit === true ||
    room?.depositStatus === "confirmed" ||
    confirmedTenants.length > 0 ||
    rentBy.length > 0 ||
    Number(room?.occupiedCount || 0) > 0
  );
};

const MONTHLY_RENT_STATUSES = ["Pending", "Done", "Cancel"];

const getStatusColor = (status) => {
  if (status === "Done" || status === "Paid") return "green";
  if (status === "Cancel") return "red";
  return "gold";
};

const getStatusMenuItems = (currentStatus) =>
  MONTHLY_RENT_STATUSES.map((status) => ({
    key: status,
    disabled: status === currentStatus,
    label: (
      <span className="manage-monthly-rents__status-menu-item">
        <Tag color={getStatusColor(status)}>{status}</Tag>
      </span>
    ),
  }));

const ManageMonthlyRents = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bills, setBills] = useState([]);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedRoomData = rooms.find((item) => item._id === selectedRoom);

  useEffect(() => {
    loadBoardingHouses();
    loadBills();
  }, []);

  const loadBoardingHouses = async () => {
    try {
      const res = await getOwnBoardingHouses({ page: 1, limit: 100 });
      setBoardingHouses(res.data || []);
    } catch (error) {
      message.error(error.message || "Failed to load boarding houses");
    }
  };

  const loadRooms = async (boardingHouseId) => {
    try {
      const res = await getRoomsByBoardingHouse(boardingHouseId, {
        page: 1,
        limit: 100,
      });
      setRooms((res.data || []).filter(hasConfirmedTenant));
    } catch (error) {
      message.error(error.message || "Failed to load rooms");
    }
  };

  const loadBills = async (params = {}) => {
    try {
      setLoading(true);
      const res = await getManagedMonthlyRents(params);
      setBills(res.data || []);
    } catch (error) {
      message.error(error.message || "Failed to load monthly rents");
    } finally {
      setLoading(false);
    }
  };

  const handleBoardingHouseChange = async (value) => {
    setSelectedBoardingHouse(value);
    setSelectedRoom(null);
    await loadRooms(value);
    await loadBills();
  };

  const handleRoomChange = async (value) => {
    setSelectedRoom(value);
    await loadBills({ roomId: value });
  };

  const openCalculateModal = () => {
    if (!selectedRoom) {
      return message.warning("Please select a room first");
    }

    const period = getCurrentPeriod();

    form.setFieldsValue({
      month: period.month,
      year: period.year,
      currentElectricityReading: selectedRoomData?.currentElectricityReading || 0,
      currentWaterReading: selectedRoomData?.currentWaterReading || 0,
    });
    setIsModalOpen(true);
  };

  const handleCalculate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const res = await calculateMonthlyRent(selectedRoom, values);

      if (!res?.success) {
        throw new Error(res?.message || "Failed to calculate monthly rent");
      }

      message.success("Monthly rent calculated successfully");
      setIsModalOpen(false);
      await loadBills({ roomId: selectedRoom });
    } catch (error) {
      await loadBills({ roomId: selectedRoom });

      const errorMessage = String(error.message || "");
      if (
        errorMessage.toLowerCase().includes("already exists") ||
        errorMessage.toLowerCase().includes("already been calculated")
      ) {
        setIsModalOpen(false);
        message.warning(errorMessage || "Bill for this month already exists.");
        return;
      }

      message.error(error.message || "Failed to calculate monthly rent");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (billId, status) => {
    try {
      setUpdatingStatusId(billId);
      await updateManagedMonthlyRentStatus(billId, status);
      message.success("Monthly rent status updated successfully");
      await loadBills(selectedRoom ? { roomId: selectedRoom } : {});
    } catch (error) {
      message.error(error.message || "Failed to update monthly rent status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const columns = [
    {
      title: "Room",
      render: (_, record) => record.roomId?.roomNumber || "N/A",
    },
    {
      title: "Tenants",
      render: (_, record) =>
        getTenantNames(
          record.tenants?.length ? record.tenants : record.roomId?.rentBy || []
        ),
    },
    {
      title: "Boarding House",
      render: (_, record) => record.roomId?.boardingHouseId?.name || "N/A",
    },
    {
      title: "Period",
      render: (_, record) => `${record.month}/${record.year}`,
    },
    {
      title: "Total Amount",
      dataIndex: "paymentAmount",
      render: formatCurrency,
    },
    {
      title: "Electricity",
      render: (_, record) => formatCurrency(record.electricalBill?.totalAmount),
    },
    {
      title: "Water",
      render: (_, record) => formatCurrency(record.waterBill?.totalAmount),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/manage-monthly-rents/${record._id}`)}
          >
            Detail
          </Button>
          <Dropdown
            trigger={["click"]}
            disabled={updatingStatusId === record._id}
            menu={{
              items: getStatusMenuItems(record.status),
              onClick: ({ key }) => handleStatusChange(record._id, key),
            }}
          >
            <Button
              size="small"
              icon={<EditOutlined />}
              loading={updatingStatusId === record._id}
              className="manage-monthly-rents__update-btn"
            >
              Update <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="manage-monthly-rents">
        <Card title="Manage Monthly Rent" className="manage-monthly-rents__card">
          <Row gutter={[16, 16]} className="manage-monthly-rents__filters">
            <Col xs={24} md={9}>
              <Select
                className="manage-monthly-rents__select"
                placeholder="Select Boarding House"
                value={selectedBoardingHouse}
                onChange={handleBoardingHouseChange}
              >
                {boardingHouses.map((item) => (
                  <Option key={item._id} value={item._id}>
                    {item.name || item.boardingHouseName}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={9}>
              <Select
                className="manage-monthly-rents__select"
                placeholder="Select Room"
                value={selectedRoom}
                onChange={handleRoomChange}
                disabled={!selectedBoardingHouse}
              >
                {rooms.map((room) => (
                  <Option key={room._id} value={room._id}>
                    Room {room.roomNumber} - {getRoomTenantNames(room)}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <Space className="manage-monthly-rents__actions">
                <Button onClick={() => loadBills()}>Show All</Button>
                <Button
                  type="primary"
                  icon={<CalculatorOutlined />}
                  onClick={openCalculateModal}
                >
                  Calculate Rent
                </Button>
              </Space>
            </Col>
          </Row>

          <Table
            rowKey="_id"
            loading={loading}
            columns={columns}
            dataSource={bills}
            className="manage-monthly-rents__table"
          />
        </Card>

        <Modal
          open={isModalOpen}
          title="Calculate Monthly Rent"
          className="manage-monthly-rents__modal"
          okText="Calculate"
          confirmLoading={submitting}
          onOk={handleCalculate}
          onCancel={() => setIsModalOpen(false)}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="month"
                  label="Month"
                  rules={[{ required: true, message: "Please enter month" }]}
                >
                  <InputNumber min={1} max={12} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="year"
                  label="Year"
                  rules={[{ required: true, message: "Please enter year" }]}
                >
                  <InputNumber min={2024} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="currentElectricityReading"
              label="Current Electricity Reading"
              rules={[
                { required: true, message: "Please enter electricity reading" },
                {
                  validator: (_, value) => {
                    const previous = Number(
                      selectedRoomData?.previousElectricityReading || 0
                    );

                    if (Number(value || 0) < previous) {
                      return Promise.reject(
                        new Error(
                          `Current electricity reading must be at least ${previous}`
                        )
                      );
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                min={Number(selectedRoomData?.previousElectricityReading || 0)}
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item
              name="currentWaterReading"
              label="Current Water Reading"
              rules={[
                { required: true, message: "Please enter water reading" },
                {
                  validator: (_, value) => {
                    const previous = Number(
                      selectedRoomData?.previousWaterReading || 0
                    );

                    if (Number(value || 0) < previous) {
                      return Promise.reject(
                        new Error(
                          `Current water reading must be at least ${previous}`
                        )
                      );
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                min={Number(selectedRoomData?.previousWaterReading || 0)}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default ManageMonthlyRents;
