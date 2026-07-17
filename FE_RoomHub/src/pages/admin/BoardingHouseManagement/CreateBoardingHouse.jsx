import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import AddressSelector from "../../../component/AddressSelector";
import {
  getAllBoardingHouseTypes,
  createBoardingHouse,
} from "../../../api/boardingHouseAPI";
import {
  fetchProvinces,
  fetchDistricts,
  fetchWards,
} from "../../../api/apiAddress";
import { Button } from "../../../component";
import { Form, Input, Select, Upload, InputNumber, Image, ConfigProvider } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";
import coverBhType from "../../../utils/coverBhType";
import i18n from "i18next";
import classNames from 'classnames';

function AddBoardingHouseForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    owner: "",
    boardingHouseType: "",
    name: "",
    address: {
      province: "",
      district: "",
      ward: "",
      detail: "",
    },
    description: "",
    primaryImage: null,
    otherImages: [],
    priceRange: "",
    electricityPrice: "",
    waterPrice: "",
  });

  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [boardingHouseTypes, setBoardingHouseTypes] = useState([]);
  const [geoLocation, setGeoLocation] = useState(null);
  // Form luôn dùng giao diện sáng để đồng bộ với các trang quản lý khác trong admin.
  const darkMode = false;
  const { t } = useTranslation("addBoardingHouseAdmin");
  const currentLanguage = i18n.language;
  const cx = classNames;
  const lang = i18n.language || 'vi';

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
  const handleRemovePrimaryImage = () => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      primaryImage: null,
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const provincesData = await fetchProvinces();
        setProvinces(provincesData);

        if (formData?.address?.province) {
          const selectedProvince = provincesData.find(
            (p) => p.name === formData.address.province
          );
          if (selectedProvince) {
            const districtsData = await fetchDistricts(selectedProvince.id);
            setDistricts(districtsData);
            setWards([]);
            if (formData?.address?.district) {
              const selectedDistrict = districtsData.find(
                (d) => d.name === formData.address.district
              );
              if (selectedDistrict) {
                const wardsData = await fetchWards(selectedDistrict.id);
                setWards(wardsData);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [formData?.address?.province, formData?.address?.district]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split(".");
    if (keys.length === 2) {
      setFormData((prev) => ({
        ...prev,
        [keys[0]]: { ...prev[keys[0]], [keys[1]]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  const fetchBoardingHouseTypes = async () => {
    try {
      const response = await getAllBoardingHouseTypes();
      setBoardingHouseTypes(response.data || []);
    } catch (error) {
      console.error("Failed to fetch boarding house types:", error);
      toast.error(t("errors.fetchBoardingHouseTypesFailed"));
    }
  };

  useEffect(() => {
    fetchBoardingHouseTypes();
  }, []);

  const getLocation = async () => {
    try {
      const res = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            format: "json",
            q: `${formData.address.ward}, ${formData.address.district}, ${formData.address.province}`,
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
  }, [formData?.address?.ward]);

  const handleFileChange = (e, isPrimary = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (isPrimary) {
      setFormData((prev) => ({ ...prev, primaryImage: file }));
    } else {
      setFormData((prev) => ({
        ...prev,
        otherImages: [...prev.otherImages, file],
      }));
    }
  };

  const handleRemoveOtherImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      otherImages: prev.otherImages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Form Data:", formData);
    if (!formData.owner) {
      toast.error(t("validation.enterName"));
      return;
    }
    if (!formData.boardingHouseType) {
      toast.error(t("validation.selectBoardingHouseType"));
      return;
    }
    if (!formData.name) {
      toast.error(t("validation.enterBoardingHouseName"));
      return;
    }
    if (!formData.address.province) {
      toast.error(t("validation.selectProvince"));
      return;
    }
    if (!formData.address.district) {
      toast.error(t("validation.selectDistrict"));
      return;
    }
    if (!formData.address.ward) {
      toast.error(t("validation.selectWard"));
      return;
    }
    if (!formData.address.detail) {
      toast.error(t("validation.enterDetailAddress"));
      return;
    }

    const allImages = [];
    if (formData.primaryImage) allImages.push(formData.primaryImage);
    if (formData.otherImages.length > 15) {
      toast.error(t("validation.maxOtherImages"));
      return;
    }
    allImages.push(...formData.otherImages);
    if (allImages.length === 0) {
      toast.error(t("validation.uploadPrimaryImage"));
      return;
    }
    let form = {
      ownerUsername: formData.owner,
      boardingHouseType: formData.boardingHouseType,
      name: formData.name,
      address: formData.address,
      description: formData.description,
      priceRange: formData.priceRange,
      electricityPrice: formData.electricityPrice,
      waterPrice: formData.waterPrice,
      location: {
        lat: geoLocation?.lat,
        lon: geoLocation?.lon,
      },
    };
    console.log("test: ", form);
    allImages.forEach((file, index) => {
      form = { ...form, boardingHouse: file }
    });
    setLoading(true);
    try {
      await createBoardingHouse(form);
      toast.success(t("messages.createdSuccess"));
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create boarding house:", error);
      toast.error(
        t("errors.createFailed")
      );
    } finally {
      setGeoLocation(null);
      setLoading(false);
    }
  };
  const handleProvinceChange = async (provinceId) => {
    const selectedProvince = provinces.find((p) => p.id === provinceId);
    if (selectedProvince) {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          province: {
            id: selectedProvince.id,
            name: selectedProvince.name,
            name_en: selectedProvince.name_en,
          },
          district: "",
          ward: "",
        },
      }));
      const districtsData = await fetchDistricts(provinceId);
      setDistricts(districtsData);
      setWards([]);
    }
  };

  const handleDistrictChange = async (districtId) => {
    const selectedDistrict = districts.find((d) => d.id === districtId);
    if (selectedDistrict) {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          district: {
            id: selectedDistrict.id,
            name: selectedDistrict.name,
            name_en: selectedDistrict.name_en,
          },
          ward: "",
        },
      }));
      const wardsData = await fetchWards(districtId);
      setWards(wardsData);
    }
  };

  const handleWardChange = (wardId) => {
    const selectedWard = wards.find((w) => w.id === wardId);
    if (selectedWard) {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          ward: {
            id: selectedWard.id,
            name: selectedWard.name,
            name_en: selectedWard.name_en,
          },
        },
      }));
    }
  };


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
      <div
        className={`fixed inset-0 ${darkMode ? "bg-gray-900 bg-opacity-90" : "bg-black bg-opacity-50"
          } flex items-center justify-center z-50`}
        style={{
          backgroundColor: darkMode ? "rgba(17,24,39,0.9)" : "rgba(0,0,0,0.5)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <Form
          layout="vertical"
          onSubmitCapture={handleSubmit}
          className={`p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lg ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`}
          style={{
            backgroundColor: darkMode ? "#1f2937" : "#ffffff",
            color: darkMode ? "#F9FAFB" : "#111827",
          }}
        >
          <h2
            className={`text-4xl font-bold mb-8 ${darkMode ? "text-gray-200" : "text-gray-900"
              }`}
          >
            {t("addBoardingHouseAdmin.title")}
          </h2>
          <h2
            className={`text-3xl font-bold mb-4 ${darkMode ? "text-gray-300" : "text-gray-800"
              }`}
          >
            {t("addBoardingHouseAdmin.ownerSection")}
          </h2>

          <Form.Item
            label={t("addBoardingHouseAdmin.owner")}
            name="owner"
            rules={[
              { required: true, message: t("addBoardingHouseAdmin.fieldRequired") },
            ]}
            className="mb-2"
          >
            <Input
              placeholder={t("addBoardingHouseAdmin.ownerPlaceholder")}
              name="owner"
              value={formData.owner}
              onChange={handleInputChange}
              style={{
                backgroundColor: darkMode ? "#374151" : "#ffffff",
                color: darkMode ? "#F9FAFB" : "#000000",
                borderColor: darkMode ? "#4B5563" : "#d9d9d9",
              }}
            />
          </Form.Item>

          <Form.Item
            label={t("addBoardingHouseAdmin.boardingHouseType")}
            name="boardingHouseType"
            rules={[
              { required: true, message: t("addBoardingHouseAdmin.fieldRequired") },
            ]}
            className="mb-2"
          >
            <Select
              placeholder={t("addBoardingHouseAdmin.boardingHouseTypePlaceholder")}
              value={formData.boardingHouseType}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, boardingHouseType: value }))
              }
              style={{
                backgroundColor: darkMode ? "#374151" : "#ffffff",
                color: darkMode ? "#F9FAFB" : "#000000",
                borderColor: darkMode ? "#4B5563" : "#d9d9d9",
              }}
            >
              {boardingHouseTypes.map((type) => (
                <Select.Option key={type.value} value={type.value}>
                  {coverBhType(type.code, currentLanguage)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t("addBoardingHouseAdmin.name")}
            name="name"
            rules={[
              { required: true, message: t("addBoardingHouseAdmin.fieldRequired") },
            ]}
            className="mb-2"
          >
            <Input
              placeholder={t("addBoardingHouseAdmin.namePlaceholder")}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              style={{
                backgroundColor: darkMode ? "#374151" : "#ffffff",
                color: darkMode ? "#F9FAFB" : "#000000",
                borderColor: darkMode ? "#4B5563" : "#d9d9d9",
              }}
            />
          </Form.Item>

          <Form.Item
            label={t("addBoardingHouseAdmin.description")}
            name="description"
            className="mb-2"
          >
            <Input.TextArea
              placeholder={t("addBoardingHouseAdmin.descriptionPlaceholder")}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              style={{
                backgroundColor: darkMode ? "#374151" : "#ffffff",
                color: darkMode ? "#F9FAFB" : "#000000",
                borderColor: darkMode ? "#4B5563" : "#d9d9d9",
              }}
            />
          </Form.Item>

          <h2
            className={`text-3xl font-bold mb-4 mt-10 ${darkMode ? "text-gray-300" : "text-gray-800"
              }`}
          >
            {t("addBoardingHouseAdmin.addressSection")}
          </h2>
          <AddressSelector
            provinces={provinces}
            districts={districts}
            wards={wards}
            onProvinceChange={handleProvinceChange}
            onDistrictChange={handleDistrictChange}
            onWardChange={handleWardChange}
            onInputChange={handleInputChange}
            formData={formData}
          />

          <h2
            className={`text-3xl font-bold mb-4 mt-10 ${darkMode ? "text-gray-300" : "text-gray-800"
              }`}
          >
            {t("addBoardingHouseAdmin.imageSection")}
          </h2>
          <Form.Item label={t("addBoardingHouseAdmin.primaryImage")} className="mb-4">
            <div className="flex flex-col gap-4">
              {!formData.primaryImage && (
                <Upload
                  {...uploadProps}
                  listType="picture-card"
                  showUploadList={false}
                  className="custom-upload w-full max-w-lg"
                >
                  <div
                    className={cx(
                      'flex flex-col items-center justify-center border border-dashed rounded-lg p-6 transition',
                      {
                        'border-gray-300 hover:border-blue-500 hover:bg-gray-50 text-gray-500':
                          !darkMode,
                        'border-gray-600 hover:border-blue-600 hover:bg-gray-700 text-white':
                          darkMode,
                      }
                    )}
                  >
                    <PlusOutlined className="text-2xl" />
                    <p
                      className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                    >
                      {t("addBoardingHouseAdmin.addPrimaryImage")}
                    </p>
                    <p
                      className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                    >
                      {t("addBoardingHouseAdmin.dragDrop")}
                    </p>
                  </div>
                </Upload>
              )}

              {formData.primaryImage && (
                <div className="relative">
                  <Image
                    src={URL.createObjectURL(formData.primaryImage)}
                    alt="Primary"
                    className="object-cover border rounded"
                    style={{
                      width: "100%",
                      height: "auto",
                      maxHeight: "298px",
                    }}
                    preview={{
                      mask: (
                        <span
                          className={`text-white bg-opacity-50 bg-black p-1`}
                        >
                          {t("addBoardingHouseAdmin.preview")}
                        </span>
                      ),
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemovePrimaryImage}
                    className="absolute top-2 right-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full z-10 shadow-lg"
                  >
                    X
                  </button>
                </div>
              )}
            </div>
          </Form.Item>
          <Form.Item label={<span>{t("otherImagesLabel")}</span>} className="mb-4">
            <div className="mt-4 flex flex-wrap gap-4">
              {formData.otherImages.map((file, index) => (
                <div key={index} className="relative">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`Other ${index + 1}`}
                    className="object-cover border rounded"
                    width={100}
                    height={100}
                    preview={{
                      mask: <span>{t("addBoardingHouseAdmin.preview")}</span>,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOtherImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10"
                  >
                    X
                  </button>
                </div>
              ))}

              <Upload
                {...uploadOtherImgProps}
                listType="picture-card"
                showUploadList={false}
                className="custom-upload"
              >
                <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-gray-50 transition">
                  <PlusOutlined className="text-2xl text-gray-400" />
                  <p className="text-gray-500 mt-2 text-sm font-medium">
                    {t("addBoardingHouseAdmin.addOtherImages")}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {t("addBoardingHouseAdmin.dragDrop")}
                  </p>
                </div>
              </Upload>
            </div>
            <style>
              {`
                        .custom-upload .ant-upload
                        {
                        border: none !important;
                        background: none !important;
                        padding: 0 !important;
                        }
                    `}
            </style>
          </Form.Item>
          <h2 className="text-3xl font-bold mb-4 mt-10">{t("addBoardingHouseAdmin.priceSection")}</h2>
          <Form.Item
            label={t("addBoardingHouseAdmin.priceRent")}
            name="priceRange"
            rules={[
              { required: true, message: t("addBoardingHouseAdmin.fieldRequired") },
            ]}
            className="mb-2"
          >
            <InputNumber
              placeholder={t("addBoardingHouseAdmin.enterPriceRent")}
              name="priceRange"
              value={formData.priceRange}
              onChange={(value) =>
                handleInputChange({ target: { name: "priceRange", value } })
              }
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              className="w-full"
              min={0}
            />
          </Form.Item>

          <Form.Item
            label={t("addBoardingHouseAdmin.electricityPrice")}
            name="electricityPrice"
            rules={[
              { required: true, message: t("addBoardingHouseAdmin.fieldRequired") },
            ]}
            className="mb-2"
          >
            <InputNumber
              placeholder={t("addBoardingHouseAdmin.enterElectricityPrice")}
              name="electricityPrice"
              value={formData.electricityPrice}
              onChange={(value) =>
                handleInputChange({ target: { name: "electricityPrice", value } })
              }
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              className="w-full"
              min={0}
            />
          </Form.Item>

          <Form.Item
            label={t("addBoardingHouseAdmin.waterPrice")}
            name="waterPrice"
            rules={[
              { required: true, message: t("addBoardingHouseAdmin.fieldRequired") },
            ]}
            className="mb-2"
          >
            <InputNumber
              placeholder={t("addBoardingHouseAdmin.enterWaterPrice")}
              name="waterPrice"
              value={formData.waterPrice}
              onChange={(value) =>
                handleInputChange({ target: { name: "waterPrice", value } })
              }
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              className="w-full"
              min={0}
            />
          </Form.Item>

          <div className="flex justify-end mt-4">
            <Button
              title={t("addBoardingHouseAdmin.cancel")}
              btnCancel={true}
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white mr-2"
              size="large"
            >
              {t("addBoardingHouseAdmin.cancel")}
            </Button>
            <Button
              className="bg-primary w-full text-white ml-2"
              size="large"
              onClick={handleSubmit}
              title={t("addBoardingHouseAdmin.submit")}
            >
              {t("addBoardingHouseAdmin.submit")}
            </Button>
          </div>
        </Form>
      </div>
    </ConfigProvider>

  );
}

export default AddBoardingHouseForm;
