import React, { useEffect, useMemo, useState } from "react";
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
    Tag,
} from "antd";

import { PlusOutlined } from "@ant-design/icons";

import {
    createRoomAdditionFee,
    updateRoomAdditionFee,
    deleteRoomAdditionFee,
    getRoomAdditionFeesByRoomId,
    getAllRoomAdditionFees,
    getRoomAdditionFeeNameOptions,
} from "../../api/ownerandstaff/roomAdditionFeeAPI";

import { getOwnBoardingHouses } from "../../api/boardingHouse";
import { getRoomsByBoardingHouse } from "../../api/room";

import AdminLayout from "../layout/admin/AdminLayout";
import "./ManageRoomAdditionalFees.css";

const { Option, OptGroup } = Select;

const CUSTOM_FEE_VALUE = "Khác";


const DEFAULT_FEE_NAME_OPTIONS = [
    {
        group: "Phí dịch vụ",
        options: [
            { value: "Internet", label: "Internet" },
            { value: "Truyền hình cáp", label: "Truyền hình cáp" },
            { value: "Phí vệ sinh", label: "Phí vệ sinh" },
            { value: "Phí thang máy", label: "Phí thang máy" },
        ],
    },
    {
        group: "Phí tiện ích",
        options: [{ value: "Phí gửi xe", label: "Phí gửi xe (bãi đậu xe)" }],
    },
    {
        group: "Phí sử dụng vượt định mức",
        options: [
            { value: "Phí điện vượt định mức", label: "Phí điện vượt định mức" },
            { value: "Phí nước vượt định mức", label: "Phí nước vượt định mức" },
        ],
    },
    {
        group: "Phí phạt",
        options: [
            { value: "Phí phạt đóng trễ", label: "Phí phạt đóng tiền muộn" },
            {
                value: "Phí bồi thường hư hỏng",
                label: "Phí bồi thường hư hỏng tài sản",
            },
        ],
    },
    {
        group: "Khác",
        options: [
            {
                value: CUSTOM_FEE_VALUE,
                label: "Khác (tự nhập tên phí)",
                isCustom: true,
            },
        ],
    },
];

