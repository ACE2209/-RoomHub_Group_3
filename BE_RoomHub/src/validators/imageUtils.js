/**
 * Utility functions cho việc xử lý ảnh
 */

/**
 * Kiểm tra nhanh một đường dẫn ảnh có hợp lệ không
 * @param {string} imageUrl - URL ảnh cần kiểm tra
 * @param {number} timeout - Thời gian timeout (ms)
 * @returns {Promise<boolean>} - true nếu ảnh hợp lệ
 */
export const isValidImageUrl = (imageUrl, timeout = 5000) => {
    return new Promise((resolve) => {
        if (!imageUrl) {
            resolve(false);
            return;
        }

        const img = new Image();

        const timeoutId = setTimeout(() => {
            img.onload = null;
            img.onerror = null;
            resolve(false);
        }, timeout);

        img.onload = () => {
            clearTimeout(timeoutId);
            resolve(true);
        };

        img.onerror = () => {
            clearTimeout(timeoutId);
            resolve(false);
        };

        img.src = imageUrl;
    });
};

/**
 * Kiểm tra nhiều đường dẫn ảnh cùng lúc
 * @param {Array<string>} imageUrls - Mảng các URL ảnh
 * @param {number} timeout - Thời gian timeout cho mỗi ảnh
 * @returns {Promise<Array<{url: string, isValid: boolean}>>}
 */
export const validateMultipleImages = async (imageUrls, timeout = 5000) => {
    const promises = imageUrls.map(async (url) => ({
        url,
        isValid: await isValidImageUrl(url, timeout)
    }));

    return Promise.all(promises);
};

/**
 * Lấy đường dẫn ảnh hợp lệ đầu tiên từ danh sách
 * @param {Array<string>} imageUrls - Mảng các URL ảnh
 * @param {string} fallback - Ảnh dự phòng
 * @returns {Promise<string>} - URL ảnh hợp lệ hoặc fallback
 */
export const getFirstValidImage = async (imageUrls, fallback = null) => {
    for (const url of imageUrls) {
        const isValid = await isValidImageUrl(url);
        if (isValid) {
            return url;
        }
    }
    return fallback;
};