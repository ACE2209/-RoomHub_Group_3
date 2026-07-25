import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Form, Modal, Select, Space, Table, Tag, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";

import { getProfileAPI } from "../../api/accountAPI";
import {
  getMyMonthlyRentDetail,
  payMyMonthlyRent,
} from "../../api/monthlyRentAPI";
import Header from "../layout/homepage/header";
import Footer from "../layout/homepage/footer";
import ProfileSidebar from "../profile/ProfileSidebar";
import "../ownerandstaff/MonthlyRentDetail.css";

const { Option } = Select;

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const getStatusColor = (status) => {
  if (status === "Done" || status === "Paid") return "green";
  if (status === "Cancel") return "red";
  return "gold";
};

const MyMonthlyRentDetailPage = () => {
  const { userPaymentId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payment, setPayment] = useState(null);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, detailRes] = await Promise.all([
        getProfileAPI(),
        getMyMonthlyRentDetail(userPaymentId),
      ]);
      setUser(profileRes?.data || profileRes || null);
      setPayment(detailRes.data);
    } catch (error) {
      message.error(error.message || "Failed to load monthly rent detail");
    } finally {
      setLoading(false);
    }
  }, [userPaymentId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

const handlePay = async () => {
  try {
    const values = await form.validateFields();
    setPaying(true);

    const res = await payMyMonthlyRent(userPaymentId, values);
    const paymentUrl = res?.data?.paymentUrl || res?.data?.payUrl;

    if (paymentUrl) {
      window.location.href = paymentUrl;
      return;
    }

    message.success("Payment completed successfully");
    setIsModalOpen(false);
    await loadDetail();
  } catch (error) {
    message.error(error.message || "Failed to pay monthly rent");
  } finally {
    setPaying(false);
  }
};

  const bill = payment?.paymentBillId;
  const room = bill?.roomId;
  const additionalFeeTotal = (bill?.additionalFee || []).reduce(
    (sum, fee) => sum + Number(fee.feeAmount || 0),
    0
  );
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
  const feeColumns = [
    {
      title: "Fee",
      dataIndex: "feeName",
    },
    {
      title: "Amount",
      dataIndex: "feeAmount",
      align: "right",
      render: (value) => <strong>{formatCurrency(value)}</strong>,
    },
  ];

  return (
    <>
      <Header />
      <div style={styles.page}>
        <ProfileSidebar user={user} />
        <main style={styles.content}>
      <div className="monthly-rent-detail" style={{ padding: 0 }}>
        <Card
          title={
            <div className="monthly-rent-detail__header">
              <Button
                className="monthly-rent-detail__back"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/monthly-rents")}
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
          {payment && (
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
                <Descriptions.Item label="Period">
                  {bill?.periodStart && bill?.periodEnd
                    ? `${new Date(bill.periodStart).toLocaleDateString("vi-VN")} - ${new Date(
                        bill.periodEnd
                      ).toLocaleDateString("vi-VN")}`
                    : `${bill?.month}/${bill?.year}`}
                </Descriptions.Item>
                <Descriptions.Item label="Your Status">
                  <Tag color={getStatusColor(payment.status)}>
                    {payment.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Room Price">
                  {formatCurrency(room?.roomTypeId?.price)}
                </Descriptions.Item>
                <Descriptions.Item label="Additional Fees">
                  {formatCurrency(additionalFeeTotal)}
                </Descriptions.Item>
                <Descriptions.Item label="Room Total">
                  {formatCurrency(bill?.paymentAmount)}
                </Descriptions.Item>
                <Descriptions.Item label="Your Payment">
                  <strong className="monthly-rent-detail__total">
                    {formatCurrency(payment.paymentAmount)}
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Method" span={2}>
                  {payment.paymentMethod}
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
                title="Additional Fees"
                className="monthly-rent-detail__section"
              >
                <Table
                  rowKey={(record, index) => `${record.feeName}-${index}`}
                  columns={feeColumns}
                  dataSource={bill?.additionalFee || []}
                  pagination={false}
                  locale={{ emptyText: "No additional fees" }}
                  className="monthly-rent-detail__table"
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell>
                        <strong>Total Fees</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <strong>{formatCurrency(additionalFeeTotal)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              </Card>

{["Pending", "Failed", "Overdue"].includes(payment.status) && (
  <Space className="monthly-rent-detail__actions">
    <Button
      type="primary"
      size="large"
      className="monthly-rent-detail__pay-btn"
      onClick={() => setIsModalOpen(true)}
    >
      Pay Rent
    </Button>
  </Space>
)}
              
            </>
          )}
        </Card>

        <Modal
          open={isModalOpen}
          title="Pay Monthly Rent"
          okText="Pay"
          confirmLoading={paying}
          onOk={handlePay}
          onCancel={() => setIsModalOpen(false)}
        >
          <Form
            form={form}
            layout="vertical"
initialValues={{ method: "VNPay" }}          >
            <Form.Item
  name="method"
  label="Payment Method"
  rules={[{ required: true, message: "Please select payment method" }]}
>
  <Select>
    <Option value="VNPay">VNPay</Option>
    <Option value="ZaloPay">ZaloPay</Option>
  </Select>
</Form.Item>
          </Form>
        </Modal>
      </div>
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

export default MyMonthlyRentDetailPage;
