import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
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
import { CalculatorOutlined, EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { getOwnBoardingHouses } from "../../api/boardingHouse";
import { getRoomsByBoardingHouse } from "../../api/room";
import {
  calculateMonthlyRent,
  getManagedMonthlyRents,
} from "../../api/monthlyRentAPI";
import AdminLayout from "../layout/admin/AdminLayout";

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

const getCurrentPeriod = () => {
  const date = new Date();
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
};

const ManageMonthlyRents = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setRooms(res.data || []);
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

    const room = rooms.find((item) => item._id === selectedRoom);
    const period = getCurrentPeriod();

    form.setFieldsValue({
      month: period.month,
      year: period.year,
      currentElectricityReading: room?.currentElectricityReading || 0,
      currentWaterReading: room?.currentWaterReading || 0,
    });
    setIsModalOpen(true);
  };

  const handleCalculate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await calculateMonthlyRent(selectedRoom, values);
      message.success("Monthly rent calculated successfully");
      setIsModalOpen(false);
      await loadBills({ roomId: selectedRoom });
    } catch (error) {
      message.error(error.message || "Failed to calculate monthly rent");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Room",
      render: (_, record) => record.roomId?.roomNumber || "N/A",
    },
    {
      title: "Tenants",
      render: (_, record) => getTenantNames(record.roomId?.rentBy || []),
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
        <Tag color={status === "Paid" ? "green" : "gold"}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/manage-monthly-rents/${record._id}`)}
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: 24 }}>
        <Card title="Manage Monthly Rent">
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} md={9}>
              <Select
                style={{ width: "100%" }}
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
                style={{ width: "100%" }}
                placeholder="Select Room"
                value={selectedRoom}
                onChange={handleRoomChange}
                disabled={!selectedBoardingHouse}
              >
                {rooms.map((room) => (
                  <Option key={room._id} value={room._id}>
                    Room {room.roomNumber} - {getTenantNames(room.rentBy || [])}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
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
          />
        </Card>

        <Modal
          open={isModalOpen}
          title="Calculate Monthly Rent"
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
              rules={[{ required: true, message: "Please enter electricity reading" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="currentWaterReading"
              label="Current Water Reading"
              rules={[{ required: true, message: "Please enter water reading" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default ManageMonthlyRents;
