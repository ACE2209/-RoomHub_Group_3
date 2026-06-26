// ===== UTILITY FUNCTIONS =====

import mongoose from 'mongoose';
import BoardingHouse from '../models/boardingHouse.js';
import Room from '../models/room.js';

/**
 * Tự động cập nhật số lượng phòng cho boarding house
 * @param {string} boardingHouseId - ID của boarding house
 * @returns {Object} Thông tin cập nhật
 */
export const updateBoardingHouseRoomCounts = async (boardingHouseId) => {
    try {

        // Đếm tổng số phòng (không bao gồm phòng đã xóa)
        const totalRooms = await Room.countDocuments({
            boardingHouseId: new mongoose.Types.ObjectId(boardingHouseId)
        });

        // Đếm số phòng available
        const availableRooms = await Room.countDocuments({
            boardingHouseId: new mongoose.Types.ObjectId(boardingHouseId),
            isAvailable: true
        });

        // Cập nhật boarding house
        const updatedBoardingHouse = await BoardingHouse.findByIdAndUpdate(
            boardingHouseId,
            {
                totalRooms,
                availableRooms
            },
            { new: true }
        );

        if (!updatedBoardingHouse) {
            throw new Error('Boarding house not found');
        }


        return {
            success: true,
            boardingHouseId,
            totalRooms,
            availableRooms,
            updatedBoardingHouse
        };

    } catch (error) {
        console.error(`❌ Error updating room counts:`, error);
        throw error;
    }
};

/**
 * Batch cập nhật room counts cho nhiều boarding houses
 * @param {Array} boardingHouseIds - Mảng các boarding house IDs
 * @returns {Object} Kết quả batch update
 */
export const updateMultipleBoardingHouseRoomCounts = async (boardingHouseIds) => {
    try {

        const results = [];
        const errors = [];

        for (const boardingHouseId of boardingHouseIds) {
            try {
                const result = await updateBoardingHouseRoomCounts(boardingHouseId);
                results.push(result);
            } catch (error) {
                errors.push({
                    boardingHouseId,
                    error: error.message
                });
            }
        }



        return {
            success: true,
            results,
            errors,
            summary: {
                successful: results.length,
                failed: errors.length,
                total: boardingHouseIds.length
            }
        };

    } catch (error) {
        console.error(`❌ Error in batch update:`, error);
        throw error;
    }
};

/**
 * Cập nhật tất cả boarding houses
 * @returns {Object} Kết quả update toàn bộ
 */
