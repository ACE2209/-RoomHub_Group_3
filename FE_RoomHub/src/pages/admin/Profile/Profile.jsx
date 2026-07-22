//test
import "./Profile.css";
import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Radio,
  Upload,
  Button,
  Card,
  Divider,
  Typography,
} from "antd";
import {
  PlusOutlined,
  LoadingOutlined,
  EditOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { getUser } from "../../../api/authAPI";
import { updateAccountFromProfile } from "../../../api/accountAPI";
import ChangeEmailModal from "./ChangeEmailModal";
import { useTheme } from "../../../context/themeContext";
import { useTranslation } from "react-i18next";
import { updateAvatar } from "../../../api/accountAPI";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(img);
};

const beforeUpload = (file) => {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  if (!isJpgOrPng) {
    toast.error("You can only upload JPG/PNG file!");
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    toast.error("Image must smaller than 2MB!");
  }
  return isJpgOrPng && isLt2M;
};

function Profile() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [formEmail] = Form.useForm();
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [username, setUsername] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [accountBalance, setAccountBalance] = useState(0);
  const [email, setEmail] = useState("");
  const { darkMode } = useTheme();
  const { t } = useTranslation("profile");

  const [changeEmailModalVisible, setChangeEmailModalVisible] = useState(false);

  const handleAvatarChange = (info) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }
    if (info.file.status === "done") {
      getBase64(info.file.originFileObj, (url) => {
        setLoading(false);
        setImageUrl(url);
        setImageError(false);
      });
    }
  };

  const handleImageError = () => {
    setImageUrl(null);
    setImageError(true);
  };

  const uploadButton = (
    <button
      style={{
        border: 0,
        background: "none",
        color: darkMode ? "#f0f0f0" : "#333",
      }}
      type="button"
    >
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div
        style={{
          marginTop: 8,
        }}
      >
        {t("avatar.upload")}
      </div>
    </button>
  );

  const loadProfileForm = (data) => {
    form.setFieldsValue({
      username: data.username,
      fullname: data.fullname,
      phoneNumber: data.phoneNumber,
      gender: data.gender,
    });
  };

  const getUserProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await getUser();
      setAccountBalance(res.accountBalance);

      const avatarUrl = res?.avatarImage?.url;
      if (avatarUrl) {
        setImageUrl(avatarUrl);
        setImageError(false);
      } else {
        setImageUrl(null);
        setImageError(true);
      }

      setUsername(res.username);
      setEmail(res.email);
      setIsOwner(res.role === "owner");

      loadProfileForm(res);
      setProfileLoading(false);
    } catch (error) {
      setProfileLoading(false);
      setImageUrl(null);
      setImageError(true);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const res = await updateAccountFromProfile(values);
      getUserProfile();
      setLoading(false);
      toast.success(t("actions.success"));
    } catch (error) {
      setLoading(false);
      toast.error(error?.response?.data?.message);
    }
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await updateAvatar(formData);
      toast.success("Upload avatar successfully!");
      getUserProfile();
      onSuccess();
    } catch (error) {
      toast.error("Upload avatar failed!");
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserProfile();
  }, []);

  const cardStyle = {
    background: darkMode ? "rgb(17 24 39)" : "#fff",
    boxShadow: darkMode
      ? "0 4px 12px rgba(0, 0, 0, 0.4)"
      : "0 4px 12px rgba(0, 0, 0, 0.1)",
    borderRadius: "12px",
    border: darkMode ? "1px solid #333" : "1px solid #eaeaea",
    transition: "all 0.3s ease",
  };

  return (
    <div
      className={`txt transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      }`}
    >
      {profileLoading ? (
        <div className="flex items-center justify-center p-8">
          <LoadingOutlined style={{ fontSize: 32 }} />
        </div>
      ) : (
        <div className="container py-8 px-4 mx-auto max-w-full lg:px-10 xl:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3">
              <Card
                style={cardStyle}
                className="overflow-hidden"
                bodyStyle={{ padding: "24px" }}
              >
                <div className="flex flex-col items-center">
                  <Upload
                    name="avatar"
                    listType="picture-circle"
                    className="avatarUpload avatar-uploader mb-6"
                    showUploadList={false}
                    customRequest={handleUpload}
                    beforeUpload={beforeUpload}
                    onChange={handleAvatarChange}
                    style={{ width: 135 }}
                  >
                    {imageUrl ? (
                      <div className="relative aspect-square w-70 rounded-full overflow-hidden">
                        <img
                          src={imageUrl}
                          alt="avatar"
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <EditOutlined className="text-white text-4xl" />
                        </div>
                      </div>
                    ) : (
                      uploadButton
                    )}
                  </Upload>

                  <Title
                    level={3}
                    className={`m-0 text-center ${
                      darkMode ? "text-gray-100" : "text-gray-800"
                    }`}
                  >
                    <span className="text-gray-800 dark:text-white">
                      @{username}
                    </span>
                  </Title>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-9">
              <Card
                style={cardStyle}
                className="overflow-hidden"
                bodyStyle={{ padding: "28px" }}
              >
                <div className="mb-8">
                  <Title
                    level={4}
                    className={`mb-6 ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    <span className="text-gray-800 dark:text-white">
                      {t("title")}
                    </span>
                  </Title>
                  <Form form={formEmail} layout="vertical" className="mb-4">
                    <Form.Item
                      label={
                        <span
                          className={`text-2xl font-semibold ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          <MailOutlined className="mr-2" />
                          {t("email.label")}
                        </span>
                      }
                      name="email"
                      initialValue={email}
                    >
                      <div className="flex items-end gap-4 flex-col md:flex-row">
                        <Input
                          size="large"
                          placeholder={t("email.placeholder")}
                          name="email"
                          value={email}
                          disabled
                          style={{
                            flexGrow: 1,
                            color: darkMode ? "gray" : "",
                          }}
                        />
                        <Button
                          name="change-email"
                          type="primary"
                          size="large"
                          onClick={() => setChangeEmailModalVisible(true)}
                          loading={loading}
                          icon={<EditOutlined />}
                        >
                          {t("actions.save")}
                        </Button>
                      </div>
                    </Form.Item>
                  </Form>
                </div>
                <Divider
                  className={darkMode ? "border-gray-700" : "border-gray-200"}
                />
                <div>
                  <Title
                    level={4}
                    className={`mb-6 ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    <span className="text-gray-800 dark:text-white">
                      {t("description")}
                    </span>
                  </Title>
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    className={darkMode ? "dark-form" : ""}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Form.Item
                        label={
                          <span
                            className={`text-2xl font-semibold ${
                              darkMode ? "text-gray-200" : "text-gray-800"
                            }`}
                          >
                            <UserOutlined className="mr-2" />
                            {t("fullName.label")}
                          </span>
                        }
                        name="fullname"
                        rules={[
                          {
                            required: true,
                            message: t("fullName.required"),
                          },
                        ]}
                      >
                        <Input
                          size="large"
                          placeholder={t("fullName.placeholder")}
                          className={
                            darkMode
                              ? "bg-gray-800 border-gray-700 text-gray-300"
                              : ""
                          }
                        />
                      </Form.Item>
                      <Form.Item
                        label={
                          <span
                            className={`text-2xl font-semibold text-gray-800 dark:text-white `}
                          >
                            <PhoneOutlined className="mr-2" />
                            {t("phone.label")}
                          </span>
                        }
                        name="phoneNumber"
                        rules={[
                          {
                            required: true,
                            message: t("phone.required"),
                          },
                          {
                            len: 10,
                            message: t("phone.invalidFormat"),
                          },
                        ]}
                      >
                        <Input
                          type="number"
                          size="large"
                          placeholder={t("phone.placeholder")}
                          className={
                            darkMode
                              ? "bg-gray-800 border-gray-700 text-gray-300"
                              : ""
                          }
                        />
                      </Form.Item>
                    </div>
                    <Form.Item
                      label={
                        <span
                          className={`text-2xl font-semibold ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {t("gender.label")}
                        </span>
                      }
                      name="gender"
                    >
                      <Radio.Group className={darkMode ? "text-gray-300" : ""}>
                        <Radio
                          value="male"
                          className={darkMode ? "text-gray-300" : ""}
                        >
                          {t("gender.options.male")}
                        </Radio>
                        <Radio
                          value="female"
                          className={darkMode ? "text-gray-300" : ""}
                        >
                          {t("gender.options.female")}
                        </Radio>
                        <Radio
                          value="other"
                          className={darkMode ? "text-gray-300" : ""}
                        >
                          {t("gender.options.other")}
                        </Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item className="mt-8">
                      <Button
                        type="primary"
                        size="large"
                        htmlType="submit"
                        loading={loading}
                        icon={<EditOutlined />}
                        className="min-w-40"
                      >
                        {t("actions.save")}
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
      <ChangeEmailModal
        isOpen={changeEmailModalVisible}
        setToggleModal={setChangeEmailModalVisible}
        email={email}
      />
    </div>
  );
}

export default Profile;