const ManageRoomAdditionalFees = () => {
    const [loading, setLoading] = useState(false);
    const [boardingHouses, setBoardingHouses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedBoardingHouse, setSelectedBoardingHouse] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [fees, setFees] = useState([]);

    const [feeNameOptions, setFeeNameOptions] = useState(
        DEFAULT_FEE_NAME_OPTIONS
    );

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 10,
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFee, setEditingFee] = useState(null);
    const [isCustomFeeName, setIsCustomFeeName] = useState(false);
    const [form] = Form.useForm();

    const knownFeeNameValues = useMemo(() => {
        const values = new Set();
        feeNameOptions.forEach((group) => {
            group.options.forEach((opt) => values.add(opt.value));
        });
        return values;
    }, [feeNameOptions]);

    useEffect(() => {
        loadBoardingHouses();
        loadAllFees();
        loadFeeNameOptions();
    }, []);

    const loadFeeNameOptions = async () => {
        try {
            const res = await getRoomAdditionFeeNameOptions();
            if (res?.success && Array.isArray(res.data) && res.data.length) {
                setFeeNameOptions(res.data);
            }
        } catch (err) {
            console.warn("Failed to load fee name options, using defaults:", err);
        }
    };

    const loadBoardingHouses = async () => {
        try {
            const res = await getOwnBoardingHouses({ page: 1, limit: 100 });
            setBoardingHouses(res.data || []);
        } catch (err) {
            message.error(err.message || "Failed to load boarding houses");
        }
    };

    const loadRooms = async (boardingHouseId) => {
        try {
            const res = await getRoomsByBoardingHouse(boardingHouseId);
            setRooms(res.data || []);
        } catch (err) {
            message.error(err.message || "Failed to load rooms");
        }
    };

    const loadAllFees = async () => {
        try {
            setLoading(true);
            const res = await getAllRoomAdditionFees();
            setFees(res || []);
            setPagination({
                currentPage: 1,
                totalPages: 1,
                totalItems: res?.length || 0,
                limit: 10,
            });
        } catch (err) {
            console.error(err);
            message.error("Failed to load fees");
        } finally {
            setLoading(false);
        }
    };

    const loadFees = async (roomId, page = 1) => {
        try {
            setLoading(true);
            const params = { page, limit: 10 };
            const res = await getRoomAdditionFeesByRoomId(roomId, params);

            if (res && res.data) {
                setFees(res.data);
                setPagination(
                    res.pagination || {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: res.data.length,
                        limit: 10,
                    }
                );
            } else if (Array.isArray(res)) {
                setFees(res);
                setPagination({
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: res.length,
                    limit: 10,
                });
            } else {
                setFees([]);
                setPagination({});
            }
        } catch (err) {
            console.error("Error loading fees:", err);
            message.error(err.message || "Failed to load fees");
            setFees([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBoardingHouseChange = async (value) => {
        setSelectedBoardingHouse(value);
        setSelectedRoom(null);
        setRooms([]);
        await loadRooms(value);
        await loadAllFees();
    };

    const handleRoomChange = async (roomId) => {
        setSelectedRoom(roomId);
        await loadFees(roomId);
    };

    const openCreateModal = () => {
        if (!selectedRoom) {
            return message.warning("Please select a room first");
        }

        setEditingFee(null);
        setIsCustomFeeName(false);
        form.resetFields();
        form.setFieldsValue({
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
        });
        setIsModalOpen(true);
    };

    const openEditModal = (record) => {
        setEditingFee(record);
        const matchesKnownOption = knownFeeNameValues.has(record.feeName);

        setIsCustomFeeName(!matchesKnownOption);

        form.setFieldsValue({
            feeNameOption: matchesKnownOption ? record.feeName : CUSTOM_FEE_VALUE,
            customFeeName: matchesKnownOption ? undefined : record.feeName,
            feeAmount: record.feeAmount,
            month: record.month,
            year: record.year,
        });

        setIsModalOpen(true);
    };

    const handleFeeNameOptionChange = (value) => {
        setIsCustomFeeName(value === CUSTOM_FEE_VALUE);
        if (value !== CUSTOM_FEE_VALUE) {
            form.setFieldsValue({ customFeeName: undefined });
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const feeName =
                values.feeNameOption === CUSTOM_FEE_VALUE
                    ? (values.customFeeName || "").trim()
                    : values.feeNameOption;

            const payload = {
                feeName,
                feeAmount: values.feeAmount,
                month: values.month,
                year: values.year,
            };

            if (editingFee) {
                await updateRoomAdditionFee(editingFee._id, payload);
                message.success("Fee updated successfully");
            } else {
                await createRoomAdditionFee({
                    roomId: selectedRoom,
                    ...payload,
                });
                message.success("Fee created successfully");
            }

            setIsModalOpen(false);
            form.resetFields();

            if (selectedRoom) {
                await loadFees(selectedRoom, pagination.currentPage);
            } else {
                await loadAllFees();
            }
        } catch (err) {
            if (err?.errorFields) {
                return;
            }
            console.error("Error:", err);
            message.error(err.message || "An error occurred");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteRoomAdditionFee(id);
            message.success("Fee deleted successfully");
            if (selectedRoom) {
                await loadFees(selectedRoom, pagination.currentPage);
            } else {
                await loadAllFees();
            }
        } catch (err) {
            message.error(err.message || "Failed to delete fee");
        }
    };

    const columns = [
        {
            title: "Fee Name",
            dataIndex: "feeName",
            key: "feeName",
            render: (value) => <Tag color="orange">{value}</Tag>,
        },
        {
            title: "Amount",
            dataIndex: "feeAmount",
            key: "feeAmount",
            render: (value) =>
                Number(value).toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                }),
        },
        {
            title: "Month",
            dataIndex: "month",
            key: "month",
            width: 80,
        },
        {
            title: "Year",
            dataIndex: "year",
            key: "year",
            width: 80,
        },
        {
            title: "Room",
            key: "room",
            render: (_, record) => record.roomId?.roomNumber || "N/A",
            width: 100,
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
                        className="manage-fees__btn-edit"
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete Fee"
                        description="Are you sure you want to delete this fee?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger size="small" className="manage-fees__btn-delete">
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <div className="manage-fees-container">
                <Card
                    title="Manage Room Additional Fees"
                    className="manage-fees__card"
                    style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
                >
                    <Row gutter={16} style={{ marginBottom: 20 }}>
                        <Col xs={24} sm={24} md={8}>
                            <Select
                                style={{ width: "100%" }}
                                placeholder="Select Boarding House"
                                value={selectedBoardingHouse}
                                onChange={handleBoardingHouseChange}
                                className="manage-fees__select"
                            >
                                {boardingHouses.map((item) => (
                                    <Option key={item._id} value={item._id}>
                                        {item.name || item.boardingHouseName || item.title}
                                    </Option>
                                ))}
                            </Select>
                        </Col>

                        <Col xs={24} sm={24} md={8}>
                            <Select
                                style={{ width: "100%" }}
                                placeholder="Select Room"
                                value={selectedRoom}
                                onChange={handleRoomChange}
                                className="manage-fees__select"
                                disabled={!selectedBoardingHouse}
                            >
                                {rooms.map((room) => (
                                    <Option key={room._id} value={room._id}>
                                        Room {room.roomNumber}
                                    </Option>
                                ))}
                            </Select>
                        </Col>

                        <Col xs={24} sm={24} md={8}>
                            <Button
                                type="primary"
                                block
                                icon={<PlusOutlined />}
                                onClick={openCreateModal}
                                className="manage-fees__btn-add"
                            >
                                Add Fee
                            </Button>
                        </Col>
                    </Row>

                    <Table
                        rowKey="_id"
                        loading={loading}
                        columns={columns}
                        dataSource={fees}
                        className="manage-fees__table"
                        locale={{ emptyText: "No fees found" }}
                        pagination={{
                            current: pagination.currentPage,
                            total: pagination.totalItems,
                            pageSize: pagination.limit,
                            onChange: (page) => {
                                if (selectedRoom) {
                                    loadFees(selectedRoom, page);
                                }
                            },
                        }}
                    />
                </Card>

                <Modal
                    open={isModalOpen}
                    width={700}
                    title={editingFee ? "Update Additional Fee" : "Create Additional Fee"}
                    onCancel={() => setIsModalOpen(false)}
                    onOk={handleSubmit}
                    okText={editingFee ? "Update" : "Create"}
                    className="manage-fees__modal"
                    destroyOnClose
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="feeNameOption"
                            label="Fee Name"
                            extra="Tên phí phải là duy nhất trong cùng một phòng theo tháng/năm."
                            rules={[{ required: true, message: "Please select a fee name" }]}
                        >
                            <Select
                                placeholder="Chọn loại phí"
                                onChange={handleFeeNameOptionChange}
                            >
                                {feeNameOptions.map((group) => (
                                    <OptGroup key={group.group} label={group.group}>
                                        {group.options.map((opt) => (
                                            <Option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </Option>
                                        ))}
                                    </OptGroup>
                                ))}
                            </Select>
                        </Form.Item>

                        {isCustomFeeName && (
                            <Form.Item
                                name="customFeeName"
                                label="Tên phí (tự nhập)"
                                rules={[
                                    { required: true, message: "Please enter fee name" },
                                    { whitespace: true, message: "Fee name cannot be blank" },
                                ]}
                            >
                                <Input placeholder="e.g., Phí Wifi tầng trệt" />
                            </Form.Item>
                        )}

                        <Form.Item
                            name="feeAmount"
                            label="Fee Amount (VND)"
                            rules={[{ required: true, message: "Please enter fee amount" }]}
                        >
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                placeholder="0"
                                formatter={(value) =>
                                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                }
                                parser={(value) => value?.replace(/\$\s?|(,*)/g, "")}
                            />
                        </Form.Item>

                        <Form.Item
                            name="month"
                            label="Month"
                            rules={[{ required: true, message: "Please select month" }]}
                        >
                            <InputNumber
                                min={1}
                                max={12}
                                style={{ width: "100%" }}
                                placeholder="1-12"
                            />
                        </Form.Item>

                        <Form.Item
                            name="year"
                            label="Year"
                            rules={[{ required: true, message: "Please enter year" }]}
                        >
                            <InputNumber
                                min={2024}
                                style={{ width: "100%" }}
                                placeholder={new Date().getFullYear()}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </AdminLayout>
    );
};

export default ManageRoomAdditionalFees;
