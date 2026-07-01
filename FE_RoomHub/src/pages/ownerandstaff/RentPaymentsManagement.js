import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  message,
} from "antd";
import { EyeOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { getOwnBoardingHouses } from "../../api/boardingHouse";
import { getRoomsByBoardingHouse } from "../../api/room";
import { getManagedRentPayments } from "../../api/monthlyRentAPI";
import AdminLayout from "../layout/admin/AdminLayout";
import "./RentPaymentsManagement.css";

const { Option } = Select;

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const getStatusColor = (status) => {
  if (status === "Paid") return "green";
  if (status === "Failed") return "red";
  return "gold";
};

const RentPaymentsManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    totalPayments: 0,
    paidPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
  });
  const [filters, setFilters] = useState({
    boardingHouseId: null,
    roomId: null,
    status: null,
    month: null,
    year: null,
  });

  const loadBoardingHouses = useCallback(async () => {
    try {
      const res = await getOwnBoardingHouses({ page: 1, limit: 100 });
      setBoardingHouses(res.data || []);
    } catch (error) {
      message.error(error.message || "Failed to load boarding houses");
    }
  }, []);

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

  const loadPayments = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await getManagedRentPayments(params);
      setPayments(res.data || []);
      setSummary(res.summary || {});
    } catch (error) {
      message.error(error.message || "Failed to load rent payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoardingHouses();
    loadPayments();
  }, [loadBoardingHouses, loadPayments]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleBoardingHouseChange = async (value) => {
    const nextFilters = {
      ...filters,
      boardingHouseId: value,
      roomId: null,
    };

    setFilters(nextFilters);
    setRooms([]);

    if (value) {
      await loadRooms(value);
    }
  };

  const handleReset = async () => {
    const nextFilters = {
      boardingHouseId: null,
      roomId: null,
      status: null,
      month: null,
      year: null,
    };

    setFilters(nextFilters);
    setRooms([]);
    await loadPayments(nextFilters);
  };

  const columns = [
    {
      title: "Tenant",
      render: (_, record) =>
        record.accountId?.fullname ||
        record.accountId?.username ||
        record.accountId?.email ||
        "N/A",
      fixed: "left",
    },
    {
      title: "Phone",
      render: (_, record) => record.accountId?.phoneNumber || "N/A",
    },
    {
      title: "Boarding House",
      render: (_, record) =>
        record.paymentBillId?.roomId?.boardingHouseId?.name || "N/A",
    },
    {
      title: "Room",
      render: (_, record) => record.paymentBillId?.roomId?.roomNumber || "N/A",
    },
    {
      title: "Period",
      render: (_, record) =>
        `${record.paymentBillId?.month || "N/A"}/${
          record.paymentBillId?.year || "N/A"
        }`,
    },
    {
      title: "Amount",
      dataIndex: "paymentAmount",
      align: "right",
      render: (value) => <strong>{formatCurrency(value)}</strong>,
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      render: (method) => method || "Unpaid",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)} className="rent-payments__tag">
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() =>
            navigate(`/manage-monthly-rents/${record.paymentBillId?._id}`)
          }
        >
          Bill Detail
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="rent-payments">
        <div className="rent-payments__header">
          <div>
            <h1>Rent Payments</h1>
            <p>Track every tenant payment across your managed rooms.</p>
          </div>
        </div>

        <Row gutter={[16, 16]} className="rent-payments__stats">
          <Col xs={24} md={6}>
            <Card className="rent-payments__stat-card">
              <Statistic
                title="Total Receivable"
                value={summary.totalAmount || 0}
                formatter={formatCurrency}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="rent-payments__stat-card">
              <Statistic
                title="Paid"
                value={summary.paidAmount || 0}
                formatter={formatCurrency}
              />
              <span className="rent-payments__muted">
                {summary.paidPayments || 0} payments
              </span>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="rent-payments__stat-card">
              <Statistic
                title="Pending"
                value={summary.pendingAmount || 0}
                formatter={formatCurrency}
              />
              <span className="rent-payments__muted">
                {summary.pendingPayments || 0} payments
              </span>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="rent-payments__stat-card">
              <Statistic
                title="Total Rows"
                value={summary.totalPayments || 0}
              />
              <span className="rent-payments__muted">
                {summary.failedPayments || 0} failed
              </span>
            </Card>
          </Col>
        </Row>

        <Card className="rent-payments__card">
          <Row gutter={[12, 12]} className="rent-payments__filters">
            <Col xs={24} lg={6}>
              <Select
                allowClear
                style={{ width: "100%" }}
                placeholder="Boarding House"
                value={filters.boardingHouseId}
                onChange={handleBoardingHouseChange}
              >
                {boardingHouses.map((item) => (
                  <Option key={item._id} value={item._id}>
                    {item.name || item.boardingHouseName}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} lg={4}>
              <Select
                allowClear
                style={{ width: "100%" }}
                placeholder="Room"
                value={filters.roomId}
                disabled={!filters.boardingHouseId}
                onChange={(value) => updateFilter("roomId", value)}
              >
                {rooms.map((room) => (
                  <Option key={room._id} value={room._id}>
                    Room {room.roomNumber}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} lg={4}>
              <Select
                allowClear
                style={{ width: "100%" }}
                placeholder="Status"
                value={filters.status}
                onChange={(value) => updateFilter("status", value)}
              >
                <Option value="Pending">Pending</Option>
                <Option value="Paid">Paid</Option>
                <Option value="Failed">Failed</Option>
              </Select>
            </Col>
            <Col xs={12} lg={3}>
              <InputNumber
                min={1}
                max={12}
                style={{ width: "100%" }}
                placeholder="Month"
                value={filters.month}
                onChange={(value) => updateFilter("month", value)}
              />
            </Col>
            <Col xs={12} lg={3}>
              <InputNumber
                min={2024}
                style={{ width: "100%" }}
                placeholder="Year"
                value={filters.year}
                onChange={(value) => updateFilter("year", value)}
              />
            </Col>
            <Col xs={24} lg={4}>
              <Space className="rent-payments__actions">
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => loadPayments(filters)}
                >
                  Search
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  Reset
                </Button>
              </Space>
            </Col>
          </Row>

          <Table
            rowKey="_id"
            loading={loading}
            columns={columns}
            dataSource={payments}
            className="rent-payments__table"
            scroll={{ x: 1100 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${total} rent payments`,
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
};

export default RentPaymentsManagement;
