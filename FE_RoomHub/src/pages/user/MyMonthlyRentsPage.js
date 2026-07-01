import React, { useEffect, useState } from "react";
import { Button, Card, Table, Tag, message } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { getMyMonthlyRents } from "../../api/monthlyRentAPI";
import AdminLayout from "../layout/admin/AdminLayout";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const MyMonthlyRentsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await getMyMonthlyRents();
      setPayments(res.data || []);
    } catch (error) {
      message.error(error.message || "Failed to load monthly rents");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
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
        `${record.paymentBillId?.month || ""}/${record.paymentBillId?.year || ""}`,
    },
    {
      title: "Amount",
      dataIndex: "paymentAmount",
      render: formatCurrency,
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
          onClick={() => navigate(`/monthly-rents/${record._id}`)}
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: 24 }}>
        <Card title="My Monthly Rents">
          <Table
            rowKey="_id"
            loading={loading}
            columns={columns}
            dataSource={payments}
          />
        </Card>
      </div>
    </AdminLayout>
  );
};

export default MyMonthlyRentsPage;
