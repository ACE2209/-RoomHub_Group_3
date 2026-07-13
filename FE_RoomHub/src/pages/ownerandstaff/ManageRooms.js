import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Row,
  Col,
  Upload,
  Switch,
  InputNumber,
} from "antd";

import {
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";

import {
  getOwnBoardingHouses,
} from "../../api/boardingHouse";

import {
  getRoomTypesByBoardingHouse,
  getRoomsByBoardingHouse,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../../api/room";

import AdminLayout from "../layout/admin/AdminLayout";

import "./ManageRoom.css";

const { Option } = Select;
const { TextArea } = Input;

const getTenantNames = (rentBy = []) => {
  if (!rentBy.length) {
    return "No tenants";
  }

  return rentBy
    .map((tenant) => tenant?.fullname || tenant?.username || tenant?.email)
    .filter(Boolean)
    .join(", ");
};

const hasAcceptedDeposit = (room) =>
  room?.hasAcceptedDeposit || room?.depositStatus === "accepted";

const renderRoomStatus = (room) => {
  if (hasAcceptedDeposit(room)) {
    return <span style={{ color: "#b7791f", fontWeight: 700 }}>Đã đặt cọc</span>;
  }

  if (room.isAvailable) {
    return <span style={{ color: "#087443", fontWeight: 700 }}>Available</span>;
  }

  return <span style={{ color: "#b32f1f", fontWeight: 700 }}>Occupied</span>;
};

const ManageRooms = () => {
  const [loading, setLoading] = useState(false);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadBoardingHouses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBoardingHouses = async () => {
    try {
      const res = await getOwnBoardingHouses({
        page: 1,
        limit: 100,
      });
      setBoardingHouses(res.data || []);
      // Auto-select first boarding house if available
      if (res.data && res.data.length > 0) {
        const firstBhId = res.data[0]._id;
        setSelectedBoardingHouse(firstBhId);
        loadRoomTypes(firstBhId);
        loadRooms(firstBhId);
      }
    } catch (err) {
      message.error(err.message || "Failed to load boarding houses");
    }
  };

  const loadRoomTypes = async (boardingHouseId) => {
    try {
      const res = await getRoomTypesByBoardingHouse(boardingHouseId);
      setRoomTypes(res.data || []);
    } catch (err) {
      message.error(err.message || "Failed to load room types");
    }
  };

  const loadRooms = async (boardingHouseId, page = 1) => {
    try {
      setLoading(true);
      const res = await getRoomsByBoardingHouse(boardingHouseId, {
        page,
        limit: 10,
      });
      setRooms(res.data || []);
      setPagination(res.pagination || {});
    } catch (err) {
      message.error(err.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleBoardingHouseChange = async (value) => {
    setSelectedBoardingHouse(value);
    await loadRoomTypes(value);
    await loadRooms(value);
  };

  const openCreateModal = () => {
    if (!selectedBoardingHouse) {
      return message.warning("Please select a boarding house first");
    }

    setEditingRoom(null);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({
      boardingHouseId: selectedBoardingHouse,
    });
    setIsModalOpen(true);
  };

  const openEditModal = async (room) => {
    const boardingHouseId =
      room.boardingHouseId?._id || room.boardingHouseId;

    if (boardingHouseId) {
      await loadRoomTypes(boardingHouseId);
    }

    setEditingRoom(room);

    form.setFieldsValue({
      roomNumber: room.roomNumber,
      description: room.description,
      roomTypeId: room.roomTypeId?._id,
      boardingHouseId: boardingHouseId,
      previousElectricityReading:
        room.previousElectricityReading,
      previousWaterReading:
        room.previousWaterReading,
      currentElectricityReading:
        room.currentElectricityReading,
      currentWaterReading:
        room.currentWaterReading,
      isAvailable: room.isAvailable,
    });

    setFileList([]);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });

      // ✅ Append ALL files (not just the first one)
      if (fileList.length > 0) {
        fileList.forEach((file) => {
          formData.append("Room", file.originFileObj);
        });
      }

      if (editingRoom) {
        if (fileList.length === 0) {
          message.warning("Please upload at least one image to update");
          return;
        }
        await updateRoom(editingRoom._id, formData);
        message.success("Room updated successfully");
      } else {
        console.log("✨ Creating new room");
        await createRoom(formData);
        message.success("Room created successfully");
      }

      setIsModalOpen(false);
      if (selectedBoardingHouse) {
        loadRooms(selectedBoardingHouse);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      message.error(err.message || "An error occurred");
    }
  };

  const handleDelete = async (roomId) => {
    try {
      await deleteRoom(roomId);
      message.success("Room deleted successfully");
      if (selectedBoardingHouse) {
        loadRooms(selectedBoardingHouse);
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || "Failed to delete room");
    }
  };

  const columns = [
    {
      title: "Room Number",
      dataIndex: "roomNumber",
      key: "roomNumber",
    },
    {
      title: "Room Type",
      key: "roomType",
      render: (_, record) => record.roomTypeId?.typeName || "N/A",
    },
    {
      title: "Capacity",
      key: "capacity",
      render: (_, record) => record.roomTypeId?.peopleNumber || "N/A",
    },
    {
      title: "Tenants",
      key: "tenants",
      render: (_, record) => getTenantNames(record.rentBy || []),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => renderRoomStatus(record),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => openEditModal(record)}
            className="manage-rooms__btn-edit"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Room"
            description="Are you sure you want to delete this room?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small" className="manage-rooms__btn-delete">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="manage-rooms-container">
        <Card
          title="Manage Rooms"
          className="manage-rooms__card"
          style={{
            backgroundColor: "#ffffff",
            borderColor: "#e5e7eb"
          }}
        >
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={24} md={20}>
              <Select
                style={{ width: "100%" }}
                placeholder="Select Boarding House"
                value={selectedBoardingHouse}
                onChange={handleBoardingHouseChange}
                className="manage-rooms__select"
              >
                {boardingHouses.map((bh) => (
                  <Option key={bh._id} value={bh._id}>
                    {bh.name || bh.boardingHouseName}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={4}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                block
                onClick={openCreateModal}
                className="manage-rooms__btn-add"
              >
                Add Room
              </Button>
            </Col>
          </Row>

          <Table
            rowKey="_id"
            loading={loading}
            columns={columns}
            dataSource={rooms}
            className="manage-rooms__table"
            pagination={{
              current: pagination.currentPage,
              total: pagination.totalItems,
              pageSize: pagination.limit,
              onChange: (page) => {
                if (selectedBoardingHouse) {
                  loadRooms(selectedBoardingHouse, page);
                }
              },
            }}
          />
        </Card>

        <Modal
          open={isModalOpen}
          width={700}
          title={editingRoom ? "Update Room" : "Create Room"}
          onCancel={() => setIsModalOpen(false)}
          onOk={handleSubmit}
          okText={editingRoom ? "Update" : "Create"}
          className="manage-rooms__modal"
        >
          <Form form={form} layout="vertical">
            <Form.Item name="boardingHouseId" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              name="roomNumber"
              label="Room Number"
              rules={[{ required: true, message: "Please enter room number" }]}
            >
              <Input placeholder="e.g., 101, A1" />
            </Form.Item>

            <Form.Item
              name="roomTypeId"
              label="Room Type"
              rules={[{ required: true, message: "Please select room type" }]}
            >
              <Select placeholder="Select room type">
                {roomTypes.map((rt) => (
                  <Option key={rt._id} value={rt._id}>
                    {rt.typeName}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: "Please enter description" }]}
            >
              <TextArea rows={4} placeholder="Room description..." />
            </Form.Item>

            <Form.Item label="Room Images (Multiple)">
              <Upload
                beforeUpload={() => false}
                fileList={fileList}
                onChange={(info) => setFileList(info.fileList)}
                multiple={true}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Upload Images</Button>
              </Upload>
              <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                You can upload multiple images ({fileList.length} selected)
              </p>
            </Form.Item>

            {editingRoom && (
              <>
                <Form.Item
                  name="previousElectricityReading"
                  label="Previous Electricity Reading"
                  rules={[
                    {
                      type: "number",
                      min: 0,
                      message: "Value must be greater than or equal to 0",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                <Form.Item
                  name="previousWaterReading"
                  label="Previous Water Reading"
                >
                  <Input type="number" placeholder="0" />
                </Form.Item>

                <Form.Item
                  name="currentElectricityReading"
                  label="Current Electricity Reading"
                >
                  <Input type="number" placeholder="0" />
                </Form.Item>

                <Form.Item
                  name="currentWaterReading"
                  label="Current Water Reading"
                >
                  <Input type="number" placeholder="0" />
                </Form.Item>

                <Form.Item
                  name="isAvailable"
                  label="Available"
                  valuePropName="checked"
                >
                  <Switch
                    onChange={(val) => {
                      console.log("✅ Switch changed to:", val);
                      form.setFieldValue("isAvailable", val);
                    }}
                  />
                </Form.Item>
              </>
            )}
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default ManageRooms;
