import { useState, useMemo, useCallback } from "react";
import { Divider, Table as AntTable, Button, Select } from "antd";
import PropTypes from "prop-types";
import { useTheme } from "../../context/themeContext";
import classNames from "classnames";
import { useTranslation } from "react-i18next";

const { Option } = Select;

const getTableStyles = (isDarkMode) => `
  .custom-table .ant-table .ant-table-container .ant-table-body,
  .custom-table .ant-table .ant-table-container .ant-table-content {
    scrollbar-width: none;
    scrollbar-color: #eaeaea transparent;
    scrollbar-gutter: stable;
  }

  ${
    isDarkMode
      ? `
    .ant-table-dark {
      background-color: rgb(55 65 81);
      color: #f9fafb;
    }

    .ant-table-dark .ant-table-thead > tr > th {
      background-color: #2d3748;
      color: #f9fafb;
      border-color: rgba(255, 255, 255, 0.1);
    }

    .ant-table-dark .ant-table-tbody > tr > td {
      color: #f9fafb;
      border-color: rgba(255, 255, 255, 0.1);
    }

    .ant-table-dark .ant-table-tbody > tr:hover > td {
      background-color: #1f2937;
    }

    .ant-pagination-dark .ant-pagination-prev .ant-pagination-item-link,
    .ant-pagination-dark .ant-pagination-next .ant-pagination-item-link {
      background-color: #2d3748 !important;
      color: #f9fafb !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    .ant-pagination-dark .ant-pagination-item {
      background-color: #2d3748 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    .ant-pagination-dark .ant-pagination-item a {
      color: #f9fafb !important;
    }

    .ant-pagination-dark .ant-pagination-item-active {
      background-color: #3b82f6 !important;
      border-color: #3b82f6 !important;
    }

    .ant-pagination-dark .ant-pagination-item-active a {
      color: #ffffff !important;
    }
  `
      : ""
  }
`;

const TableCustom = ({
  columns,
  data = [],
  checkbox = false,
  onProcessData,
  selectOptions = [],
  enableCount = true,
  loading = false,
  onRowClick,
  scrollY = null,
  pagination = {},
  onChange = () => {},
  tableName,
  noDataText = "No data available",
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [dynamicSelect, setDynamicSelect] = useState(null);
  const { darkMode } = useTheme();
  const { t } = useTranslation("common");

  const paginationConfig = useMemo(
    () => ({
      showSizeChanger: true,
      pageSize: 10,
      showTotal: (total, range) => (
        <span
          style={{
            color: darkMode ? "#ddd" : "#333",
            userSelect: "none",
            fontWeight: "500",
          }}
        >
          {`${range[0]}-${range[1]} / ${total} ${tableName || ''}`}
        </span>
      ),
      ...pagination,
      classNames: classNames(
        "ant-pagination",
        darkMode ? "ant-pagination-dark" : ""
      ),
    }),
    [pagination, darkMode, t, tableName]
  );

  const isSubmitDisabled = useMemo(() => {
    return !(selectedRows.length > 0 && dynamicSelect !== null);
  }, [selectedRows.length, dynamicSelect]);

  const numberedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const pageSize = pagination.pageSize || 10;
    const currentPage = pagination.current || 1;

    const startNumber = (currentPage - 1) * pageSize + 1;

    return data.map((item, index) => ({
      ...item,
      number: startNumber + index,
    }));
  }, [data, pagination.current, pagination.pageSize]);

  const numberedColumns = useMemo(() => {
    if (!enableCount) return columns;

    return [
      {
        title: "No.",
        dataIndex: "number",
        key: "number",
        width: 60,
        render: (_, record) => <span>{record.number}</span>,
      },
      ...columns,
    ];
  }, [columns, enableCount]);

  const onSelectChange = useCallback((newSelectedRowKeys, newSelectedRows) => {
    setSelectedRowKeys(newSelectedRowKeys);
    setSelectedRows(newSelectedRows);
  }, []);

  const handleSelectChange = useCallback((value) => {
    setDynamicSelect(value);
  }, []);

  const handleProcessData = useCallback(() => {
    if (onProcessData && typeof onProcessData === "function") {
      onProcessData({
        formValues: { dynamicSelect },
        selectedRows: selectedRows,
      });
    }

    setDynamicSelect(null);
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }, [dynamicSelect, selectedRows, onProcessData]);

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: onSelectChange,
      getCheckboxProps: (record) => ({
        name: record.name,
        disabled: false,
      }),
    }),
    [selectedRowKeys, onSelectChange]
  );

  const handleRowClick = useCallback(
    (record) => {
      if (onRowClick && typeof onRowClick === "function") {
        onRowClick(record);
      }
    },
    [onRowClick]
  );

  return (
    <div>
      <style>{getTableStyles(darkMode)}</style>

      {checkbox && (
        <>
          <Divider className={darkMode ? "border-gray-700" : ""} />
          <div>
            <label>Select Option:</label>
            <Select
              placeholder="Select an option"
              value={dynamicSelect}
              onChange={handleSelectChange}
            >
              {selectOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              onClick={handleProcessData}
              disabled={isSubmitDisabled}
            >
              Submit
            </Button>
          </div>
        </>
      )}

      <div className="w-full">
        <div className="max-w-full ">
          <AntTable
            pagination={{
              className: paginationConfig.classNames,
              ...paginationConfig,
            }}
            scroll={{
              x: "max-content",
              y: scrollY,
            }}
            className={`text-xs sm:text-sm md:text-base ${
              darkMode ? "ant-table-dark" : ""
            } custom-table`}
            rowKey="_id"
            rowSelection={checkbox ? rowSelection : null}
            columns={numberedColumns}
            dataSource={numberedData}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
            })}
            loading={loading}
            onChange={onChange}
            components={
              darkMode
                ? {
                    header: {
                      cell: (props) => (
                        <th
                          {...props}
                          className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                        />
                      ),
                    },
                    body: {
                      row: (props) => (
                        <tr
                          {...props}
                          className="dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                        />
                      ),
                      cell: (props) => (
                        <td
                          {...props}
                          className="dark:text-gray-100 dark:border-gray-700"
                        />
                      ),
                    },
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
};

TableCustom.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  checkbox: PropTypes.bool,
  onProcessData: PropTypes.func,
  selectOptions: PropTypes.array,
  enableCount: PropTypes.bool,
  loading: PropTypes.bool,
  onRowClick: PropTypes.func,
  scrollY: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  pagination: PropTypes.object,
  onChange: PropTypes.func,
  noDataText: PropTypes.string,
  tableName: PropTypes.string,
};

export default TableCustom;