export const updateAllBoardingHouseRoomCounts = async () => {
    try {

        // Lấy danh sách tất cả boarding house IDs
        const boardingHouses = await BoardingHouse.find({}, '_id').lean();
        const boardingHouseIds = boardingHouses.map(bh => bh._id.toString());


        // Sử dụng aggregation pipeline để tính toán hiệu quả hơn
        const roomCounts = await Room.aggregate([
            {
                $group: {
                    _id: '$boardingHouseId',
                    totalRooms: { $sum: 1 },
                    availableRooms: {
                        $sum: {
                            $cond: [{ $eq: ['$isAvailable', true] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Tạo map để lookup nhanh
        const countsMap = new Map();
        roomCounts.forEach(count => {
            countsMap.set(count._id.toString(), {
                totalRooms: count.totalRooms,
                availableRooms: count.availableRooms
            });
        });

        // Prepare bulk operations
        const bulkOps = [];
        let updatedCount = 0;

        for (const boardingHouseId of boardingHouseIds) {
            const counts = countsMap.get(boardingHouseId) || {
                totalRooms: 0,
                availableRooms: 0
            };

            bulkOps.push({
                updateOne: {
                    filter: { _id: new mongoose.Types.ObjectId(boardingHouseId) },
                    update: {
                        $set: {
                            totalRooms: counts.totalRooms,
                            availableRooms: counts.availableRooms
                        }
                    }
                }
            });

            updatedCount++;
        }

        // Execute bulk update
        if (bulkOps.length > 0) {
            const bulkResult = await BoardingHouse.bulkWrite(bulkOps);

        }

        return {
            success: true,
            totalProcessed: boardingHouseIds.length,
            updatedCount: bulkResult?.modifiedCount || 0,
            summary: roomCounts
        };

    } catch (error) {
        console.error(`❌ Error updating all boarding house room counts:`, error);
        throw error;
    }
};

// ===== MIDDLEWARE INTEGRATION =====

/**
 * Thêm vào Room Schema để tự động cập nhật khi có thay đổi
 */
export const addRoomCountMiddleware = (RoomSchema) => {
    // Post-save middleware - khi thêm room mới
    RoomSchema.post('save', async function (doc, next) {
        try {
            if (this.isNew || this.isModified('boardingHouseId') || this.isModified('isAvailable')) {
                await updateBoardingHouseRoomCounts(doc.boardingHouseId.toString());
            }
        } catch (error) {
            // Không throw error để không ảnh hưởng đến save operation
        }
        next();
    });

    // Post-remove middleware - khi xóa room
    RoomSchema.post('findOneAndDelete', async function (doc) {
        try {
            if (doc && doc.boardingHouseId) {
                await updateBoardingHouseRoomCounts(doc.boardingHouseId.toString());
            }
        } catch (error) {
            console.error('❌ Error in post-remove middleware:', error);
        }
    });

    // Post-deleteMany middleware
    RoomSchema.post('deleteMany', async function (result) {
        try {
            // Get all affected boarding houses before deletion
            const affectedBoardingHouses = new Set();

            // If we have conditions, find affected boarding houses
            if (this.getQuery()) {
                const affectedRooms = await this.model.find(this.getQuery(), 'boardingHouseId').lean();
                affectedRooms.forEach(room => {
                    if (room.boardingHouseId) {
                        affectedBoardingHouses.add(room.boardingHouseId.toString());
                    }
                });
            }

            // Update counts for all affected boarding houses
            if (affectedBoardingHouses.size > 0) {
                await updateMultipleBoardingHouseRoomCounts([...affectedBoardingHouses]);
            }
        } catch (error) {
            console.error('❌ Error in post-deleteMany middleware:', error);
        }
    });

    // Post-insertMany middleware
    RoomSchema.post('insertMany', async function (docs) {
        try {
            if (docs && docs.length > 0) {
                const affectedBoardingHouses = new Set();
                docs.forEach(doc => {
                    if (doc.boardingHouseId) {
                        affectedBoardingHouses.add(doc.boardingHouseId.toString());
                    }
                });

                if (affectedBoardingHouses.size > 0) {
                    await updateMultipleBoardingHouseRoomCounts([...affectedBoardingHouses]);
                }
            }
        } catch (error) {
            console.error('❌ Error in post-insertMany middleware:', error);
        }
    });
};



// ===== DEBUGGING UTILITIES =====

/**
 * Debug function để kiểm tra room counts của một boarding house
 */
export const debugBoardingHouseRoomCounts = async (boardingHouseId) => {
    try {

        // Lấy thông tin boarding house
        const boardingHouse = await BoardingHouse.findById(boardingHouseId);


        // Đếm thực tế từ database
        const actualTotalRooms = await Room.countDocuments({
            boardingHouseId: new mongoose.Types.ObjectId(boardingHouseId)
        });

        const actualAvailableRooms = await Room.countDocuments({
            boardingHouseId: new mongoose.Types.ObjectId(boardingHouseId),
            isAvailable: true
        });

        // So sánh với giá trị stored
        const storedTotalRooms = boardingHouse.totalRooms;
        const storedAvailableRooms = boardingHouse.availableRooms;

        const isConsistent = (
            actualTotalRooms === storedTotalRooms &&
            actualAvailableRooms === storedAvailableRooms
        );

        const debugInfo = {
            boardingHouseId,
            boardingHouseName: boardingHouse.name,
            stored: {
                totalRooms: storedTotalRooms,
                availableRooms: storedAvailableRooms
            },
            actual: {
                totalRooms: actualTotalRooms,
                availableRooms: actualAvailableRooms
            },
            isConsistent,
            differences: {
                totalRooms: actualTotalRooms - storedTotalRooms,
                availableRooms: actualAvailableRooms - storedAvailableRooms
            }
        };


        return debugInfo;
    } catch (error) {
        console.error(`❌ Error debugging boarding house room counts:`, error);
        return null;
    }
};

/**
 * Test function để kiểm tra và fix inconsistencies
 */
export const findAndFixInconsistencies = async () => {
    try {

        const boardingHouses = await BoardingHouse.find({}, '_id name totalRooms availableRooms');
        const inconsistencies = [];

        for (const bh of boardingHouses) {
            const debugInfo = await debugBoardingHouseRoomCounts(bh._id.toString());
            if (debugInfo && !debugInfo.isConsistent) {
                inconsistencies.push(debugInfo);
            }
        }



        return {
            totalChecked: boardingHouses.length,
            inconsistenciesFound: inconsistencies.length,
            inconsistencies
        };
    } catch (error) {
        throw error;
    }
};

// ===== EXPORT ALL FUNCTIONS =====
export default {
    updateBoardingHouseRoomCounts,
    updateMultipleBoardingHouseRoomCounts,
    updateAllBoardingHouseRoomCounts,
    addRoomCountMiddleware,
    debugBoardingHouseRoomCounts,
    findAndFixInconsistencies
};