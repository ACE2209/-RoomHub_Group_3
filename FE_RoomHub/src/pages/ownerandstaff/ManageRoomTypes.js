import React, { useEffect, useState } from "react";
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Space,
    message,
    Popconfirm,
    Row,
    Col,
    Upload,
    Tag,
} from "antd";
import {
    PlusOutlined,
    UploadOutlined,
    DeleteOutlined,
    EditOutlined,
} from "@ant-design/icons";
import { getOwnBoardingHouses } from "../../api/boardingHouse";
import {
    getRoomTypesByBoardingHouse,
    createRoomType,
    updateRoomType,
    deleteRoomType,
} from "../../api/ownerandstaff/roomType";
import AdminLayout from "../layout/admin/AdminLayout";
import "./ManageRoomTypes.css";

const { Option } = Select;

const ManageRoomTypes = () => {
    const [loading, setLoading] = useState(false);
    const [boardingHouses, setBoardingHouses] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [selectedBoardingHouse, setSelectedBoardingHouse] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 10,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoomType, setEditingRoomType] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [form] = Form.useForm();

    useEffect(() => {
        loadBoardingHouses();
    }, []);

    const loadBoardingHouses = async () => {
        try {
            const res = await getOwnBoardingHouses({ page: 1, limit: 100 });
            setBoardingHouses(res.data || []);
        } catch (err) {
            message.error(err.message || "Failed to load boarding houses");
        }
    };

    const loadRoomTypes = async (boardingHouseId, page = 1) => {
        try {
            setLoading(true);
            const res = await getRoomTypesByBoardingHouse(boardingHouseId, {
                page,
                limit: 10,
            });
            setRoomTypes(res.data || []);
            setPagination(res.pagination || {});
        } catch (err) {
            message.error(err.message || "Failed to load room types");
        } finally {
            setLoading(false);
        }
    };

    const handleBoardingHouseChange = (value) => {
        setSelectedBoardingHouse(value);
        loadRoomTypes(value);
    };

    const openCreateModal = () => {
        if (!selectedBoardingHouse) {
            return message.warning("Please select a boarding house first");
        }
        setEditingRoomType(null);
        setFileList([]);
        form.resetFields();
        setIsModalOpen(true);
    };

    const openEditModal = (roomType) => {
        setEditingRoomType(roomType);
        form.setFieldsValue({
            typeName: roomType.typeName,
            price: roomType.price,
            roomSize: roomType.roomSize,
            peopleNumber: roomType.peopleNumber,
        });
        setFileList([]);
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formData = new FormData();

            formData.append("typeName", values.typeName);
            formData.append("price", values.price);
            formData.append("roomSize", values.roomSize || "");
            formData.append("peopleNumber", values.peopleNumber || 0);
            formData.append("facilities", JSON.stringify([]));

            if (fileList.length > 0) {
                formData.append("roomType", fileList[0].originFileObj);
            }

            if (editingRoomType) {
                if (fileList.length === 0) {
                    message.warning("Please upload a new image to update");
                    return;
                }
                await updateRoomType(editingRoomType._id, formData);
                message.success("Room type updated successfully");
            } else {
                if (fileList.length === 0) {
                    message.error("Please upload an image for the room type");
                    return;
                }
                await createRoomType(selectedBoardingHouse, formData);
                message.success("Room type created successfully");
            }

            setIsModalOpen(false);
            loadRoomTypes(selectedBoardingHouse);
        } catch (err) {
            message.error(err.message || "An error occurred");
        }
    };

    const handleDelete = async (roomTypeId) => {
        try {
            await deleteRoomType(roomTypeId);
            message.success("Room type deleted successfully");
            loadRoomTypes(selectedBoardingHouse);
        } catch (err) {
            message.error(err.message || "Failed to delete room type");
        }
    };

    const columns = [
        {
            title: "Room Type Name",
            dataIndex: "typeName",
            key: "typeName",
            width: 150,
        },
        {
            title: "Price (VND)",
            dataIndex: "price",
            key: "price",
            render: (price) => `${Number(price).toLocaleString("vi-VN")} đ`,
            width: 130,
        },
        {
            title: "Room Size",
            dataIndex: "roomSize",
            key: "roomSize",
            width: 100,
        },
        {
            title: "Capacity (People)",
            dataIndex: "peopleNumber",
            key: "peopleNumber",
            width: 120,
            render: (num) => `${num} people`,
        },
        {
            title: "Image",
            key: "image",
            render: (_, record) =>
                record.image?.imageUrl ? (
                    <img
                        src={record.image.imageUrl}
                        alt={record.typeName}
                        style={{
                            width: 60,
                            height: 60,
                            objectFit: "cover",
                            borderRadius: 4,
                        }}
                    />
                ) : (
                    <Tag color="default">No Image</Tag>
                ),
            width: 100,
        },
        {
            title: "Available Rooms",
            key: "availableRoom",
            dataIndex: "availableRoom",
            render: (count) => (
                <Tag color={count > 0 ? "green" : "red"}>{count} rooms</Tag>
            ),
            width: 120,
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => openEditModal(record)}
                        style={{ backgroundColor: "#1890ff" }}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete Room Type"
                        description="Are you sure you want to delete this room type?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<DeleteOutlined />} size="small">
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
            width: 150,
            fixed: "right",
        },
    ];

    return (
        <AdminLayout>
            <div className="manage-room-types-container">
                <Card
                    title="Manage Room Types"
                    className="manage-room-types__card"
                    style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
                >
                    <Row gutter={16} style={{ marginBottom: 20 }}>
                        <Col xs={24} sm={24} md={20}>
                            <Select
                                style={{ width: "100%" }}
                                placeholder="Select Boarding House"
                                value={selectedBoardingHouse}
                                onChange={handleBoardingHouseChange}
                                className="manage-room-types__select"
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
                                className="manage-room-types__btn-add"
                            >
                                Add Room Type
                            </Button>
                        </Col>
                    </Row>

                    {selectedBoardingHouse && (
                        <Table
                            rowKey="_id"
                            loading={loading}
                            columns={columns}
                            dataSource={roomTypes}
                            className="manage-room-types__table"
                            pagination={{
                                current: pagination.currentPage,
                                total: pagination.totalItems,
                                pageSize: pagination.limit,
                                onChange: (page) => loadRoomTypes(selectedBoardingHouse, page),
                            }}
                            scroll={{ x: 1200 }}
                        />
                    )}

                    {!selectedBoardingHouse && (
                        <div style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>
                            <p>Please select a boarding house to view room types</p>
                        </div>
                    )}
                </Card>

                <Modal
                    open={isModalOpen}
                    width={700}
                    title={editingRoomType ? "Edit Room Type" : "Create New Room Type"}
                    onCancel={() => setIsModalOpen(false)}
                    onOk={handleSubmit}
                    okText={editingRoomType ? "Update" : "Create"}
                    className="manage-room-types__modal"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="typeName"
                            label="Room Type Name *"
                            rules={[
                                { required: true, message: "Please enter room type name" },
                                {
                                    pattern: /^[a-zA-Z0-9 ]+$/,
                                    message: "Room type name can only contain letters, numbers, and spaces",
                                },
                            ]}
                        >
                            <Input placeholder="e.g., Single Room, Double Room, Suite" />
                        </Form.Item>

                        <Form.Item
                            name="price"
                            label="Price (VND) *"
                            rules={[
                                { required: true, message: "Please enter price" },
                                {
                                    type: "number",
                                    min: 0,
                                    message: "Price must be greater than 0",
                                },
                            ]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder="e.g., 3000000"
                            />
                        </Form.Item>

                        <Form.Item
                            name="roomSize"
                            label="Room Size"
                        >
                            <Input placeholder="e.g., 20x30, 30x40" />
                        </Form.Item>

                        <Form.Item
                            name="peopleNumber"
                            label="Capacity (Number of People)"
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder="e.g., 1, 2, 3"
                                min={1}
                            />
                        </Form.Item>

                        <Form.Item label="Room Type Image *">
                            <Upload
                                beforeUpload={() => false}
                                fileList={fileList}
                                onChange={(info) => setFileList(info.fileList)}
                                maxCount={1}
                                accept="image/*"
                            >
                                <Button icon={<UploadOutlined />}>Upload Image</Button>
                            </Upload>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </AdminLayout>
    );
};

export default ManageRoomTypes;
