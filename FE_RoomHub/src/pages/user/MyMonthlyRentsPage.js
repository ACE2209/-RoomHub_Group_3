import React, { useEffect, useState } from "react";
import { Button, Card, Table, Tag, message } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { getProfileAPI } from "../../api/accountAPI";
import { getMyMonthlyRents } from "../../api/monthlyRentAPI";
import Header from "../layout/homepage/header";
import Footer from "../layout/homepage/footer";
import ProfileSidebar from "../profile/ProfileSidebar";

const formatPeriod = (bill) => {
  if (bill?.periodStart && bill?.periodEnd) {
    return `${new Date(bill.periodStart).toLocaleDateString("vi-VN")} - ${new Date(
      bill.periodEnd
    ).toLocaleDateString("vi-VN")}`;
  }
  return `${bill?.month || ""}/${bill?.year || ""}`;
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const getStatusColor = (status) => {
  if (status === "Done" || status === "Paid") return "green";
  if (status === "Cancel" || status === "Expired") return "red";
  if (status === "Overdue") return "volcano";
  return "gold";
};

const MyMonthlyRentsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const [profileRes, rentRes] = await Promise.all([
        getProfileAPI(),
        getMyMonthlyRents(),
      ]);
      setUser(profileRes?.data || profileRes || null);
      const res = rentRes;
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
      render: (_, record) => formatPeriod(record.paymentBillId),
    },
    {
      title: "Due date",
      render: (_, record) => {
        const dueDate = record.paymentBillId?.dueDate;
        return dueDate ? new Date(dueDate).toLocaleString("vi-VN") : "N/A";
      },
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
        <Tag color={getStatusColor(status)}>{status}</Tag>
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
    <>
      <Header />
      <div style={styles.page}>
        <ProfileSidebar user={user} />
        <main style={styles.content}>
        <Card title="My Monthly Rents">
          <Table
            rowKey="_id"
            loading={loading}
            columns={columns}
            dataSource={payments}
          />
        </Card>
        </main>
      </div>
      <Footer />
    </>
  );
};

const styles = {
  page: {
    display: "flex",
    gap: 24,
    maxWidth: 1200,
    margin: "32px auto",
    padding: "0 24px",
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
};

export default MyMonthlyRentsPage;
