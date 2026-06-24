import React, { useEffect, useState } from "react";
import { Form, Select, Input } from "antd";
import LocationPicker from "../LocationPicker/LocationPicker";
import { useTranslation } from "react-i18next";
import classNames from 'classnames';

const { Option } = Select;
const { TextArea } = Input;

const AddressSelector = ({
  provinces = [],
  districts = [],
  wards = [],
  onProvinceChange,
  onDistrictChange,
  onInputChange,
  formData,
  location,
  initialPosition,
  setGeoLocation,
  darkMode = false,
}) => {
  const [currentLocation, setCurrentLocation] = useState(
    initialPosition ? [initialPosition.lat, initialPosition.lon] : null
  );
  const { t, i18n } = useTranslation("addBoardingHouseAdmin");
  const lang = i18n.language || 'vi';

  useEffect(() => {
    if (initialPosition) return;
    if (location) {
      setCurrentLocation([location?.lat, location?.lon]);
    }
  }, [location]);

  const onLocationChange = (lat, lng) => {
    setGeoLocation((prev) => {
      return { ...prev, lat, lon: lng };
    });
    setCurrentLocation([lat, lng]);
  };

  const selectClass = classNames({ 'dark-mode-select': darkMode });
  const darkSelectDropdownStyle = darkMode
    ? { backgroundColor: '#374151', color: '#F9FAFB' }
    : {};

  return (
    <div className="col-span-2">
      <Form layout="vertical">
        <Form.Item
          label={t("selectProvince")}
          required
          className="mb-2"
          rules={[{ required: true, message: t("validation.selectProvince") }]}
        >
          <Select
            placeholder={t("validation.selectProvince")}
            value={
              lang === 'en'
                ? formData?.address?.province?.name_en
                : formData?.address?.province?.name
            }
            onChange={(value) => {
              const selected = provinces.find(
                (p) => (lang === 'en' ? p.name_en : p.name) === value
              );
              if (selected) {
                onInputChange({
                  target: {
                    name: 'address.province',
                    value: {
                      name: selected.name,
                      name_en: selected.name_en,
                      id: selected.id,
                    },
                  },
                });
                onInputChange({ target: { name: 'address.district', value: null } });
                onInputChange({ target: { name: 'address.ward', value: null } });

                onProvinceChange?.(selected.id);
              }
            }}
          >
            {provinces.map((province) => (
              <Option key={province.id} value={lang === 'en' ? province.name_en : province.name}>
                {lang === 'en' ? province.name_en : province.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={t("selectDistrict")}
          required
          className="mb-2"
          rules={[{ required: true, message: t("validation.selectDistrict") }]}
        >
          <Select
            placeholder={t("validation.selectDistrict")}
            value={
              lang === 'en'
                ? formData?.address?.district?.name_en
                : formData?.address?.district?.name
            }
            onChange={(value) => {
              const selected = districts.find(
                (d) => (lang === 'en' ? d.name_en : d.name) === value
              );
              if (selected) {
                onInputChange({
                  target: {
                    name: 'address.district',
                    value: {
                      name: selected.name,
                      name_en: selected.name_en,
                      id: selected.id,
                    },
                  },
                });
                onInputChange({ target: { name: 'address.ward', value: null } });
                onDistrictChange?.(selected.id);
              }
            }}
            disabled={!formData?.address?.province}
          >
            {districts.map((district) => (
              <Option
                key={district.id}
                value={lang === 'en' ? district.name_en : district.name}
              >
                {lang === 'en' ? district.name_en : district.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={t("selectWard")}
          required
          className="mb-2"
          rules={[{ required: true, message: t("validation.selectWard") }]}
        >
          <Select
            placeholder={t("validation.selectWard")}
            value={
              lang === 'en'
                ? formData?.address?.ward?.name_en
                : formData?.address?.ward?.name
            }
            onChange={(value) => {
              const selected = wards.find(
                (w) => (lang === 'en' ? w.name_en : w.name) === value
              );
              if (selected) {
                onInputChange({
                  target: {
                    name: 'address.ward',
                    value: {
                      name: selected.name,
                      name_en: selected.name_en,
                      id: selected.id,
                    },
                  },
                });
              }
            }}
            disabled={!formData?.address?.district}
            allowClear
            className={selectClass}
            dropdownStyle={darkSelectDropdownStyle}
            popupClassName={darkMode ? 'dark-mode-select-dropdown' : ''}
          >
            {wards.map((ward) => (
              <Option
                key={ward.id}
                value={lang === 'en' ? ward.name_en : ward.name}
              >
                {lang === 'en' ? ward.name_en : ward.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={t("enterDetailAddress")}
          required
          rules={[{ required: true, message: t("validation.enterDetailAddress") }]}
        >
          <TextArea
            placeholder={t("enterDetailAddress")}
            value={formData?.address?.detail || ""}
            onChange={(e) => {
              onInputChange(e);
            }}
            name="address.detail"
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </Form.Item>
      </Form>
      <LocationPicker
        onChange={onLocationChange}
        geoJson={location?.geojson}
        initialPosition={currentLocation}
      />
    </div>
  );
};

export default AddressSelector;
