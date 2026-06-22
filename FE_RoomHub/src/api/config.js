const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

export default API_URL;

export const getToken = () => localStorage.getItem("token");

export const authHeaders = () => {
  const token = getToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const parseJsonResponse = async (res) => {
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
};

export const getImageUrl = (imageUrl, fallback = "/image/logoconen.png") => {
  if (!imageUrl) return fallback;

  const normalizedUrl = String(imageUrl).replace(/\\/g, "/").trim();

  if (!normalizedUrl) return fallback;

  if (
    normalizedUrl.startsWith("http://") ||
    normalizedUrl.startsWith("https://") ||
    normalizedUrl.startsWith("data:") ||
    normalizedUrl.startsWith("blob:")
  ) {
    return normalizedUrl;
  }

  if (normalizedUrl.startsWith("/image/")) {
    return normalizedUrl;
  }

  if (normalizedUrl.startsWith("public/")) {
    return `${API_URL}/${normalizedUrl.replace(/^public\//, "")}`;
  }

  if (normalizedUrl.startsWith("/public/")) {
    return `${API_URL}${normalizedUrl.replace(/^\/public/, "")}`;
  }

  if (normalizedUrl.startsWith("/")) {
    return `${API_URL}${normalizedUrl}`;
  }

  return `${API_URL}/${normalizedUrl}`;
};

export const getImageSource = (image, fallback = "/image/logoconen.png") => {
  if (!image) return fallback;

  if (typeof image === "string") {
    return getImageUrl(image, fallback);
  }

  if (Array.isArray(image)) {
    const primaryImage = image.find((item) => item?.isPrimary);
    return getImageSource(primaryImage || image[0], fallback);
  }

  if (typeof image === "object") {
    return getImageSource(
      image.imageUrl ||
        image.url ||
        image.secure_url ||
        image.path ||
        image.src ||
        image.image?.imageUrl ||
        image.images?.imageUrl ||
        image.images?.[0]?.imageUrl,
      fallback
    );
  }

  return fallback;
};

export const setFallbackImage = (event, fallback = "/image/logoconen.png") => {
  if (event.currentTarget.src.endsWith(fallback)) return;
  event.currentTarget.src = fallback;
};
