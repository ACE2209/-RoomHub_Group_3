import { Modal, Form, Input } from "antd";
import React, { useEffect } from "react";
import { sendOTPChangeEmail } from "../../../api/accountAPI";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/themeContext";

export default function ChangeEmailModal({ isOpen, email, setToggleModal }) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const { darkMode } = useTheme();

  const onCancel = () => {
    setToggleModal(false);
    form.setFieldsValue({ email });
  };

  const handleSave = async (values) => {
    try {
      setLoading(true);
      const res = await sendOTPChangeEmail(values);
      toast.success(res.message);
      navigate("/verify-change-email", {
        state: { email: res.email, token: res.token },
      });
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      onCancel();
      setLoading(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({ email });
  }, [email]);

  return (
    <>
      {darkMode && (
        <style>{`
          .change-email-modal-dark .ant-modal-content {
            background-color: #111827 !important;
            border-color: #374151 !important;
          }
          .change-email-modal-dark .ant-modal-header {
            background-color: #111827 !important;
            border-bottom-color: #374151 !important;
          }
          .change-email-modal-dark .ant-modal-title {
            color: #f9fafb !important;
          }
          .change-email-modal-dark .ant-modal-body {
            background-color: #111827 !important;
            color: #f9fafb !important;
          }
          .change-email-modal-dark .ant-modal-footer {
            background-color: #111827 !important;
            border-top-color: #374151 !important;
          }
          .change-email-modal-dark .ant-modal-close {
            color: #9ca3af !important;
          }
          .change-email-modal-dark .ant-modal-close:hover {
            color: #f9fafb !important;
          }
          .change-email-modal-dark .ant-btn-default {
            background-color: #1f2937 !important;
            border-color: #374151 !important;
            color: #f9fafb !important;
          }
          .change-email-modal-dark .ant-btn-default:hover {
            background-color: #374151 !important;
            border-color: #3b82f6 !important;
            color: #3b82f6 !important;
          }
          .change-email-modal-dark .ant-btn-primary {
            background-color: #3b82f6 !important;
            border-color: #3b82f6 !important;
            color: #ffffff !important;
          }
          .change-email-modal-dark .ant-btn-primary:hover {
            background-color: #2563eb !important;
            border-color: #2563eb !important;
          }
          .change-email-modal-dark .ant-form-item-label > label {
            color: #f9fafb !important;
          }
          .change-email-modal-dark .ant-input {
            background-color: #1f2937 !important;
            border-color: #374151 !important;
            color: #f9fafb !important;
          }
          .change-email-modal-dark .ant-input:hover {
            border-color: #3b82f6 !important;
          }
          .change-email-modal-dark .ant-input:focus {
            background-color: #1f2937 !important;
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
          }
          .change-email-modal-dark .ant-input::placeholder {
            color: #9ca3af !important;
          }
        `}</style>
      )}

      <Modal
        title="Change Email"
        open={isOpen}
        onCancel={onCancel}
        onOk={() => form.submit()}
        confirmLoading={loading}
        destroyOnClose
        className={darkMode ? "change-email-modal-dark" : ""}
        maskStyle={darkMode ? { backgroundColor: "rgba(17, 24, 39, 0.8)" } : {}}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item name="email" className="mt-10">
            <Input size="large" placeholder="Enter your email" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
