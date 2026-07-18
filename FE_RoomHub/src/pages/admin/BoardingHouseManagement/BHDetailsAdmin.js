import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Heart, ImagePlus, Star, X } from "lucide-react";
import axios from "axios";
import i18n from "i18next";
import {
    getBoardingHouseDetails,
    updateBoardingHouseDetails,
    getAllBoardingHouseTypes,
} from "../../../api/boardingHouseAPI";
import {
    fetchProvinces,
    fetchDistricts,
    fetchWards,
} from "../../../api/apiAddress";
import LocationPicker from "../../../component/LocationPicker/LocationPicker";
import coverBhType from "../../../utils/coverBhType";
import {
    titleStyle,
    cardStyle,
    sectionTitleStyle,
    gridTwoStyle,
    gridThreeStyle,
    fieldStyle,
    labelStyle,
    inputStyle,
    uploadBoxStyle,
    uploadTitleStyle,
    uploadHintStyle,
    primaryPreviewWrapStyle,
    primaryPreviewStyle,
    otherImagesGridStyle,
    otherPreviewWrapStyle,
    otherPreviewStyle,
    removeImageBtnStyle,
    badgeStyle,
    footerStyle,
    secondaryBtnStyle,
    primaryBtnStyle,
} from "./adminFormStyles";

const MAX_OTHER_IMAGES = 15;

const getImagePreviewSrc = (image) =>
    image instanceof File ? URL.createObjectURL(image) : image?.imageUrl;

// DB lưu tên đầy đủ ("Thành phố Hồ Chí Minh") còn API địa chỉ trả tên ngắn ("Hồ Chí Minh"),
// nên phải bỏ tiền tố hành chính trước khi so khớp.
const normalizeLocationName = (name) =>
    String(name || "")
        .toLowerCase()
        .replace(/^(thành phố|tỉnh|quận|huyện|thị xã|thị trấn|phường|xã)\s+/g, "")
        .trim();

const findByLocationName = (list, name) => {
    if (!name) return null;
    const target = normalizeLocationName(name);
    return (
        list.find((item) => normalizeLocationName(item.name) === target) ||
        list.find(
            (item) =>
                normalizeLocationName(item.name).includes(target) ||
                target.includes(normalizeLocationName(item.name))
        ) ||
        null
    );
};

