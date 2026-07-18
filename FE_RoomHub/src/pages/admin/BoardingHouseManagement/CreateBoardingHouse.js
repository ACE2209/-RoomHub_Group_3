import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ImagePlus, X } from "lucide-react";
import axios from "axios";
import i18n from "i18next";
import {
  getAllBoardingHouseTypes,
  createBoardingHouse,
} from "../../../api/boardingHouseAPI";
import {
  fetchProvinces,
  fetchDistricts,
  fetchWards,
} from "../../../api/apiAddress";
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
  footerStyle,
  secondaryBtnStyle,
  primaryBtnStyle,
} from "./adminFormStyles";

const MAX_OTHER_IMAGES = 15;

export default function AddBoardingHouseForm() {
  const navigate = useNavigate();
  const { t } = useTranslation("addBoardingHouseAdmin");
  const currentLanguage = i18n.language;

  const [formData, setFormData] = useState({
    owner: "",
    boardingHouseType: "",
    name: "",
    description: "",
    address: { province: null, district: null, ward: null, detail: "" },
    primaryImage: null,
    otherImages: [],
    priceRange: "",
    electricityPrice: "",
    waterPrice: "",
  });
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [boardingHouseTypes, setBoardingHouseTypes] = useState([]);
  const [geoLocation, setGeoLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const goToList = () => navigate("/admin/boarding-houses");

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [provincesData, typesResponse] = await Promise.all([
          fetchProvinces(),
          getAllBoardingHouseTypes(),
        ]);
        setProvinces(provincesData || []);
        setBoardingHouseTypes(typesResponse.data || []);
      } catch (error) {
        console.error("Failed to load initial form data:", error);
        toast.error(t("errors.fetchBoardingHouseTypesFailed"));
      }
    };
    loadInitialData();
  }, [t]);

  useEffect(() => {
    const { ward, district, province } = formData.address;
    if (!ward) return;
    const getLocation = async () => {
      try {
        const res = await axios.get("https://nominatim.openstreetmap.org/search", {
          params: {
            format: "json",
            q: `${ward.name}, ${district?.name || ""}, ${province?.name || ""}`,
            polygon_geojson: 1,
          },
        });
        setGeoLocation(res.data[0] || null);
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };
    getLocation();
  }, [formData.address]);

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProvinceChange = async (provinceId) => {
    const selectedProvince = provinces.find((p) => String(p.id) === provinceId);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        province: selectedProvince
          ? { id: selectedProvince.id, name: selectedProvince.name, name_en: selectedProvince.name_en }
          : null,
        district: null,
        ward: null,
      },
    }));
    setDistricts(selectedProvince ? await fetchDistricts(selectedProvince.id) : []);
    setWards([]);
  };

  const handleDistrictChange = async (districtId) => {
    const selectedDistrict = districts.find((d) => String(d.id) === districtId);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        district: selectedDistrict
          ? { id: selectedDistrict.id, name: selectedDistrict.name, name_en: selectedDistrict.name_en }
          : null,
        ward: null,
      },
    }));
    setWards(selectedDistrict ? await fetchWards(selectedDistrict.id) : []);
  };

  const handleWardChange = (wardId) => {
    const selectedWard = wards.find((w) => String(w.id) === wardId);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        ward: selectedWard
          ? { id: selectedWard.id, name: selectedWard.name, name_en: selectedWard.name_en }
          : null,
      },
    }));
  };

  const handlePrimaryImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) updateField("primaryImage", file);
    event.target.value = "";
  };

  const handleOtherImagesChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setFormData((prev) => {
      if (prev.otherImages.length + files.length > MAX_OTHER_IMAGES) {
        toast.error(t("validation.maxOtherImages"));
        return prev;
      }
      return { ...prev, otherImages: [...prev.otherImages, ...files] };
    });
    event.target.value = "";
  };

  const handleRemoveOtherImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      otherImages: prev.otherImages.filter((_, i) => i !== index),
    }));
  };

  const getValidationError = () => {
    const { owner, boardingHouseType, name, address, primaryImage } = formData;
    if (!owner.trim()) return t("validation.enterName");
    if (!boardingHouseType) return t("validation.selectBoardingHouseType");
    if (!name.trim()) return t("validation.enterBoardingHouseName");
    if (!address.province) return t("validation.selectProvince");
    if (!address.district) return t("validation.selectDistrict");
    if (!address.ward) return t("validation.selectWard");
    if (!address.detail.trim()) return t("validation.enterDetailAddress");
    if (!primaryImage) return t("validation.uploadPrimaryImage");
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = getValidationError();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const { address } = formData;
    const payload = new FormData();
    payload.append("ownerUsername", formData.owner.trim());
    payload.append("boardingHouseType", formData.boardingHouseType);
    payload.append("name", formData.name.trim());
    payload.append("description", formData.description);
    payload.append("priceRange", formData.priceRange);
    payload.append("electricityPrice", formData.electricityPrice);
    payload.append("waterPrice", formData.waterPrice);
    payload.append("address[province][name]", address.province.name);
    payload.append("address[province][name_en]", address.province.name_en || address.province.name);
    payload.append("address[district][name]", address.district.name);
    payload.append("address[district][name_en]", address.district.name_en || address.district.name);
    payload.append("address[ward][name]", address.ward.name);
    payload.append("address[ward][name_en]", address.ward.name_en || address.ward.name);
    payload.append("address[detail]", address.detail.trim());
    payload.append("location[lat]", geoLocation?.lat ?? "");
    payload.append("location[lon]", geoLocation?.lon ?? "");
    [formData.primaryImage, ...formData.otherImages].forEach((file) => {
      payload.append("boardingHouse", file);
    });

    setLoading(true);
    try {
      await createBoardingHouse(payload);
      toast.success(t("messages.createdSuccess"));
      goToList();
    } catch (error) {
      console.error("Failed to create boarding house:", error);
      toast.error(error.response?.data?.message || t("errors.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={titleStyle}>{t("addBoardingHouseAdmin.title")}</h2>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>{t("addBoardingHouseAdmin.ownerSection")}</h3>
        <div style={gridTwoStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>{t("addBoardingHouseAdmin.owner")}</span>
            <input
              value={formData.owner}
              onChange={(e) => updateField("owner", e.target.value)}
              placeholder={t("addBoardingHouseAdmin.ownerPlaceholder")}
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>{t("addBoardingHouseAdmin.boardingHouseType")}</span>
            <select
              value={formData.boardingHouseType}
              onChange={(e) => updateField("boardingHouseType", e.target.value)}
              style={inputStyle}
            >
              <option value="">{t("addBoardingHouseAdmin.boardingHouseTypePlaceholder")}</option>
              {boardingHouseTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {coverBhType(type.code, currentLanguage)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ ...fieldStyle, marginTop: 14 }}>
          <span style={labelStyle}>{t("addBoardingHouseAdmin.name")}</span>
          <input
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder={t("addBoardingHouseAdmin.namePlaceholder")}
            style={inputStyle}
          />
        </label>

        <label style={{ ...fieldStyle, marginTop: 14 }}>
          <span style={labelStyle}>{t("addBoardingHouseAdmin.description")}</span>
          <textarea
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder={t("addBoardingHouseAdmin.descriptionPlaceholder")}
            rows={4}
            style={{ ...inputStyle, minHeight: 96, padding: "10px 12px", resize: "vertical" }}
          />
        </label>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>{t("addBoardingHouseAdmin.addressSection")}</h3>
        <div style={gridThreeStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>{t("selectProvince")}</span>
            <select
              value={formData.address.province?.id ?? ""}
              onChange={(e) => handleProvinceChange(e.target.value)}
              style={inputStyle}
            >
              <option value="">{t("selectProvince")}</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {currentLanguage === "vi" ? province.name : province.name_en || province.name}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>{t("selectDistrict")}</span>
            <select
              value={formData.address.district?.id ?? ""}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={!formData.address.province}
              style={inputStyle}
            >
              <option value="">{t("selectDistrict")}</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {currentLanguage === "vi" ? district.name : district.name_en || district.name}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>{t("selectWard")}</span>
            <select
              value={formData.address.ward?.id ?? ""}
              onChange={(e) => handleWardChange(e.target.value)}
              disabled={!formData.address.district}
              style={inputStyle}
            >
              <option value="">{t("selectWard")}</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {currentLanguage === "vi" ? ward.name : ward.name_en || ward.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ ...fieldStyle, marginTop: 14 }}>
          <span style={labelStyle}>{t("enterDetailAddress")}</span>
          <input
            value={formData.address.detail}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                address: { ...prev.address, detail: e.target.value },
              }))
            }
            placeholder={t("enterDetailAddress")}
            style={inputStyle}
          />
        </label>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>{t("addBoardingHouseAdmin.imageSection")}</h3>

        <span style={labelStyle}>{t("addBoardingHouseAdmin.primaryImage")}</span>
        <div style={{ marginTop: 8 }}>
          {formData.primaryImage ? (
            <div style={primaryPreviewWrapStyle}>
              <img
                src={URL.createObjectURL(formData.primaryImage)}
                alt={t("addBoardingHouseAdmin.primaryImage")}
                style={primaryPreviewStyle}
              />
              <button
                type="button"
                onClick={() => updateField("primaryImage", null)}
                style={removeImageBtnStyle}
                title={t("addBoardingHouseAdmin.cancel")}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label style={uploadBoxStyle}>
              <ImagePlus size={22} color="#667085" />
              <span style={uploadTitleStyle}>{t("addBoardingHouseAdmin.addPrimaryImage")}</span>
              <span style={uploadHintStyle}>{t("addBoardingHouseAdmin.dragDrop")}</span>
              <input type="file" accept="image/*" onChange={handlePrimaryImageChange} hidden />
            </label>
          )}
        </div>

        <div style={{ marginTop: 18 }}>
          <span style={labelStyle}>{t("otherImagesLabel")}</span>
          <div style={otherImagesGridStyle}>
            {formData.otherImages.map((file, index) => (
              <div key={index} style={otherPreviewWrapStyle}>
                <img
                  src={URL.createObjectURL(file)}
                  alt={`${t("otherImagesLabel")} ${index + 1}`}
                  style={otherPreviewStyle}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOtherImage(index)}
                  style={removeImageBtnStyle}
                  title={t("addBoardingHouseAdmin.cancel")}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <label style={{ ...uploadBoxStyle, width: 120, height: 120, padding: 10 }}>
              <ImagePlus size={20} color="#667085" />
              <span style={{ ...uploadHintStyle, textAlign: "center" }}>
                {t("addBoardingHouseAdmin.addOtherImages")}
              </span>
              <input type="file" accept="image/*" multiple onChange={handleOtherImagesChange} hidden />
            </label>
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>{t("addBoardingHouseAdmin.priceSection")}</h3>
        <div style={gridThreeStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>{t("addBoardingHouseAdmin.priceRent")}</span>
            <input
              type="number"
              min="0"
              value={formData.priceRange}
              onChange={(e) => updateField("priceRange", e.target.value)}
              placeholder={t("addBoardingHouseAdmin.enterPriceRent")}
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>{t("addBoardingHouseAdmin.electricityPrice")}</span>
            <input
              type="number"
              min="0"
              value={formData.electricityPrice}
              onChange={(e) => updateField("electricityPrice", e.target.value)}
              placeholder={t("addBoardingHouseAdmin.enterElectricityPrice")}
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>{t("addBoardingHouseAdmin.waterPrice")}</span>
            <input
              type="number"
              min="0"
              value={formData.waterPrice}
              onChange={(e) => updateField("waterPrice", e.target.value)}
              placeholder={t("addBoardingHouseAdmin.enterWaterPrice")}
              style={inputStyle}
            />
          </label>
        </div>
      </section>

      <div style={footerStyle}>
        <button type="button" onClick={goToList} disabled={loading} style={secondaryBtnStyle}>
          {t("addBoardingHouseAdmin.cancel")}
        </button>
        <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
          {t("addBoardingHouseAdmin.submit")}
        </button>
      </div>
    </form>
  );
}
