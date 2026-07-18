// Hệ style dùng chung cho các form quản lý nhà trọ của admin,
// đồng bộ với ngôn ngữ thiết kế của các trang admin khác (AccountManagementPage, BoardingHouseManagementPage...).

export const titleStyle = {
  margin: "0 0 18px",
  fontSize: 24,
  fontWeight: 700,
  color: "#27364a",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

export const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "18px",
  marginBottom: "16px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

export const sectionTitleStyle = {
  margin: "0 0 14px",
  fontSize: 16,
  fontWeight: 700,
  color: "#344054",
};

export const gridTwoStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "14px",
};

export const gridThreeStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "14px",
};

export const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

export const labelStyle = {
  color: "#344054",
  fontSize: "13px",
  fontWeight: 700,
};

export const inputStyle = {
  border: "1px solid #d0d5dd",
  borderRadius: "6px",
  minHeight: "42px",
  padding: "0 12px",
  color: "#344054",
  outline: "none",
  background: "#ffffff",
  fontSize: 14,
  width: "100%",
};

export const uploadBoxStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  border: "1px dashed #d0d5dd",
  borderRadius: "8px",
  padding: "22px",
  maxWidth: 420,
  cursor: "pointer",
  background: "#f9fafb",
};

export const uploadTitleStyle = {
  color: "#344054",
  fontSize: 14,
  fontWeight: 600,
};

export const uploadHintStyle = {
  color: "#667085",
  fontSize: 12,
};

export const primaryPreviewWrapStyle = {
  position: "relative",
  display: "inline-block",
  maxWidth: 420,
};

export const primaryPreviewStyle = {
  width: "100%",
  maxHeight: 260,
  objectFit: "cover",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

export const otherImagesGridStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginTop: 8,
};

export const otherPreviewWrapStyle = {
  position: "relative",
};

export const otherPreviewStyle = {
  width: 120,
  height: 120,
  objectFit: "cover",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

export const removeImageBtnStyle = {
  position: "absolute",
  top: 6,
  right: 6,
  width: 24,
  height: 24,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fef3f2",
  color: "#d92d20",
  border: "1px solid #fecdca",
  borderRadius: "999px",
  cursor: "pointer",
};

export const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "#ecfdf3",
  color: "#087443",
  padding: "6px 12px",
  borderRadius: "999px",
  fontWeight: 700,
  fontSize: 13,
};

export const footerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginBottom: "24px",
};

export const secondaryBtnStyle = {
  background: "#ffffff",
  color: "#344054",
  border: "1px solid #d0d5dd",
  padding: "10px 22px",
  borderRadius: "6px",
  fontWeight: 700,
  cursor: "pointer",
};

export const primaryBtnStyle = (disabled) => ({
  background: "#12b76a",
  color: "white",
  border: "none",
  padding: "10px 22px",
  borderRadius: "6px",
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
});
