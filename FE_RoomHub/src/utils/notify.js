import Swal from "sweetalert2";

const BRAND_COLOR = "#ff6b00";
const DANGER_COLOR = "#ff3b30";

const toast = (icon, title) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,

    // Màu nền
    background: "#ffffff",

    // Màu chữ
    color: "#1f2937",

    // Màu icon
    iconColor:
      icon === "success"
        ? "#f59e0b"
        : icon === "info"
          ? BRAND_COLOR
          : icon === "error"
            ? DANGER_COLOR
            : "#f59e0b",

    customClass: {
      popup: "roomhub-toast",
      title: "roomhub-toast-title",
    },
  });

export const toastSuccess = (title) => toast("success", title);
export const toastInfo = (title) => toast("info", title);

export const confirmAction = async ({
  title,
  text,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: danger ? DANGER_COLOR : BRAND_COLOR,
    cancelButtonColor: "#aaa",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });

  return result.isConfirmed;
};