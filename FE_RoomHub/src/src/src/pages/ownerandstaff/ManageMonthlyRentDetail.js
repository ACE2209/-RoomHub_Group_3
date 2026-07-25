import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Table, Tag, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";

import { getManagedMonthlyRentDetail } from "../../api/monthlyRentAPI";
import AdminLayout from "../layout/admin/AdminLayout";
import "./MonthlyRentDetail.css";

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

const getStatusColor = (status) => {
  if (status === "Done" || status === "Paid") return "green";
  if (status === "Cancel") return "red";
  return "gold";
};

const ManageMonthlyRentDetail = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getManagedMonthlyRentDetail(billId);
      setDetail(res.data);
    } catch (error) {
      message.error(error.message || "Failed to load monthly rent detail");
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const bill = detail?.bill;
  const room = bill?.roomId;
  const roomPrice = room?.roomTypeId?.price || 0;
  const additionalFeeTotal = (bill?.additionalFee || []).reduce(
    (sum, fee) => sum + Number(fee.feeAmount || 0),
    0
  );

  const userColumns = [
    {
      title: "Tenant",
      render: (_, record) => record.accountId?.fullname || "N/A",
    },
    {
      title: "Email",
      render: (_, record) => record.accountId?.email || "N/A",
    },
    {
      title: "Amount",
      dataIndex: "paymentAmount",
      render: formatCurrency,
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
  ];

  const feeColumns = [
    {
      title: "Fee Name",
      dataIndex: "feeName",
    },
    {
      title: "Amount",
      dataIndex: "feeAmount",
      render: formatCurrency,
    },
  ];

  const utilityRows = bill
    ? [
        {
          key: "electricity",
          service: "Electricity",
          oldNumber: bill.electricalBill?.oldNumber || 0,
          newNumber: bill.electricalBill?.newNumber || 0,
          quantityConsumed: bill.electricalBill?.quantityConsumed || 0,
          unitPrice: room?.boardingHouseId?.electricityPrice || 0,
          totalAmount: bill.electricalBill?.totalAmount || 0,
        },
        {
          key: "water",
          service: "Water",
          oldNumber: bill.waterBill?.oldNumber || 0,
          newNumber: bill.waterBill?.newNumber || 0,
          quantityConsumed: bill.waterBill?.quantityConsumed || 0,
          unitPrice: room?.boardingHouseId?.waterPrice || 0,
          totalAmount: bill.waterBill?.totalAmount || 0,
        },
      ]
    : [];

  const utilityColumns = [
    {
      title: "Service",
      dataIndex: "service",
      className: "monthly-rent-detail__service",
    },
    {
      title: "Old Reading",
      dataIndex: "oldNumber",
      align: "right",
    },
    {
      title: "New Reading",
      dataIndex: "newNumber",
      align: "right",
    },
    {
      title: "Used",
      dataIndex: "quantityConsumed",
      align: "right",
    },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      align: "right",
      render: formatCurrency,
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      align: "right",
      render: (value) => <strong>{formatCurrency(value)}</strong>,
    },
  ];

  return (
    <AdminLayout>
      <div className="monthly-rent-detail">
        <Card
          title={
            <div className="monthly-rent-detail__header">
              <Button
                className="monthly-rent-detail__back"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/manage-monthly-rents")}
              >
                Back
              </Button>
              <span className="monthly-rent-detail__title">
                Monthly Rent Detail
              </span>
            </div>
          }
          loading={loading}
          className="monthly-rent-detail__card monthly-rent-detail__hero"
        >
          {bill && (
            <>
              <Descriptions
                bordered
                column={2}
                className="monthly-rent-detail__descriptions"
              >
                <Descriptions.Item label="Boarding House">
                  {room?.boardingHouseId?.name || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Room">
                  {room?.roomNumber || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Tenants" span={2}>
                  {getTenantNames(room?.rentBy || [])}
                </Descriptions.Item>
                <Descriptions.Item label="Period">
                  {bill.periodStart && bill.periodEnd
                    ? `${new Date(bill.periodStart).toLocaleDateString("vi-VN")} - ${new Date(
                        bill.periodEnd
                      ).toLocaleDateString("vi-VN")}`
                    : `${bill.month}/${bill.year}`}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(bill.status)}>
                    {bill.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Room Price">
                  {formatCurrency(roomPrice)}
                </Descriptions.Item>
                <Descriptions.Item label="Additional Fees">
                  {formatCurrency(additionalFeeTotal)}
                </Descriptions.Item>
                <Descriptions.Item label="Total Amount" span={2}>
                  <strong className="monthly-rent-detail__total">
                    {formatCurrency(bill.paymentAmount)}
                  </strong>
                </Descriptions.Item>
              </Descriptions>

              <Card
                type="inner"
                title="Electricity & Water Readings"
                className="monthly-rent-detail__section"
              >
                <Table
                  rowKey="key"
                  columns={utilityColumns}
                  dataSource={utilityRows}
                  pagination={false}
                  className="monthly-rent-detail__table"
                />
              </Card>

              <Card
                type="inner"
                title="Additional Fee Breakdown"
                className="monthly-rent-detail__section"
              >
                <Table
                  rowKey={(record, index) => `${record.feeName}-${index}`}
                  columns={feeColumns}
                  dataSource={bill.additionalFee || []}
                  pagination={false}
                  className="monthly-rent-detail__table"
                />
              </Card>

              <Card
                type="inner"
                title="Tenant Payment Status"
                className="monthly-rent-detail__section"
              >
                <Table
                  rowKey="_id"
                  columns={userColumns}
                  dataSource={detail.userPayments || []}
                  pagination={false}
                  className="monthly-rent-detail__table"
                />
              </Card>
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ManageMonthlyRentDetail;
