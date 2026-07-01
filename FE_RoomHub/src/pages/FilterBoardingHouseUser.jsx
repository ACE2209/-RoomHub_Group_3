import { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Form, Select, Slider } from "antd";

import {
  getBoardingHouseTypesForGuest,
  getMaxPriceBHForGuest,
} from "../api/boardingHouseAPI";
import { fetchDistricts, fetchProvinces, fetchWards } from "../api/apiAddress";

const DEFAULT_PRICE_RANGE = [0, 100000000];
const DEFAULT_RATING_RANGE = [1, 5];

const PRICE_OPTIONS = [
  { label: "<= 2 triệu", value: "0,2000000" },
  { label: "2 - 3 triệu", value: "2000000,3000000" },
  { label: "3 - 4 triệu", value: "3000000,4000000" },
  { label: "4 - 5 triệu", value: "4000000,5000000" },
  { label: "5 - 6 triệu", value: "5000000,6000000" },
  { label: "6 - 8 triệu", value: "6000000,8000000" },
  { label: "8 - 10 triệu", value: "8000000,10000000" },
  { label: "10 - 12 triệu", value: "10000000,12000000" },
  { label: "> 12 triệu", value: "12000000,100000000" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const normalizeFilters = (values, fullPriceRange) => {
  const priceRange = values.priceBucket
    ? values.priceBucket.split(",")
    : values.priceRange || fullPriceRange;
  const ratingRange = values.ratingRange || DEFAULT_RATING_RANGE;
  const isFullPriceRange =
    Number(priceRange[0]) === Number(fullPriceRange[0]) &&
    Number(priceRange[1]) === Number(fullPriceRange[1]);
  const isFullRatingRange =
    Number(ratingRange[0]) === DEFAULT_RATING_RANGE[0] &&
    Number(ratingRange[1]) === DEFAULT_RATING_RANGE[1];

  return {
    province: values.province || undefined,
    district: values.district || undefined,
    ward: values.ward || undefined,
    priceRange: isFullPriceRange ? undefined : priceRange.join(","),
    boardingHouseType: values.boardingHouseType || undefined,
    ratingRange: isFullRatingRange ? undefined : ratingRange.join(","),
  };
};

const FilterBoardingHouseUser = ({ setFilterValue }) => {
  const [form] = Form.useForm();
  const [boardingHouseTypes, setBoardingHouseTypes] = useState([]);
  const [typeLoading, setTypeLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [locationLoading, setLocationLoading] = useState({
    provinces: false,
    districts: false,
    wards: false,
  });
  const [priceRange, setPriceRange] = useState(DEFAULT_PRICE_RANGE);
  const [maxPriceRange, setMaxPriceRange] = useState(DEFAULT_PRICE_RANGE);
  const [ratingRange, setRatingRange] = useState(DEFAULT_RATING_RANGE);
  const selectedType = Form.useWatch("boardingHouseType", form);
  const selectedPriceBucket = Form.useWatch("priceBucket", form);

  const typeOptions = useMemo(
    () =>
      boardingHouseTypes.map((type) => ({
        value: type.value || type._id,
        label: type.label || type.name || "Boarding house",
      })),
    [boardingHouseTypes]
  );

  useEffect(() => {
    const fetchBoardingHouseTypes = async () => {
      try {
        setTypeLoading(true);
        const res = await getBoardingHouseTypesForGuest();
        setBoardingHouseTypes(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        console.error("Get boarding house types failed:", error);
        setBoardingHouseTypes([]);
      } finally {
        setTypeLoading(false);
      }
    };

    fetchBoardingHouseTypes();
  }, []);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLocationLoading((prev) => ({ ...prev, provinces: true }));
        const data = await fetchProvinces();
        setProvinces(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Get provinces failed:", error);
        setProvinces([]);
      } finally {
        setLocationLoading((prev) => ({ ...prev, provinces: false }));
      }
    };

    loadProvinces();
  }, []);

  useEffect(() => {
    const fetchMaxPrice = async () => {
      try {
        const res = await getMaxPriceBHForGuest();
        const maxPrice = Number(res?.maxPrice);
        const nextRange = [0, Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : DEFAULT_PRICE_RANGE[1]];

        setMaxPriceRange(nextRange);
        setPriceRange(nextRange);
        form.setFieldValue("priceRange", nextRange);
      } catch (error) {
        console.error("Get max boarding house price failed:", error);
      }
    };

    fetchMaxPrice();
  }, [form]);

  const handleApply = (values) => {
    setFilterValue(normalizeFilters(values, maxPriceRange));
  };

  const handleReset = () => {
    form.resetFields();
    setPriceRange(maxPriceRange);
    form.setFieldsValue({
      province: undefined,
      district: undefined,
      ward: undefined,
      priceRange: maxPriceRange,
      priceBucket: undefined,
      boardingHouseType: undefined,
      ratingRange: DEFAULT_RATING_RANGE,
    });
    setDistricts([]);
    setWards([]);
    setRatingRange(DEFAULT_RATING_RANGE);
    setFilterValue({});
  };

  const handleProvinceChange = async (value, option) => {
    form.setFieldsValue({ district: undefined, ward: undefined });
    setDistricts([]);
    setWards([]);

    if (!value || !option?.id) return;

    try {
      setLocationLoading((prev) => ({ ...prev, districts: true }));
      const data = await fetchDistricts(option.id);
      setDistricts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Get districts failed:", error);
      setDistricts([]);
    } finally {
      setLocationLoading((prev) => ({ ...prev, districts: false }));
    }
  };

  const handleDistrictChange = async (value, option) => {
    form.setFieldsValue({ ward: undefined });
    setWards([]);

    if (!value || !option?.id) return;

    try {
      setLocationLoading((prev) => ({ ...prev, wards: true }));
      const data = await fetchWards(option.id);
      setWards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Get wards failed:", error);
      setWards([]);
    } finally {
      setLocationLoading((prev) => ({ ...prev, wards: false }));
    }
  };

  const toggleType = (value) => {
    form.setFieldValue("boardingHouseType", selectedType === value ? undefined : value);
  };

  const togglePrice = (value) => {
    form.setFieldValue("priceBucket", selectedPriceBucket === value ? undefined : value);
  };

  return (
    <div className="guest-filter">
      <div className="guest-filter__head">
        <h3>Bộ lọc tìm kiếm</h3>
        <button type="button" onClick={handleReset}>
          Thiết lập lại
        </button>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          priceRange: maxPriceRange,
          ratingRange: DEFAULT_RATING_RANGE,
        }}
        onFinish={handleApply}
      >
        <section className="guest-filter__group">
          <h4>Địa điểm / Khu vực</h4>
          <div className="guest-filter__tabs" aria-hidden="true">
            <span className="active">Theo địa điểm</span>
            <span>Theo khu vực</span>
          </div>
          <Form.Item name="province">
            <Select
              allowClear
              showSearch
              loading={locationLoading.provinces}
              optionFilterProp="label"
              placeholder="Tất cả địa điểm"
              onChange={handleProvinceChange}
              options={provinces.map((province) => ({
                id: province.id,
                value: province.name,
                label: province.name,
              }))}
            />
          </Form.Item>
          <Form.Item name="district">
            <Select
              allowClear
              showSearch
              disabled={!districts.length}
              loading={locationLoading.districts}
              optionFilterProp="label"
              placeholder="Quận / Huyện"
              onChange={handleDistrictChange}
              options={districts.map((district) => ({
                id: district.id,
                value: district.name,
                label: district.name,
              }))}
            />
          </Form.Item>
          <Form.Item name="ward">
            <Select
              allowClear
              showSearch
              disabled={!wards.length}
              loading={locationLoading.wards}
              optionFilterProp="label"
              placeholder="Phường / Xã"
              options={wards.map((ward) => ({
                value: ward.name,
                label: ward.name,
              }))}
            />
          </Form.Item>
        </section>

        <section className="guest-filter__group">
          <h4>Loại chỗ ở</h4>
          <Form.Item name="boardingHouseType">
            <div className="guest-filter__checks">
              {typeLoading ? (
                <span className="guest-filter__muted">Đang tải loại chỗ ở...</span>
              ) : (
                typeOptions.map((type) => (
                  <Checkbox
                    key={type.value}
                    checked={selectedType === type.value}
                    onChange={() => toggleType(type.value)}
                  >
                    {type.label}
                  </Checkbox>
                ))
              )}
            </div>
          </Form.Item>
        </section>

        <section className="guest-filter__group">
          <h4>Mức giá</h4>
          <div className="guest-filter__quick-actions">
            <button type="button" onClick={() => form.setFieldValue("priceBucket", undefined)}>
              Chọn tất cả
            </button>
            <button type="button" onClick={() => form.setFieldValue("priceBucket", undefined)}>
              Xóa tất cả
            </button>
          </div>
          <Form.Item name="priceBucket">
            <div className="guest-filter__price-options">
              {PRICE_OPTIONS.map((option) => (
                <Checkbox
                  key={option.value}
                  checked={selectedPriceBucket === option.value}
                  onChange={() => togglePrice(option.value)}
                >
                  {option.label}
                </Checkbox>
              ))}
            </div>
          </Form.Item>
          <Form.Item name="priceRange">
            <div className="guest-filter__slider">
              <div className="guest-filter__price">
                <span>{formatCurrency(priceRange[0])}</span>
                <span>{formatCurrency(priceRange[1])}</span>
              </div>
              <Slider
                range
                min={maxPriceRange[0]}
                max={maxPriceRange[1]}
                step={500000}
                value={priceRange}
                tooltip={{ formatter: formatCurrency }}
                onChange={(value) => {
                  setPriceRange(value);
                  form.setFieldsValue({
                    priceRange: value,
                    priceBucket: undefined,
                  });
                }}
              />
            </div>
          </Form.Item>
        </section>

        <section className="guest-filter__group">
          <h4>Đánh giá</h4>
          <Form.Item name="ratingRange">
            <div className="guest-filter__slider">
              <div className="guest-filter__price">
                <span>Từ {ratingRange[0]} sao</span>
                <span>Đến {ratingRange[1]} sao</span>
              </div>
              <Slider
                range
                min={DEFAULT_RATING_RANGE[0]}
                max={DEFAULT_RATING_RANGE[1]}
                step={1}
                marks={{
                  1: "1",
                  2: "2",
                  3: "3",
                  4: "4",
                  5: "5",
                }}
                value={ratingRange}
                tooltip={{ formatter: (value) => `${value} sao` }}
                onChange={(value) => {
                  setRatingRange(value);
                  form.setFieldValue("ratingRange", value);
                }}
              />
            </div>
          </Form.Item>
        </section>

        <div className="guest-filter__actions">
          <Button type="primary" htmlType="submit">
            Áp dụng bộ lọc
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default FilterBoardingHouseUser;
