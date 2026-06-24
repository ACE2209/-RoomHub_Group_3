import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
    Form,
    Input,
    Select,
    Upload,
    InputNumber,
    Image,
    Button,
    Tabs,
    ConfigProvider
} from "antd";
import {
    PlusOutlined,
    HeartFilled,
    StarFilled,
    StarOutlined,
} from "@ant-design/icons";
import {
    fetchProvinces,
    fetchDistricts,
    fetchWards,
} from "../../../api/apiAddress";
import {
    getBoardingHouseDetails,
    updateBoardingHouseDetails,
    getAllBoardingHouseTypes,
} from "../../../api/boardingHouseAPI";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import LocationPicker from "../../../component/LocationPicker/LocationPicker";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHotel } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../context/themeContext";
import coverBhType from "../../../utils/coverBhType";
import i18n from "i18next";

const BHDetailAdmin = () => {
    const { boardingHouseId } = useParams();
    const [updatedData, setUpdatedData] = useState({});
    const [loading, setLoading] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [boardingHouseTypes, setBoardingHouseTypes] = useState([]);
    const [geoLocation, setGeoLocation] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const boardingHouseName = location.state?.name || "Default Name";
    const { darkMode } = useTheme();
    const { t } = useTranslation("boardingHouseDetailsAdmin");
    const currentLanguage = i18n.language;

    const fetchBoardingHouseDetails = async () => {
        if (!boardingHouseId) {
            toast.error(t("errors.noId"));
            navigate("/admin/boarding-houses");
        }
        try {
            const response = await getBoardingHouseDetails(boardingHouseId);
            console.log("respone", response)
            if (!response?.success || !response?.data) {
                throw new Error(t("errors.fetchFailed"));
            }
            const data = response.data;
            console.log(data)

            const primaryImage = Array.isArray(data.images)
                ? data.images.find((img) => img.isPrimary)
                : null;
            console.log("test1")
            console.log(primaryImage)
            const otherImages = Array.isArray(data.images)
                ? data.images.filter((img) => !img.isPrimary)
                : [];
            console.log("test2")
            console.log(otherImages)
            setUpdatedData({
                ...data,
                primaryImage: primaryImage || null,
                otherImages: otherImages || [],
            });

            setCurrentLocation([
                data?.location?.lat || null,
                data?.location?.lon || null,
            ]);
        } catch (error) {
            console.error("Failed to fetch boarding house data:", error);
            toast.error(t("errors.fetchFailed"));
        }
    };
    useEffect(() => {
        fetchBoardingHouseDetails();
    }, []);

    useEffect(() => {
        if (updatedData?.location) return;
        if (geoLocation) {
            setCurrentLocation([geoLocation.lat, geoLocation.lon]);
        }
    }, [geoLocation]);
    useEffect(() => {
        if (!location.state?.name && !updatedData.name) {
            setUpdatedData((prev) => ({
                ...prev,
                name: t("boardingHouseDetailsAdmin.defaultName"),
            }));
        }
    }, [location.state?.name, updatedData.name]);

    useEffect(() => {
        const fetchAddressData = async () => {
            try {
                const provincesData = await fetchProvinces();
                console.log("mt", provincesData);

                setProvinces(provincesData);

                if (updatedData?.address?.province) {
                    const selectedProvince = provincesData.find(
                        (p) => p.name === updatedData.address.province
                    );
                    if (selectedProvince) {
                        const districtsData = await fetchDistricts(selectedProvince.id);
                        setDistricts(districtsData);

                        if (updatedData?.address?.district) {
                            const selectedDistrict = districtsData.find(
                                (d) => d.name === updatedData.address.district
                            );
                            if (selectedDistrict) {
                                const wardsData = await fetchWards(selectedDistrict.id);
                                setWards(wardsData);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching address data:", error);
                toast.error(t("errors.fetchAddressFailed"));
            }
        };

        if (updatedData?.address?.province) {
            fetchAddressData();
        }
    }, [updatedData?.address?.province, updatedData?.address?.district]);

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const response = await getAllBoardingHouseTypes();

                setBoardingHouseTypes(
                    response.data.map((type) => ({
                        value: type.value,
                        label: type.label,
                        code: type.code,
                    }))
                );

            } catch (error) {
                console.error("Failed to fetch boarding house types:", error);
                toast.error(t("errors.fetchBoardingHouseTypes"));
            }
        };

        fetchTypes();
    }, []);

    const handleInputChange = ({ target }) => {
        const { name, value } = target;
        setUpdatedData((prev) => {
            const newData = { ...prev };
            const keys = name.split(".");
            if (keys.length === 2) {
                newData[keys[0]][keys[1]] = value;
            } else if (keys.length === 1) {
                newData[keys[0]] = value;
            }
            return newData;
        });
    };

    const handleFileChange = (e, isPrimary = false) => {
        const file = e.target.files[0];
        if (!file) return;

        if (isPrimary) {
            setUpdatedData((prev) => ({
                ...prev,
                primaryImage: file,
            }));
            return;
        }

        if (updatedData.otherImages.length >= 15) {
            toast.error(t("errors.maxOtherImages"));
            return;
        }

        setUpdatedData((prev) => ({
            ...prev,
            otherImages: [...(prev.otherImages || []), file]
        }));
    };
    const handleRemovePrimaryImage = () => {
        setUpdatedData((prev) => ({
            ...prev,
            primaryImage: null,
        }));
    };

    const handleRemoveOtherImage = (index) => {
        setUpdatedData((prev) => {
            const updatedOtherImages = [...prev.otherImages];
            updatedOtherImages.splice(index, 1);
            return {
                ...prev,
                otherImages: updatedOtherImages,
            };
        });
        toast.success(t("messages.imageRemoved"));
    };

    const handleSelectedTypesChange = (event) => {
        const { name, value } = event.target;
        setUpdatedData((prevData) => ({
            ...prevData,
            [name]: { _id: value },
        }));
    };
    const uploadOtherImgProps = {
        beforeUpload: (file) => {
            handleFileChange({ target: { files: [file] } }, false);
            return false;
        },
        multiple: true,
        accept: "image/*",
    };
    const uploadProps = {
        beforeUpload: (file) => {
            handleFileChange({ target: { files: [file] } }, true);
            return false;
        },
        accept: "image/*",
        maxCount: 1,
        showUploadList: false,
    };

    const getLocation = async () => {
        try {
            const res = await axios.get(
                "https://nominatim.openstreetmap.org/search",
                {
                    params: {
                        format: "json",
                        q: `${updatedData.address.ward}, ${updatedData.address.district}, ${updatedData.address.province}`,
                        polygon_geojson: 1,
                    },
                }
            );
            setGeoLocation(res.data[0]);
        } catch (error) {
            console.log("Error getting location:", error);
        }
    };

    useEffect(() => {
        getLocation();
    }, [updatedData?.address?.ward]);

    const handleSubmit = async () => {
        if (!updatedData) return;

        try {
            setLoading(true);

            const payload = new FormData();
            if (!updatedData.boardingHouseType) {
                toast.error(t("validation.selectBoardingHouseType"));
                return;
            }

            if (!updatedData.name) {
                toast.error(t("validation.enterBoardingHouseName"));
                return;
            }

            if (!updatedData.address.province) {
                toast.error(t("validation.selectProvince"));
                return;
            }

            if (!updatedData.address.district) {
                toast.error(t("validation.selectDistrict"));
                return;
            }

            if (!updatedData.address.ward) {
                toast.error(t("validation.selectWard"));
                return;
            }

            if (!updatedData.address.detail) {
                toast.error(t("validation.enterDetailAddress"));
                return;
            }

            if (!updatedData.priceRange) {
                toast.error(t("validation.enterPriceRange"));
                return;
            }

            if (!updatedData.electricityPrice) {
                toast.error(t("validation.enterElectricityPrice"));
                return;
            }

            if (!updatedData.waterPrice) {
                toast.error(t("validation.enterWaterPrice"));
                return;
            }

            payload.append(
                "boardingHouseType",
                updatedData.boardingHouseType?._id || updatedData.boardingHouseType
            );
            payload.append("name", updatedData.name);
            payload.append("description", updatedData.description);
            payload.append("priceRange", updatedData.priceRange);
            payload.append("electricityPrice", updatedData.electricityPrice);
            payload.append("waterPrice", updatedData.waterPrice);
            payload.append(
                'address[province][name]',
                updatedData.address.province.name
            );
            payload.append(
                'address[province][name_en]',
                updatedData.address.province.name_en
            );

            payload.append(
                'address[district][name]',
                updatedData.address.district.name
            );
            payload.append(
                'address[district][name_en]',
                updatedData.address.district.name_en
            );

            payload.append('address[ward][name]', updatedData.address.ward.name);
            payload.append(
                'address[ward][name_en]',
                updatedData.address.ward.name_en
            );
            payload.append("address[detail]", updatedData.address.detail);
            payload.append("location[lat]", updatedData.location.lat);
            payload.append("location[lon]", updatedData.location.lon);

            const oldImg = [];

            if (updatedData.primaryImage instanceof File) {
                payload.append('boardingHouse', updatedData.primaryImage);
            } else {
                oldImg.push(updatedData.primaryImage);
            }

            (updatedData.otherImages || []).forEach((file) => {
                if (file instanceof File) {
                    payload.append('boardingHouse', file);
                } else {
                    oldImg.push(file);
                }
            });

            if (oldImg.length > 0) {
                payload.append('boardingHouse', JSON.stringify(oldImg));
            }
            console.log("payload", payload)
            const response = await updateBoardingHouseDetails(
                updatedData._id,
                payload
            );

            if (response?.success) {
                toast.success(
                    t("messages.updateSuccess")
                );
                navigate("/admin/boarding-houses");
            } else {
                toast.error(t("messages.updateFailed"));
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Failed to update the boarding house."
            );
        } finally {
            setLoading(false);
        }
    };
    if (!updatedData) {
        return null;
    }


    const themeConfig = {
        algorithm: darkMode
            ? ConfigProvider.darkAlgorithm
            : ConfigProvider.defaultAlgorithm,
        token: darkMode
            ? {
                colorText: "#ffffff",
                colorTextSecondary: "#e5e7eb",
                colorBgContainer: "#1f2937",
                colorBorder: "#4b5563",
                colorPrimary: "#3b82f6",
                colorBgElevated: "#374151",
                colorFillSecondary: "#374151",
                colorTextPlaceholder: "#9CA3AF",
                colorBorderSecondary: "#4B5563",
                controlItemBgActive: "#3b82f6",
                controlItemBgHover: "#4B5563",
            }
            : {
                colorText: "#000",
                colorTextSecondary: "#4b5563",
                colorBgContainer: "#ffffff",
                colorBorder: "#d9d9d9",
                colorPrimary: "#3b82f6",
                colorBgElevated: "#f5f5f5",
                colorFillSecondary: "#f5f5f5",
                colorTextPlaceholder: "#9CA3AF",
                colorBorderSecondary: "#d9d9d9",
                controlItemBgActive: "#e5e7eb",
                controlItemBgHover: "#f0f0f0",
            },
        components: {
            Select: {
                selectorBg: darkMode ? "#374151" : "#FFFFFF",
                colorText: darkMode ? "#F9FAFB" : "#000",
                colorBorder: darkMode ? "#4B5563" : "#d9d9d9",
                optionSelectedBg: darkMode ? "#2563eb" : "#e5e7eb",
                optionHoverBg: darkMode ? "#4B5563" : "#FFFFFF",
            },
            Input: {
                colorBgContainer: darkMode ? "#374151" : "#FFFFFF",
                colorText: darkMode ? "#F9FAFB" : "#000",
                colorBorder: darkMode ? "#4B5563" : "#d9d9d9",
                colorTextPlaceholder: darkMode ? "#9CA3AF" : "#4B5563",
            },
            Form: {
                labelColor: darkMode ? "#F9FAFB" : "#000",
            },
        },
    };
    return (
        <ConfigProvider theme={themeConfig}>
            <div className={`mx-auto w-full back rounded-xl p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'
                }`}>
                <h1 className="text-5xl flex items-center gap-2">
                    <FontAwesomeIcon icon={faHotel} className="text-gray-500 text-6xl" />
                    {updatedData.name}
                </h1>
                <Tabs defaultActiveKey="boardingHouseDetail">
                    <Tabs.TabPane tab={t("boardingHouseDetailsAdmin.title")} key="boardingHouseDetail">
                        <div className="mx-auto md:w-[100%]">
                            <Form layout="vertical" className="p-6 *:m-7">
                                <Form.Item>
                                    <div className="flex flex-wrap min-[361px]:flex-nowrap justify-between items-center w-full gap-4">
                                        <div className="flex flex-col items-start gap-2">
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: 5 }, (_, index) => {
                                                    if (index < Math.floor(updatedData.rating || 0)) {
                                                        return (
                                                            <StarFilled
                                                                key={index}
                                                                className="text-yellow-500 text-4xl"
                                                            />
                                                        );
                                                    } else {
                                                        return (
                                                            <StarOutlined
                                                                key={index}
                                                                className="text-yellow-500 text-4xl"
                                                            />
                                                        );
                                                    }
                                                })}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <HeartFilled className="text-red-500 text-4xl" />
                                                <span className="text-gray-600 text-lg">
                                                    {updatedData.likes
                                                        ? t("boardingHouseDetailsAdmin.likes", { count: Number(updatedData.likes).toLocaleString("en-US") })
                                                        : t("boardingHouseDetailsAdmin.likes", { count: 0 })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-left min-[300px]:text-right min-w-[150px]">
                                            <div>{t("boardingHouseDetailsAdmin.totalRooms")}: {updatedData.totalRooms || "0"}</div>
                                            <div>{t("boardingHouseDetailsAdmin.availableRooms")}: {updatedData.availableRooms || "0"}</div>
                                        </div>
                                    </div>
                                </Form.Item>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="flex flex-col flex-1">
                                        <h2 className="text-3xl font-bold">{t("boardingHouseDetailsAdmin.information")}</h2>
                                        <Form.Item label={t("boardingHouseDetailsAdmin.name")} className="mb-2">
                                            <Input
                                                name="name"
                                                value={updatedData.name || ""}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Item>

                                        <Form.Item label={t("boardingHouseDetailsAdmin.boardingHouseType")} className="mb-2">
                                            <Select
                                                name="boardingHouseType"
                                                value={updatedData.boardingHouseType?._id || ''}
                                                onChange={(value) =>
                                                    handleSelectedTypesChange({
                                                        target: { name: 'boardingHouseType', value },
                                                    })
                                                }
                                                className={darkMode ? "dark-mode-select" : ""}
                                            >
                                                {boardingHouseTypes.map((type) => (
                                                    <Select.Option key={type.value} value={type.value}>
                                                        {coverBhType(type.code, currentLanguage)}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <Form.Item label={t("boardingHouseDetailsAdmin.description")} className="flex-grow">
                                            <Input.TextArea
                                                name="description"
                                                value={updatedData.description || ""}
                                                onChange={handleInputChange}
                                                rows={4}
                                            />
                                        </Form.Item>
                                    </div>

                                    <div className="flex flex-col flex-1">
                                        <h2 className="text-3xl font-bold mb-4">{t("boardingHouseDetailsAdmin.price")}</h2>
                                        <Form.Item label={t("boardingHouseDetailsAdmin.priceRent")} className="mb-2">
                                            <InputNumber
                                                name="priceRange"
                                                value={updatedData.priceRange || ""}
                                                onChange={(value) =>
                                                    handleInputChange({
                                                        target: { name: "priceRange", value },
                                                    })
                                                }
                                                formatter={(value) =>
                                                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                                }
                                                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                                className="w-full"
                                                min={0}
                                            />
                                        </Form.Item>

                                        <Form.Item label={t("boardingHouseDetailsAdmin.electricityPrice")} className="mb-2">
                                            <InputNumber
                                                name="electricityPrice"
                                                value={updatedData.electricityPrice || ""}
                                                onChange={(value) =>
                                                    handleInputChange({
                                                        target: { name: "electricityPrice", value },
                                                    })
                                                }
                                                formatter={(value) =>
                                                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                                }
                                                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                                className="w-full"
                                                min={0}
                                            />
                                        </Form.Item>

                                        <Form.Item label={t("boardingHouseDetailsAdmin.waterPrice")} className="mb-2 flex-grow">
                                            <InputNumber
                                                name="waterPrice"
                                                value={updatedData.waterPrice || ""}
                                                onChange={(value) =>
                                                    handleInputChange({
                                                        target: { name: "waterPrice", value },
                                                    })
                                                }
                                                formatter={(value) =>
                                                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                                }
                                                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                                className="w-full"
                                                min={0}
                                            />
                                        </Form.Item>
                                    </div>
                                </div>

                                <h2 className="text-3xl font-bold mb-4 mt-10">{t("boardingHouseDetailsAdmin.image")}</h2>
                                <Form.Item label={t("boardingHouseDetailsAdmin.primaryImage")} className="mb-4">
                                    <div className="flex flex-col gap-4">
                                        {updatedData.primaryImage ? (
                                            <div className="relative">
                                                <Image
                                                    src={updatedData?.primaryImage?.imageUrl ||
                                                        URL.createObjectURL(updatedData.primaryImage)}
                                                    alt="Primary"
                                                    className="object-cover border rounded"
                                                    style={{
                                                        width: "100%",
                                                        height: "auto",
                                                        maxHeight: "300px",
                                                    }}
                                                    preview={{
                                                        mask: <span className="text-white">{t("boardingHouseDetailsAdmin.preview")}</span>,
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleRemovePrimaryImage}
                                                    className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10"
                                                >
                                                </button>
                                            </div>
                                        ) : (
                                            <Upload
                                                {...uploadProps}
                                                listType="picture-card"
                                                showUploadList={false}
                                                className="custom-upload"
                                                name="boardingHouse"
                                            >
                                                <div className="border border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-gray-50 transition">
                                                    <PlusOutlined className="text-2xl text-gray-400" />
                                                </div>
                                            </Upload>
                                        )}
                                    </div>
                                </Form.Item>

                                <Form.Item label={t("boardingHouseDetailsAdmin.otherImages")} className="mb-4">
                                    <div className="mt-4 flex flex-wrap gap-4">
                                        {updatedData.otherImages?.map((file, index) => (
                                            <div key={index} className="relative group">
                                                <Image
                                                    src={file?.imageUrl || URL.createObjectURL(file)}
                                                    alt={`Other Image ${index + 1}`}
                                                    className="object-cover border border-gray-200 rounded-lg transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                                                    width={100}
                                                    height={100}
                                                    preview={{
                                                        mask: <span className="text-white">{t("boardingHouseDetailsAdmin.preview")}</span>,
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveOtherImage(index)}
                                                    className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                >
                                                    {t("boardingHouseDetailsAdmin.delete")}
                                                </button>
                                            </div>
                                        ))}

                                        {updatedData.otherImages?.length < 15 && (
                                            <Upload
                                                {...uploadOtherImgProps}
                                                listType="picture-card"
                                                showUploadList={false}
                                                className="custom-upload"
                                                name="boardingHouse"
                                            >
                                                <div className="rounded-lg p-6 hover:border-blue-500 hover:bg-gray-50 transition">
                                                    <PlusOutlined className="text-2xl text-gray-400" />
                                                </div>
                                            </Upload>
                                        )}
                                    </div>
                                </Form.Item>

                                <h2 className="text-3xl font-bold mb-4 mt-10">{t("boardingHouseDetailsAdmin.address")}</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="flex flex-col h-full">
                                        <Form.Item
                                            label={t("boardingHouseDetailsAdmin.selectProvince")}
                                            required
                                            rules={[{ required: true, message: t("boardingHouseDetailsAdmin.validation.selectProvince") }]}
                                            className="mb-4"
                                        >
                                            <Select
                                                placeholder={t("boardingHouseDetailsAdmin.selectProvince")}
                                                value={updatedData?.address?.province?.id || null}
                                                onChange={(id) => {
                                                    const selected = provinces.find((p) => p.id === id);
                                                    if (selected) {
                                                        const fullProvince = {
                                                            id: selected.id,
                                                            name: selected.name,
                                                            name_en: selected.name_en,
                                                        };

                                                        handleInputChange({
                                                            target: {
                                                                name: "address.province",
                                                                value: fullProvince,
                                                            },
                                                        });

                                                        setUpdatedData((prev) => ({
                                                            ...prev,
                                                            address: {
                                                                ...prev.address,
                                                                province: fullProvince,
                                                                district: null,
                                                                ward: null,
                                                            },
                                                        }));

                                                        fetchDistricts(selected.id).then(setDistricts);
                                                    }
                                                }}
                                                allowClear
                                            >
                                                {provinces.map((province) => (
                                                    <Select.Option key={province.id} value={province.id}>
                                                        {currentLanguage === "vi" ? province.name : province.name_en}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            label={t("boardingHouseDetailsAdmin.selectDistrict")}
                                            required
                                            rules={[{ required: true, message: t("boardingHouseDetailsAdmin.validation.selectDistrict") }]}
                                        >
                                            <Select
                                                placeholder={t("boardingHouseDetailsAdmin.selectDistrict")}
                                                value={updatedData?.address?.district?.id || null}
                                                onChange={(id) => {
                                                    const selected = districts.find((d) => d.id === id);
                                                    if (selected) {
                                                        const fullDistrict = {
                                                            id: selected.id,
                                                            name: selected.name,
                                                            name_en: selected.name_en,
                                                        };

                                                        handleInputChange({
                                                            target: {
                                                                name: "address.district",
                                                                value: fullDistrict,
                                                            },
                                                        });

                                                        setUpdatedData((prev) => ({
                                                            ...prev,
                                                            address: {
                                                                ...prev.address,
                                                                district: fullDistrict,
                                                                ward: null,
                                                            },
                                                        }));

                                                        fetchWards(selected.id).then(setWards);
                                                    }
                                                }}

                                                disabled={!updatedData?.address?.province}
                                                allowClear
                                            >
                                                {districts.map((district) => (
                                                    <Select.Option key={district.id} value={district.id}>
                                                        {currentLanguage === "vi" ? district.name : district.name_en}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            label={t("boardingHouseDetailsAdmin.selectWard")}
                                            required
                                            rules={[{ required: true, message: t("boardingHouseDetailsAdmin.validation.selectWard") }]}
                                        >
                                            <Select
                                                placeholder={t("boardingHouseDetailsAdmin.selectWard")}
                                                value={updatedData?.address?.ward?.id || null}
                                                onChange={(id) => {
                                                    const selected = wards.find((w) => w.id === id);
                                                    if (selected) {
                                                        const fullWard = {
                                                            id: selected.id,
                                                            name: selected.name,
                                                            name_en: selected.name_en,
                                                        };

                                                        handleInputChange({
                                                            target: {
                                                                name: "address.ward",
                                                                value: fullWard,
                                                            },
                                                        });

                                                        setUpdatedData((prev) => ({
                                                            ...prev,
                                                            address: {
                                                                ...prev.address,
                                                                ward: fullWard,
                                                            },
                                                        }));
                                                    }
                                                }}

                                                disabled={!updatedData?.address?.district}
                                                allowClear
                                            >
                                                {wards.map((ward) => (
                                                    <Select.Option key={ward.id} value={ward.id}>
                                                        {currentLanguage === "vi" ? ward.name : ward.name_en}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <Form.Item label={t("boardingHouseDetailsAdmin.detail")}
                                            required
                                            rules={[
                                                { required: true, message: "Details is required" },
                                            ]}
                                        >
                                            <Input.TextArea
                                                name="address.detail"
                                                value={updatedData?.address?.detail || ""}
                                                onChange={handleInputChange}
                                                rows={4}
                                            />
                                        </Form.Item>
                                    </div>

                                    <div className="order-2 lg:order-1 h-full">
                                        <LocationPicker
                                            className="h-full min-h-[500px] w-full"
                                            geoJson={geoLocation?.geojson}
                                            initialPosition={currentLocation ?? null}
                                            onChange={(lat, lon) => {
                                                setUpdatedData((prev) => ({
                                                    ...prev,
                                                    location: { lat, lon },
                                                }));
                                                setGeoLocation({ lat, lon });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4 w-full md:mt-4">
                                    <Button
                                        className="bg-red-500 text-white flex-1"
                                        size="large"
                                        onClick={() => navigate("/admin/boarding-houses")}
                                        title={t("boardingHouseDetailsAdmin.back")}
                                    >
                                        {t("boardingHouseDetailsAdmin.back")}
                                    </Button>

                                    <Button
                                        className="bg-primary text-white flex-1"
                                        size="large"
                                        loading={loading}
                                        onClick={handleSubmit}
                                        title={t("boardingHouseDetailsAdmin.update")}
                                    >
                                        {t("boardingHouseDetailsAdmin.update")}
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </ConfigProvider>
    )
};

export default BHDetailAdmin;
