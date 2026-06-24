import { Button } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  UndoOutlined,
  PlusOutlined,
  RestOutlined,
  FilterOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const ButtonCustom = ({
  title,
  size = "medium",
  btnDelete = false,
  btnUpdate = false,
  btnRestore = false,
  btnTrash = false,
  btnAdd = false,
  btnFilter = false,
  btnReplay = false,
  btnCancel = false,
  btnReject = false,
  btnAccept = false,
  width = "auto",
  height = "auto",
  onClick,
  icon,
  iconPosition = "left",
  className,
  style,
  bgColor,
  txtColor,
  disabled,
  ...props
}) => {
  const presetIcon = btnDelete ? (
    <DeleteOutlined />
  ) : btnUpdate ? (
    <EditOutlined />
  ) : btnRestore ? (
    <UndoOutlined />
  ) : btnTrash ? (
    <RestOutlined />
  ) : btnAdd ? (
    <PlusOutlined />
  ) : btnFilter ? (
    <FilterOutlined />
  ) : btnReplay ? (
    <SendOutlined />
  ) : btnReject ? (
    <CloseOutlined />
  ) : btnAccept ? (
    <CheckOutlined />
  ) : null;

  const backgroundClass = btnDelete
    ? "bg-red-500 hover:bg-red-600 text-white"
    : btnUpdate
      ? "bg-blue-500 hover:bg-blue-600 text-white"
      : btnRestore
        ? "bg-green-500 hover:bg-green-600 text-white"
        : btnTrash
          ? "bg-yellow-500 hover:bg-yellow-600 text-white"
          : btnAdd
            ? "bg-primary text-white"
            : btnFilter
              ? "bg-teal-500 hover:bg-teal-600 text-white"
              : btnReplay
                ? "bg-purple-500 hover:bg-purple-600 text-white"
                : btnCancel
                  ? "bg-red-500 hover:text-black text-white"
                  : btnReject
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : btnAccept
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300";

  const customStyle = {
    width: width !== "auto" ? width : undefined,
    height: height !== "auto" ? height : undefined,
    ...style,
  };

  return (
    <div>
      <Button
        onClick={onClick}
        className={`${backgroundClass} rounded-xl flex items-center justify-center border-none gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={{
          ...customStyle,
          backgroundColor: bgColor,
          color: txtColor,
        }}
        size={size}
        disabled={disabled}
        {...props}
      >
        {iconPosition === "left" && (presetIcon || icon)}
        {title}
        {iconPosition === "right" && (presetIcon || icon)}
      </Button>
    </div>
  );
};

export default ButtonCustom;
