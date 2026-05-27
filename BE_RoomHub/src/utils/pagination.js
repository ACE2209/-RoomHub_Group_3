/**
 * Hàm helper tái sử dụng cho phân trang API
 * @param {Object} model - Mongoose model
 * @param {Object} options - Các tùy chọn phân trang
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Promise chứa kết quả phân trang
 */
const paginate = async (model, options = {}, req) => {
    try {
        // Lấy các tham số phân trang
        const page = parseInt(req.query.page) || options.defaultPage || 1;
        const limit = parseInt(req.query.limit) || options.defaultLimit || 10;

        // Xây dựng filter (có thể mở rộng)
        const filter = { ...options.filter || {} };

        // Xử lý tìm kiếm nếu có
        if (req.query.searchField && req.query.searchValue) {
            // Hỗ trợ tìm kiếm nhiều trường
            if (req.query.searchField.includes(',')) {
                const searchFields = req.query.searchField.split(',');
                const searchQueries = searchFields.map(field => ({
                    [field.trim()]: new RegExp(req.query.searchValue, 'i')
                }));
                filter.$or = searchQueries;
            } else {
                filter[req.query.searchField] = new RegExp(req.query.searchValue, 'i');
            }
        }

        // Xử lý filter từ query params
        if (options.allowQueryFilters && Array.isArray(options.allowQueryFilters)) {
            options.allowQueryFilters.forEach(field => {
                if (req.query[field]) {
                    filter[field] = req.query[field];
                }
            });
        }

        // Xử lý sắp xếp
        const sortField = req.query.sortField || options.sortField || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortField]: sortOrder };

        // Xử lý projection
        let select = '';
        if (req.query.fields) {
            select = req.query.fields.split(',').join(' ');
        } else if (options.fields) {
            select = options.fields;
        }

        // Xử lý populate
        let populateOptions = options.populate || [];

        // Đếm tổng số lượng dữ liệu trong database (không có filter)
        const totalData = await model.countDocuments({});

        // Thực hiện các truy vấn
        const [totalItems, items] = await Promise.all([
            model.countDocuments(filter),
            model.find(filter)
                .sort(sort)
                .select(select)
                .skip((page - 1) * limit)
                .limit(limit)
                .populate(populateOptions)
                .lean()
        ]);

        // Tính toán phân trang
        const totalPages = Math.ceil(totalItems / limit);

        // Tạo các URL cho các trang
        const baseUrl = req ? `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}` : '';
        const buildUrl = (pg) => {
            if (!req) return null;
            const queryParams = new URLSearchParams(req.query);
            queryParams.set('page', pg);
            return `${baseUrl}?${queryParams.toString()}`;
        };

        // Tạo đối tượng phân trang
        const pagination = {
            currentPage: page,
            totalPages,
            totalItems,
            totalData,  // Thêm tổng lượng dữ liệu trong collection
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };

        // Thêm liên kết nếu có
        if (pagination.hasNextPage) {
            pagination.nextPage = buildUrl(page + 1);
        }
        if (pagination.hasPrevPage) {
            pagination.prevPage = buildUrl(page - 1);
        }

        return {
            success: true,
            pagination,
            data: items
        };

    } catch (error) {
        console.error('Pagination error:', error);
        throw error;
    }
};

export default paginate