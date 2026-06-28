import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Select, Slider } from "antd";

import {
  getBoardingHouseTypesForGuest,
  getMaxPriceBHForGuest,
} from "../api/boardingHouseAPI";

const DEFAULT_PRICE_RANGE = [0, 100000000];
const DEFAULT_RATING_RANGE = [1, 5];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const normalizeFilters = (values, fullPriceRange) => {
  const priceRange = values.priceRange || fullPriceRange;
  const ratingRange = values.ratingRange || DEFAULT_RATING_RANGE;
  const isFullPriceRange =
    Number(priceRange[0]) === Number(fullPriceRange[0]) &&
    Number(priceRange[1]) === Number(fullPriceRange[1]);
  const isFullRatingRange =
    Number(ratingRange[0]) === DEFAULT_RATING_RANGE[0] &&
    Number(ratingRange[1]) === DEFAULT_RATING_RANGE[1];

  return {
    name: values.name?.trim() || undefined,
    priceRange: isFullPriceRange ? undefined : priceRange.join(","),
    boardingHouseType: values.boardingHouseType || undefined,
    ratingRange: isFullRatingRange ? undefined : ratingRange.join(","),
  };
};

const FilterBoardingHouseUser = ({ setFilterValue }) => {
  const [form] = Form.useForm();
  const [boardingHouseTypes, setBoardingHouseTypes] = useState([]);
  const [typeLoading, setTypeLoading] = useState(false);
  const [priceRange, setPriceRange] = useState(DEFAULT_PRICE_RANGE);
  const [maxPriceRange, setMaxPriceRange] = useState(DEFAULT_PRICE_RANGE);
  const [ratingRange, setRatingRange] = useState(DEFAULT_RATING_RANGE);

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
      name: undefined,
      priceRange: maxPriceRange,
      boardingHouseType: undefined,
      ratingRange: DEFAULT_RATING_RANGE,
    });
    setRatingRange(DEFAULT_RATING_RANGE);
    setFilterValue({});
  };

  return (
    <div className="guest-filter">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          priceRange: maxPriceRange,
          ratingRange: DEFAULT_RATING_RANGE,
        }}
        onFinish={handleApply}
      >
        <div className="guest-filter__grid">
          <Form.Item label="Name" name="name">
            <Input allowClear placeholder="Search boarding house name" />
          </Form.Item>

          <Form.Item label="Price range" name="priceRange">
            <div className="guest-filter__slider">
              <div className="guest-filter__price">
                <span>From {formatCurrency(priceRange[0])}</span>
                <span>To {formatCurrency(priceRange[1])}</span>
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
                  form.setFieldValue("priceRange", value);
                }}
              />
            </div>
          </Form.Item>

          <Form.Item label="Boarding house type" name="boardingHouseType">
            <Select
              allowClear
              loading={typeLoading}
              options={typeOptions}
              placeholder="Select type"
            />
          </Form.Item>

          <Form.Item label="Rating" name="ratingRange">
            <div className="guest-filter__slider">
              <div className="guest-filter__price">
                <span>From {ratingRange[0]} star</span>
                <span>To {ratingRange[1]} star</span>
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
                tooltip={{ formatter: (value) => `${value} star` }}
                onChange={(value) => {
                  setRatingRange(value);
                  form.setFieldValue("ratingRange", value);
                }}
              />
            </div>
          </Form.Item>
        </div>

        <div className="guest-filter__actions">
          <Button htmlType="button" onClick={handleReset}>
            Reset
          </Button>
          <Button type="primary" htmlType="submit">
            Apply
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default FilterBoardingHouseUser;
