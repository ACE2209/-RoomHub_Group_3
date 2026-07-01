import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Descriptions, Form, Modal, Select, Table, Tag, message } from "antd";
import { useParams } from "react-router-dom";

import {
  getMyMonthlyRentDetail,
  payMyMonthlyRent,
} from "../../api/monthlyRentAPI";
import AdminLayout from "../layout/admin/AdminLayout";
import "../ownerandstaff/MonthlyRentDetail.css";

const { Option } = Select;

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const MyMonthlyRentDetailPage = () => {
  const { userPaymentId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payment, setPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyMonthlyRentDetail(userPaymentId);
      setPayment(res.data);
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
      await payMyMonthlyRent(userPaymentId, values);
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

  return (
    <AdminLayout>
      <div className="monthly-rent-detail">
        <Card
          title="Monthly Rent Detail"
          loading={loading}
          className="monthly-rent-detail__card monthly-rent-detail__hero"
          extra={
            payment?.status === "Pending" && (
              <Button type="primary" onClick={() => setIsModalOpen(true)}>
                Pay Rent
              </Button>
            )
          }
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
                  {bill?.month}/{bill?.year}
                </Descriptions.Item>
                <Descriptions.Item label="Your Status">
                  <Tag color={payment.status === "Paid" ? "green" : "gold"}>
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
            initialValues={{ paymentMethod: "Cash" }}
          >
            <Form.Item
              name="paymentMethod"
              label="Payment Method"
              rules={[{ required: true, message: "Please select payment method" }]}
            >
              <Select>
                <Option value="Cash">Cash</Option>
                <Option value="Bank Transfer">Bank Transfer</Option>
                <Option value="Momo">Momo</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default MyMonthlyRentDetailPage;
