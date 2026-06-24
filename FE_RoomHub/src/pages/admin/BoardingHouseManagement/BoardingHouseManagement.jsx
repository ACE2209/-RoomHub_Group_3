import { toast } from "react-toastify";
import { useEffect, useState, useMemo } from "react";
import AddressSelector from "../../../component/AddressSelector";
import { Button as ButtonCustom, TableCustom as Table, ConfirmModal } from "../../../component";
import {
  FileTextOutlined,
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
  getAllBoardingHDB,
  getBoardingHouseDetails,
  updateBoardingHouseDetails,
  getAllBoardingHouseTypes,
  getBoardingHouseImages,
  filterBH,
  softDeleteBoardingHouse,
} from "../../../api/boardingHouseAPI";
import formatAmount from "../../../utils/formatAmount";
import convertTimetap from "../../../utils/convertTimetap";
import CreateBoardingHouse from "./CreateBoardingHouse";
import FilterBoardingHouse from "./FilterBoardingHouse";
import { Tooltip } from 'antd';
import { useNavigate } from "react-router-dom";
import BHDetailAdmin from "./BHDetailsAdmin";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../context/themeContext";
import i18next from 'i18next';
import getLocalizedAddress from '../../../utils/addressHelper';

function BoardingHouseManagement(onClose) {
  const [boardingHData, setBoardingHData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [boardingHouseTypes, setBoardingHouseTypes] = useState([]);
  const [images, setImages] = useState([]);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterValue, setFilterValue] = useState();
  const [geoLocation, setGeoLocation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { darkMode } = useTheme();
  const currentLanguage = i18next.language;

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [paginationOptions, setPaginationOptions] = useState({
    page: 1,
    limit: 10,
    sortField: "createdAt",
    sortOrder: "desc",
  });
  const { t } = useTranslation("boardingHouseAdmin");

  const handleDeleteModal = (record) => {
    setSelectedRequest(record);
    setIsOpenDeleteModal(true);
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getAllBoardingHDB();
      setBoardingHData(response || []);
    } catch (error) {
      console.error("Failed to fetch boarding houses:", error);
    } finally {
      setLoading(false);
    }
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

  const handleFileChange = (e, isPrimary = false) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      primaryImage: isPrimary ? file : prev.primaryImage,
      otherImages: isPrimary
        ? prev.otherImages
        : [...(prev.otherImages || []), file],
    }));
  };

  const handleOpenForm = () => {
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleFormSuccess = () => {
    fetchData();
    handleCloseForm();
  };

  useEffect(() => {
    fetchData();
  }, []);
  const fetchImages = async (id) => {
    try {
      const { data } = await getBoardingHouseImages(id);
      setImages(data);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      toast.error(t("errors.fetchImages"));
    }
  };


  const fetchFilterData = async () => {
    setLoading(true);
    try {
      const response = await filterBH({
        ...filterValue,
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      });
      console.log("Filter response:", response);

      if (response?.data) {
        setBoardingHData(response.data);
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalItems: response.pagination.totalItems,
          limit: response.pagination.limit,
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to fetch filter data.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchFilterData();
  }, [filterValue, paginationOptions]);

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const fetchBoardingHouseTypes = async () => {
    try {
      const response = await getAllBoardingHouseTypes();
      setBoardingHouseTypes(response.data || []);
    } catch (error) {
      console.error("Failed to fetch boarding house types:", error);
      toast.error("Failed to fetch boarding house types.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const provincesData = await fetchProvinces();
        setProvinces(provincesData);

        if (formData?.address?.province) {
          const selectedProvince = provincesData.find(
            (p) => p.name === formData.address.province.name
          );
          if (selectedProvince) {
            const districtsData = await fetchDistricts(selectedProvince.id);
            setDistricts(districtsData);

            if (formData?.address?.district) {
              const selectedDistrict = districtsData.find(
                (d) => d.name === formData.address.district.name
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

  const handleInputChange = ({ target: { name, value } }) => {
    const keys = name.split(".");

    if (keys.length === 2) {
      setFormData((prev) => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: value,
        },
      }));
    } else if (keys.length === 3) {
      setFormData((prev) => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: {
            ...prev[keys[0]]?.[keys[1]],
            [keys[2]]: value,
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectedTypesChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: { _id: value },
    }));
  };
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setFormData(null);
  };

  const handleCancel = () => {
    setFormData({
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

    setIsDetailOpen(false);
  };

  const handleRemovePrimaryImage = () => {
    setFormData((prev) => ({
      ...prev,
      primaryImage: null,
    }));

    setImages((prevImages) =>
      prevImages.map((img) =>
        img.isPrimary ? { ...img, isPrimary: false } : img
      )
    );
    toast.success("Primary image removed.");
  };

  const handleRemoveOtherImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      otherImages: prev.otherImages.filter((_, i) => i !== index),
    }));
    toast.success("Temporary image removed.");
  };
  const handleImageDelete = (imageId) => {
    setImages((prevImages) => prevImages.filter((img) => img._id !== imageId));
    toast.success("Image removed from the list.");
  };

  const handleSelectDelete = async () => {
    if (!selectedRequest) {
      toast.error("No boarding house selected for deletion.");
      return;
    }

    try {
      const response = await softDeleteBoardingHouse(selectedRequest._id);
      if (response.success) {
        toast.success(t("messages.deleteSuccess"));
        fetchData();
        setIsOpenDeleteModal(false);
        setSelectedRequest(null);
      } else {
        toast.error(response.message || "Failed to delete boarding house.");
      }
    } catch (error) {
      console.error("Failed to delete boarding house:", error);
      toast.error("Failed to delete boarding house. Please try again later.");
    }
  };
  const navigate = useNavigate();

  const onProcessData = async (record) => {

    navigate(`/admin/boarding-houses/${record._id}`);
    try {
      const { data } = await getBoardingHouseDetails(record._id);
      setFormData({
        ...data,
        otherImages: Array.isArray(data.otherImages) ? data.otherImages : [],
      });
      setIsDetailOpen(true);
      fetchImages(record._id);
    } catch (error) {
      console.error("Failed to fetch boarding house details:", error);
      toast.error("Failed to fetch boarding house details.");
    }
  };
  useEffect(() => {
    fetchData();
    fetchBoardingHouseTypes();
  }, []);

  useEffect(() => {
    console.log("Filter value: ", filterValue);
  }, [filterValue]);

  const columns = [
    {
      title: t("boardingHouseAdmin.name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("boardingHouseAdmin.address"),
      dataIndex: "address",
      key: "address",
      width: 200,
      render: (text) =>
        text ? (
          <Tooltip title={getLocalizedAddress(text, currentLanguage)}>
            {getLocalizedAddress(text, currentLanguage)}
          </Tooltip>
        ) : (
          t('messages.noData')
        ),
    },
    {
      title: t("boardingHouseAdmin.priceRange"),
      dataIndex: "priceRange",
      key: "priceRange",
      render: (text) => `${formatAmount(text)}`,
    },
    {
      title: t('boardingHouseAdmin.boardingHouseType'),
      dataIndex: 'boardingHouseType',
      key: 'boardingHouseType',
      render: (type) => {
        if (!type) return t('messages.noData');
        return t(`boardingHouseTypes.${type.name}`) || t('messages.noData');
      },
    },
    {
      title: t("boardingHouseAdmin.totalRooms"),
      dataIndex: "totalRooms",
      key: "totalRooms",
    },
    {
      title: t("boardingHouseAdmin.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => convertTimetap(text),
    },
    {
      title: t("boardingHouseAdmin.action"),
      key: "action",
      render: (text, record) => (
        <div className="flex gap-3">
          <ButtonCustom
            title={t("boardingHouseAdmin.delete")}
            btnDelete
            className="btn-delete"
            onClick={() => handleDeleteModal(record)}
          />
          <ButtonCustom
            onClick={() => onProcessData(record)}
            title={t("boardingHouseAdmin.update")}
            icon={<FileTextOutlined />}
            className="text-white"
            bgColor="rgb(5 150 105)"
          />
        </div>
      ),
    },
  ];
  const handleTableChange = (pagination, filters, sorter) => {
    const newPaginationOptions = {
      ...paginationOptions,
      page: pagination.current,
      limit: pagination.pageSize,
    };
    setPaginationOptions(newPaginationOptions);
  };
  const tablePaginationConfig = useMemo(() => ({
    current: pagination.currentPage,
    pageSize: pagination.limit,
    total: pagination.totalItems,
    showSizeChanger: true,
    showTotal: (total, range) => (
      <span
        style={{
          color: darkMode ? "#ffffff" : "#000000",
        }}
      >
        {t("boardingHouseAdmin.pagination.showTotal", {
          start: range[0],
          end: range[1],
          total,
        })}
      </span>
    ),
  }), [pagination, t]);
  return (
    <div className="boarding-house-management">
      <div className="flex justify-between mb-4">
        <ButtonCustom
          btnAdd
          title={t("boardingHouseAdmin.addNew")}
          size="large"
          onClick={handleOpenForm}
        />

        <FilterBoardingHouse
          setFilterValue={setFilterValue}
          boardingHouseTypes={boardingHouseTypes}
        />
      </div>
      <Table
        columns={columns}
        data={boardingHData}
        loading={loading}
        onChange={handleTableChange}
        pagination={tablePaginationConfig}
      />

      <ConfirmModal
        title={t("boardingHouseAdmin.confirmDeletion.title")}
        content={t("boardingHouseAdmin.confirmDeletion.content", {
          name: selectedRequest?.name || t("boardingHouseAdmin.delete"),
        })}
        onOk={handleSelectDelete}
        onCancel={() => {
          setIsOpenDeleteModal(false);
          setSelectedRequest(null);
        }}
        isOpen={isOpenDeleteModal}
      />
      {isFormOpen && (
        <CreateBoardingHouse
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
      {isDetailOpen && formData && (
        <BHDetailAdmin
          formData={formData}
          provinces={provinces}
          districts={districts}
          wards={wards}
          boardingHouseTypes={boardingHouseTypes}
          geoLocation={geoLocation}
          setGeoLocation={setGeoLocation}
          images={images}
          handleInputChange={handleInputChange}
          handleSelectedTypesChange={handleSelectedTypesChange}
          handleRemovePrimaryImage={handleRemovePrimaryImage}
          handleRemoveOtherImage={handleRemoveOtherImage}
          handleFileChange={handleFileChange}
          handleImageDelete={handleImageDelete}
          uploadProps={uploadProps}
          uploadOtherImgProps={uploadOtherImgProps}
          handleCancel={handleCancel}
        />
      )}
    </div>
  );
}

export default BoardingHouseManagement;
