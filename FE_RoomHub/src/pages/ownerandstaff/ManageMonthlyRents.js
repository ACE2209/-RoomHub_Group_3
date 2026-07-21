import React, { useEffect, useState } from "react";
import {
  Alert,
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
  getNextMonthlyRentCycle,
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

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "";

const formatBillingPeriod = (bill) => {
  if (bill?.periodStart && bill?.periodEnd) {
    return `${formatDate(bill.periodStart)} - ${formatDate(bill.periodEnd)}`;
  }
  return `${bill?.month || ""}/${bill?.year || ""}`;
};

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

// Chỉ cho phép tính tiền thuê cho phòng đã có người thuê chính thức.
// Không dùng accepted deposit vì accepted mới chỉ là giữ chỗ chờ thanh toán.
const hasConfirmedTenant = (room) =>
  Boolean(
    room?.hasConfirmedDeposit ||
      room?.depositStatus === "confirmed" ||
      (Array.isArray(room?.confirmedTenants) && room.confirmedTenants.length > 0) ||
      (Array.isArray(room?.rentBy) && room.rentBy.length > 0)
  );

const MONTHLY_RENT_STATUSES = ["Pending", "Overdue", "Done", "Cancel"];
const UNPAID_BILL_STATUSES = ["Pending", "Overdue", "Failed"];
const DEFAULT_ARREARS_WARNING_MONTHS = 4;
const DEFAULT_MAX_UNPAID_MONTHS = 5;

const getStatusColor = (status) => {
  if (status === "Done" || status === "Paid") return "green";
  if (status === "Overdue") return "volcano";
  if (status === "Cancel" || status === "Failed") return "red";
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
  const [cyclePreview, setCyclePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const selectedRoomData = rooms.find((item) => item._id === selectedRoom);
  const selectedRoomBills = bills.filter(
    (bill) => (bill.roomId?._id || bill.roomId) === selectedRoom
  );
  const arrearsFromApi = selectedRoomBills.find((bill) => bill.arrears)?.arrears;
  const unpaidRentMonths =
    arrearsFromApi?.unpaidMonths ??
    selectedRoomBills.filter((bill) =>
      UNPAID_BILL_STATUSES.includes(bill.status)
    ).length;
  const warningMonths =
    arrearsFromApi?.warningMonths || DEFAULT_ARREARS_WARNING_MONTHS;
  const maxUnpaidMonths =
    arrearsFromApi?.maxUnpaidMonths || DEFAULT_MAX_UNPAID_MONTHS;
  const hasCriticalArrears = unpaidRentMonths >= maxUnpaidMonths;

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

  const openCalculateModal = async () => {
    if (!selectedRoom) {
      return message.warning("Please select a room first");
    }

    form.setFieldsValue({
      currentElectricityReading: selectedRoomData?.currentElectricityReading || 0,
      currentWaterReading: selectedRoomData?.currentWaterReading || 0,
    });
    setCyclePreview(null);
    setIsModalOpen(true);

    try {
      setPreviewLoading(true);
      const res = await getNextMonthlyRentCycle(selectedRoom);
      if (!res?.success) throw new Error(res?.message || "Failed to load rent cycle");
      setCyclePreview(res.data);
    } catch (error) {
      message.error(error.message || "Failed to load rent cycle");
      setIsModalOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCalculate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const res = await calculateMonthlyRent(selectedRoom, {
        ...values,
        depositRoomId: cyclePreview?.depositRoomId,
      });

      if (!res?.success) {
        throw new Error(res?.message || "Failed to calculate monthly rent");
      }

      const bill = res?.data?.bill;
      const arrears = res?.data?.arrears;
      message.success(
        bill?.cycleNumber
          ? `Created the next rent cycle ${bill.cycleNumber}: ${formatBillingPeriod(
              bill
            )}. Unpaid: ${arrears?.unpaidMonths || 0}/${
              arrears?.maxUnpaidMonths || DEFAULT_MAX_UNPAID_MONTHS
            }.`
          : "Monthly rent calculated successfully"
      );
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
      render: (_, record) => (
        <div>
          <div>{formatBillingPeriod(record)}</div>
          {record.cycleNumber ? <small>Cycle {record.cycleNumber}</small> : null}
        </div>
      ),
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
                  disabled={!selectedRoom || hasCriticalArrears}
                >
                  Calculate Next Rent
                </Button>
              </Space>
            </Col>
          </Row>

          {selectedRoom && unpaidRentMonths >= warningMonths ? (
            <Alert
              showIcon
              type={hasCriticalArrears ? "error" : "warning"}
              className="manage-monthly-rents__arrears-alert"
              message={
                hasCriticalArrears
                  ? `Rent arrears limit reached: ${unpaidRentMonths}/${maxUnpaidMonths} unpaid months`
                  : `Rent arrears warning: ${unpaidRentMonths}/${maxUnpaidMonths} unpaid months`
              }
              description={
                hasCriticalArrears
                  ? `New rent bills are blocked. After the ${maxUnpaidMonths}th bill passes its grace period, the rental contract is terminated automatically, but the debt remains payable.`
                  : `The tenant is close to the ${maxUnpaidMonths}-month limit. Collect the unpaid rent before creating more bills.`
              }
            />
          ) : null}

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
          confirmLoading={submitting || previewLoading}
          okButtonProps={{ disabled: previewLoading || !cyclePreview }}
          onOk={handleCalculate}
          onCancel={() => setIsModalOpen(false)}
        >
          <Form form={form} layout="vertical">
            <Alert
              showIcon
              type="info"
              message={
                previewLoading
                  ? "Loading the next rent period..."
                  : cyclePreview
                  ? `Rent cycle ${cyclePreview.cycleNumber}: ${formatDate(
                      cyclePreview.periodStart
                    )} - ${formatDate(cyclePreview.periodEnd)}`
                  : "The next rent period could not be loaded"
              }
              description={
                cyclePreview
                  ? `Move-in date: ${formatDate(
                      cyclePreview.moveInDate
                    )}. You may calculate this bill immediately for the demo; the next cycles continue monthly from this date.`
                  : "The period is calculated from the confirmed deposit's move-in date."
              }
              style={{ marginBottom: 16 }}
            />
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
