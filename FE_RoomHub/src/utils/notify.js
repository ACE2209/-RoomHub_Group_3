import Swal from "sweetalert2";

const BRAND_COLOR = "#ff6b00";
const DANGER_COLOR = "#ff3b30";

// Toast nhỏ góc trên phải (cùng style với Profile.js, ReviewSection.js)
const toast = (icon, title) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: 1500,
  });

export const toastSuccess = (title) => toast("success", title);

export const toastInfo = (title) => toast("info", title);

// Hộp thoại xác nhận, trả về true nếu người dùng đồng ý
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
