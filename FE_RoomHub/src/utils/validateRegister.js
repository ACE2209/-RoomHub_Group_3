export const validateRegister = (data) => {
    let errors = {};

    if (!data.fullName) {
        errors.fullName = "Vui lòng nhập họ và tên";
    }

    if (!data.email || !data.email.includes("@")) {
        errors.email = "Email không hợp lệ";
    }

    if (!/^[0-9]{10}$/.test(data.phone)) {
        errors.phone = "Số điện thoại phải gồm 10 chữ số";
    }

    if (!data.password || data.password.length < 6) {
        errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (!data.address) {
        errors.address = "Vui lòng nhập địa chỉ";
    }

    return errors;
};