export default function BHDetailAdmin() {
    const { boardingHouseId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation("boardingHouseDetailsAdmin");
    const currentLanguage = i18n.language;

    const [updatedData, setUpdatedData] = useState(null);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [boardingHouseTypes, setBoardingHouseTypes] = useState([]);
    const [geoLocation, setGeoLocation] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!boardingHouseId) {
                toast.error(t("errors.noId"));
                navigate("/admin/boarding-houses");
                return;
            }
            try {
                const response = await getBoardingHouseDetails(boardingHouseId);
                if (!response?.success || !response?.data) {
                    throw new Error(t("errors.fetchFailed"));
                }
                const data = response.data;
                const images = Array.isArray(data.images) ? data.images : [];
                setUpdatedData({
                    ...data,
                    primaryImage: images.find((img) => img.isPrimary) || null,
                    otherImages: images.filter((img) => !img.isPrimary),
                });
                if (data?.location?.lat && data?.location?.lon) {
                    setCurrentLocation([data.location.lat, data.location.lon]);
                }
            } catch (error) {
                console.error("Failed to fetch boarding house data:", error);
                toast.error(t("errors.fetchFailed"));
            }
        };
        fetchDetails();
    }, [boardingHouseId, navigate, t]);

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const response = await getAllBoardingHouseTypes();
                setBoardingHouseTypes(response.data || []);
            } catch (error) {
                console.error("Failed to fetch boarding house types:", error);
                toast.error(t("errors.fetchBoardingHouseTypes"));
            }
        };
        fetchTypes();
    }, [t]);

    useEffect(() => {
        const preloadAddressOptions = async () => {
            try {
                const provincesData = await fetchProvinces();
                setProvinces(provincesData || []);

                const address = updatedData?.address;
                const selectedProvince = findByLocationName(provincesData || [], address?.province?.name);
                if (!selectedProvince) return;

                const districtsData = (await fetchDistricts(selectedProvince.id)) || [];
                setDistricts(districtsData);

                const selectedDistrict = findByLocationName(districtsData, address?.district?.name);
                const wardsData = selectedDistrict
                    ? (await fetchWards(selectedDistrict.id)) || []
                    : [];
                setWards(wardsData);

                const selectedWard = findByLocationName(wardsData, address?.ward?.name);

                // Gắn id vào address để các select hiển thị đúng giá trị đang lưu.
                setUpdatedData((prev) => ({
                    ...prev,
                    address: {
                        ...prev.address,
                        province: { ...prev.address.province, id: selectedProvince.id },
                        district: selectedDistrict
                            ? { ...prev.address.district, id: selectedDistrict.id }
                            : prev.address.district,
                        ward: selectedWard
                            ? { ...prev.address.ward, id: selectedWard.id }
                            : prev.address.ward,
                    },
                }));
            } catch (error) {
                console.error("Error fetching address data:", error);
                toast.error(t("errors.fetchAddressFailed"));
            }
        };
        preloadAddressOptions();
    }, [updatedData?.address?.province?.name, updatedData?.address?.district?.name, t]);

    useEffect(() => {
        const ward = updatedData?.address?.ward;
        if (!ward?.name) return;
        const getLocation = async () => {
            try {
                const res = await axios.get("https://nominatim.openstreetmap.org/search", {
                    params: {
                        format: "json",
                        q: `${ward.name}, ${updatedData?.address?.district?.name || ""}, ${updatedData?.address?.province?.name || ""}`,
                        polygon_geojson: 1,
                    },
                });
                setGeoLocation(res.data[0] || null);
            } catch (error) {
                console.error("Error getting location:", error);
            }
        };
        getLocation();
    }, [updatedData?.address?.ward?.name]);

    const updateField = (name, value) => {
        setUpdatedData((prev) => ({ ...prev, [name]: value }));
    };

    const updateAddressField = (name, value) => {
        setUpdatedData((prev) => ({
            ...prev,
            address: { ...prev.address, [name]: value },
        }));
    };

    const handleProvinceChange = async (provinceId) => {
        const selected = provinces.find((p) => String(p.id) === provinceId);
        setUpdatedData((prev) => ({
            ...prev,
            address: {
                ...prev.address,
                province: selected
                    ? { id: selected.id, name: selected.name, name_en: selected.name_en }
                    : null,
                district: null,
                ward: null,
            },
        }));
        setDistricts(selected ? await fetchDistricts(selected.id) : []);
        setWards([]);
    };

    const handleDistrictChange = async (districtId) => {
        const selected = districts.find((d) => String(d.id) === districtId);
        setUpdatedData((prev) => ({
            ...prev,
            address: {
                ...prev.address,
                district: selected
                    ? { id: selected.id, name: selected.name, name_en: selected.name_en }
                    : null,
                ward: null,
            },
        }));
        setWards(selected ? await fetchWards(selected.id) : []);
    };

    const handleWardChange = (wardId) => {
        const selected = wards.find((w) => String(w.id) === wardId);
        updateAddressField(
            "ward",
            selected ? { id: selected.id, name: selected.name, name_en: selected.name_en } : null
        );
    };

    const handlePrimaryImageChange = (event) => {
        const file = event.target.files?.[0];
        if (file) updateField("primaryImage", file);
        event.target.value = "";
    };

    const handleOtherImagesChange = (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        setUpdatedData((prev) => {
            if (prev.otherImages.length + files.length > MAX_OTHER_IMAGES) {
                toast.error(t("errors.maxOtherImages"));
                return prev;
            }
            return { ...prev, otherImages: [...prev.otherImages, ...files] };
        });
        event.target.value = "";
    };

    const handleRemoveOtherImage = (index) => {
        setUpdatedData((prev) => ({
            ...prev,
            otherImages: prev.otherImages.filter((_, i) => i !== index),
        }));
    };

    const getValidationError = () => {
        if (!updatedData.boardingHouseType) return t("validation.selectBoardingHouseType");
        if (!updatedData.name) return t("validation.enterBoardingHouseName");
        if (!updatedData.address?.province) return t("validation.selectProvince");
        if (!updatedData.address?.district) return t("validation.selectDistrict");
        if (!updatedData.address?.ward) return t("validation.selectWard");
        if (!updatedData.address?.detail) return t("validation.enterDetailAddress");
        if (!updatedData.priceRange) return t("validation.enterPriceRange");
        if (!updatedData.electricityPrice) return t("validation.enterElectricityPrice");
        if (!updatedData.waterPrice) return t("validation.enterWaterPrice");
        if (!updatedData.primaryImage) return t("errors.primaryImageRequired");
        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validationError = getValidationError();
        if (validationError) {
            toast.error(validationError);
            return;
        }

        setLoading(true);
        try {
            const { address } = updatedData;
            const payload = new FormData();
            payload.append(
                "boardingHouseType",
                updatedData.boardingHouseType?._id || updatedData.boardingHouseType
            );
            payload.append("name", updatedData.name);
            payload.append("description", updatedData.description || "");
            payload.append("priceRange", updatedData.priceRange);
            payload.append("electricityPrice", updatedData.electricityPrice);
            payload.append("waterPrice", updatedData.waterPrice);
            payload.append("address[province][name]", address.province.name);
            payload.append("address[province][name_en]", address.province.name_en || address.province.name);
            payload.append("address[district][name]", address.district.name);
            payload.append("address[district][name_en]", address.district.name_en || address.district.name);
            payload.append("address[ward][name]", address.ward.name);
            payload.append("address[ward][name_en]", address.ward.name_en || address.ward.name);
            payload.append("address[detail]", address.detail);
            payload.append("location[lat]", updatedData.location?.lat ?? "");
            payload.append("location[lon]", updatedData.location?.lon ?? "");

            const keptImages = [];
            [updatedData.primaryImage, ...(updatedData.otherImages || [])].forEach((image) => {
                if (image instanceof File) {
                    payload.append("boardingHouse", image);
                } else if (image) {
                    keptImages.push(image);
                }
            });
            if (keptImages.length > 0) {
                payload.append("boardingHouse", JSON.stringify(keptImages));
            }

            const response = await updateBoardingHouseDetails(updatedData._id, payload);
            if (response?.success) {
                toast.success(t("messages.updateSuccess"));
                navigate("/admin/boarding-houses");
            } else {
                toast.error(t("messages.updateFailed"));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t("messages.updateFailed"));
        } finally {
            setLoading(false);
        }
    };

    if (!updatedData) {
        return null;
    }

    const ratingValue = Math.floor(updatedData.rating || 0);

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={titleStyle}>
                <Building2 size={26} color="#667085" />
                {updatedData.name}
            </h2>

            <section style={cardStyle}>
                <div style={statsRowStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                        <span style={ratingBadgeStyle}>
                            {Array.from({ length: 5 }, (_, index) => (
                                <Star
                                    key={index}
                                    size={16}
                                    fill={index < ratingValue ? "#f59e0b" : "none"}
                                    color="#f59e0b"
                                />
                            ))}
                            {updatedData.rating ?? 0}
                        </span>
                        <span style={likesBadgeStyle}>
                            <Heart size={15} fill="#d92d20" color="#d92d20" />
                            {t("boardingHouseDetailsAdmin.likes", {
                                count: Number(updatedData.likes || 0).toLocaleString("en-US"),
                            })}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={badgeStyle}>
                            {t("boardingHouseDetailsAdmin.totalRooms")}: {updatedData.totalRooms || 0}
                        </span>
                        <span style={badgeStyle}>
                            {t("boardingHouseDetailsAdmin.availableRooms")}: {updatedData.availableRooms || 0}
                        </span>
                    </div>
                </div>
            </section>

            <section style={cardStyle}>
                <h3 style={sectionTitleStyle}>{t("boardingHouseDetailsAdmin.information")}</h3>
                <div style={gridTwoStyle}>
                    <label style={fieldStyle}>
                        <span style={labelStyle}>{t("boardingHouseDetailsAdmin.name")}</span>
                        <input
                            value={updatedData.name || ""}
                            onChange={(e) => updateField("name", e.target.value)}
                            style={inputStyle}
                        />
                    </label>

                    <label style={fieldStyle}>
                        <span style={labelStyle}>{t("boardingHouseDetailsAdmin.boardingHouseType")}</span>
                        <select
                            value={updatedData.boardingHouseType?._id || ""}
                            onChange={(e) => updateField("boardingHouseType", { _id: e.target.value })}
                            style={inputStyle}
                        >
                            {boardingHouseTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {coverBhType(type.code, currentLanguage)}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <label style={{ ...fieldStyle, marginTop: 14 }}>
                    <span style={labelStyle}>{t("boardingHouseDetailsAdmin.description")}</span>
                    <textarea
                        value={updatedData.description || ""}
                        onChange={(e) => updateField("description", e.target.value)}
                        rows={4}
                        style={{ ...inputStyle, minHeight: 96, padding: "10px 12px", resize: "vertical" }}
                    />
                </label>
            </section>

            <section style={cardStyle}>
                <h3 style={sectionTitleStyle}>{t("boardingHouseDetailsAdmin.price")}</h3>
                <div style={gridThreeStyle}>
                    <label style={fieldStyle}>
                        <span style={labelStyle}>{t("boardingHouseDetailsAdmin.priceRent")}</span>
                        <input
                            type="number"
                            min="0"
                            value={updatedData.priceRange ?? ""}
                            onChange={(e) => updateField("priceRange", e.target.value)}
                            style={inputStyle}
                        />
                    </label>

                    <label style={fieldStyle}>
                        <span style={labelStyle}>{t("boardingHouseDetailsAdmin.electricityPrice")}</span>
                        <input
                            type="number"
                            min="0"
                            value={updatedData.electricityPrice ?? ""}
                            onChange={(e) => updateField("electricityPrice", e.target.value)}
                            style={inputStyle}
                        />
                    </label>

                    <label style={fieldStyle}>
                        <span style={labelStyle}>{t("boardingHouseDetailsAdmin.waterPrice")}</span>
                        <input
                            type="number"
                            min="0"
                            value={updatedData.waterPrice ?? ""}
                            onChange={(e) => updateField("waterPrice", e.target.value)}
                            style={inputStyle}
                        />
                    </label>
                </div>
            </section>

            <section style={cardStyle}>
                <h3 style={sectionTitleStyle}>{t("boardingHouseDetailsAdmin.image")}</h3>

                <span style={labelStyle}>{t("boardingHouseDetailsAdmin.primaryImage")}</span>
                <div style={{ marginTop: 8 }}>
                    {updatedData.primaryImage ? (
                        <div style={primaryPreviewWrapStyle}>
                            <img
                                src={getImagePreviewSrc(updatedData.primaryImage)}
                                alt={t("boardingHouseDetailsAdmin.primaryImage")}
                                style={primaryPreviewStyle}
                            />
                            <button
                                type="button"
                                onClick={() => updateField("primaryImage", null)}
                                style={removeImageBtnStyle}
                                title={t("boardingHouseDetailsAdmin.delete")}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <label style={uploadBoxStyle}>
                            <ImagePlus size={22} color="#667085" />
                            <span style={uploadTitleStyle}>{t("boardingHouseDetailsAdmin.primaryImage")}</span>
                            <span style={uploadHintStyle}>{t("boardingHouseDetailsAdmin.dragDrop")}</span>
                            <input type="file" accept="image/*" onChange={handlePrimaryImageChange} hidden />
                        </label>
                    )}
                </div>

                <div style={{ marginTop: 18 }}>
                    <span style={labelStyle}>{t("boardingHouseDetailsAdmin.otherImages")}</span>
                    <div style={otherImagesGridStyle}>
                        {(updatedData.otherImages || []).map((image, index) => (
                            <div key={image.publicId || index} style={otherPreviewWrapStyle}>
                                <img
                                    src={getImagePreviewSrc(image)}
                                    alt={`${t("boardingHouseDetailsAdmin.otherImages")} ${index + 1}`}
                                    style={otherPreviewStyle}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveOtherImage(index)}
                                    style={removeImageBtnStyle}
                                    title={t("boardingHouseDetailsAdmin.delete")}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {(updatedData.otherImages || []).length < MAX_OTHER_IMAGES && (
                            <label style={{ ...uploadBoxStyle, width: 120, height: 120, padding: 10 }}>
                                <ImagePlus size={20} color="#667085" />
                                <input type="file" accept="image/*" multiple onChange={handleOtherImagesChange} hidden />
                            </label>
                        )}
                    </div>
                </div>
            </section>

            <section style={cardStyle}>
                <h3 style={sectionTitleStyle}>{t("boardingHouseDetailsAdmin.address")}</h3>
                <div style={addressGridStyle}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <label style={fieldStyle}>
                            <span style={labelStyle}>{t("boardingHouseDetailsAdmin.selectProvince")}</span>
                            <select
                                value={updatedData.address?.province?.id ?? ""}
                                onChange={(e) => handleProvinceChange(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="">{t("boardingHouseDetailsAdmin.selectProvince")}</option>
                                {provinces.map((province) => (
                                    <option key={province.id} value={province.id}>
                                        {currentLanguage === "vi" ? province.name : province.name_en || province.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label style={fieldStyle}>
                            <span style={labelStyle}>{t("boardingHouseDetailsAdmin.selectDistrict")}</span>
                            <select
                                value={updatedData.address?.district?.id ?? ""}
                                onChange={(e) => handleDistrictChange(e.target.value)}
                                disabled={!updatedData.address?.province}
                                style={inputStyle}
                            >
                                <option value="">{t("boardingHouseDetailsAdmin.selectDistrict")}</option>
                                {districts.map((district) => (
                                    <option key={district.id} value={district.id}>
                                        {currentLanguage === "vi" ? district.name : district.name_en || district.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label style={fieldStyle}>
                            <span style={labelStyle}>{t("boardingHouseDetailsAdmin.selectWard")}</span>
                            <select
                                value={updatedData.address?.ward?.id ?? ""}
                                onChange={(e) => handleWardChange(e.target.value)}
                                disabled={!updatedData.address?.district}
                                style={inputStyle}
                            >
                                <option value="">{t("boardingHouseDetailsAdmin.selectWard")}</option>
                                {wards.map((ward) => (
                                    <option key={ward.id} value={ward.id}>
                                        {currentLanguage === "vi" ? ward.name : ward.name_en || ward.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label style={fieldStyle}>
                            <span style={labelStyle}>{t("boardingHouseDetailsAdmin.detail")}</span>
                            <textarea
                                value={updatedData.address?.detail || ""}
                                onChange={(e) => updateAddressField("detail", e.target.value)}
                                rows={4}
                                style={{ ...inputStyle, minHeight: 96, padding: "10px 12px", resize: "vertical" }}
                            />
                        </label>
                    </div>

                    <div style={mapWrapStyle}>
                        <LocationPicker
                            className="h-full min-h-[420px] w-full"
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
            </section>

            <div style={footerStyle}>
                <button
                    type="button"
                    onClick={() => navigate("/admin/boarding-houses")}
                    disabled={loading}
                    style={secondaryBtnStyle}
                >
                    {t("boardingHouseDetailsAdmin.back")}
                </button>
                <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
                    {t("boardingHouseDetailsAdmin.update")}
                </button>
            </div>
        </form>
    );
}

const statsRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
};

const ratingBadgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "#fffaeb",
    color: "#b54708",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: 13,
};

const likesBadgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#fef3f2",
    color: "#d92d20",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: 13,
};

const addressGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
};

const mapWrapStyle = {
    minHeight: 420,
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
};
