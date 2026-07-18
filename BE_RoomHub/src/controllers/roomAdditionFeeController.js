import RoomAdditionalFees from "../models/roomAdditionalFees.js";
import Room from "../models/room.js";
import BoardingHouse from "../models/boardingHouse.js";
import paginate from "../utils/pagination.js";

// Danh mục tên phí bổ sung gợi ý cho FE dựng dropdown (thay vì cho gõ tay).
// Nhóm "Khác" (isCustom: true) cho phép người dùng tự nhập tên phí không có sẵn.
export const ROOM_ADDITIONAL_FEE_NAME_OPTIONS = [
  {
    group: "Phí dịch vụ",
    options: [
      { value: "Internet", label: "Internet" },
      { value: "Truyền hình cáp", label: "Truyền hình cáp" },
      { value: "Phí vệ sinh", label: "Phí vệ sinh" },
      { value: "Phí thang máy", label: "Phí thang máy" },
    ],
  },
  {
    group: "Phí tiện ích",
    options: [{ value: "Phí gửi xe", label: "Phí gửi xe (bãi đậu xe)" }],
  },
  {
    group: "Phí sử dụng vượt định mức",
    options: [
      { value: "Phí điện vượt định mức", label: "Phí điện vượt định mức" },
      { value: "Phí nước vượt định mức", label: "Phí nước vượt định mức" },
    ],
  },
  {
    group: "Phí phạt",
    options: [
      { value: "Phí phạt đóng trễ", label: "Phí phạt đóng tiền muộn" },
      {
        value: "Phí bồi thường hư hỏng",
        label: "Phí bồi thường hư hỏng tài sản",
      },
    ],
  },
  {
    group: "Khác",
    options: [
      { value: "Khác", label: "Khác (tự nhập tên phí)", isCustom: true },
    ],
  },
];

// ----- Các hàm đồng bộ Room.additionalFees với RoomAdditionalFees -----
// Mục tiêu: mỗi khi Thêm / Sửa / Xoá một khoản phí bổ sung, dữ liệu
// tổng hợp trong Room cũng được cập nhật theo, để các nơi khác (trang
// chi tiết phòng, danh sách phòng...) có thể đọc trực tiếp từ Room mà
// không cần join thêm sang RoomAdditionalFees.

const syncRoomOnCreateFee = async (fee) => {
  await Room.findByIdAndUpdate(fee.roomId, {
    $push: {
      additionalFees: {
        feeId: fee._id,
        feeName: fee.feeName,
        feeAmount: fee.feeAmount,
        month: fee.month,
        year: fee.year,
      },
    },
  });
};

const syncRoomOnUpdateFee = async (fee) => {
  const updateResult = await Room.updateOne(
    { _id: fee.roomId, "additionalFees.feeId": fee._id },
    {
      $set: {
        "additionalFees.$.feeName": fee.feeName,
        "additionalFees.$.feeAmount": fee.feeAmount,
        "additionalFees.$.month": fee.month,
        "additionalFees.$.year": fee.year,
      },
    }
  );

  // Nếu Room chưa có mục tương ứng (vd: dữ liệu cũ trước khi có tính năng
  // đồng bộ này), thêm mới để Room luôn khớp với RoomAdditionalFees.
  if (!updateResult.matchedCount) {
    await syncRoomOnCreateFee(fee);
  }
};

const syncRoomOnDeleteFee = async (fee) => {
  await Room.findByIdAndUpdate(fee.roomId, {
    $pull: { additionalFees: { feeId: fee._id } },
  });
};

class RoomAdditionFeeController {
  // GET danh mục tên phí gợi ý để FE dựng Select chọn tên phí
  async getFeeNameOptions(req, res) {
    return res.status(200).json({
      success: true,
      data: ROOM_ADDITIONAL_FEE_NAME_OPTIONS,
    });
  }

  async createRoomAdditionFee(req, res) {
    try {
      const { roomId, feeName, feeAmount, month, year } = req.body;

      if (!roomId || !feeName || feeAmount == null || !month || !year) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      if (feeAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Fee amount must be greater than or equal to 0",
        });
      }

      const room = await Room.findById(roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      // BR-32: tên phí bổ sung phải là duy nhất trong cùng một phòng
      // (cùng roomId + tháng + năm), không phân biệt hoa thường / khoảng trắng thừa.
      const trimmedFeeName = feeName.trim();

      const existed = await RoomAdditionalFees.findOne({
        roomId,
        month,
        year,
        feeName: { $regex: `^${trimmedFeeName}$`, $options: "i" },
      });

      if (existed) {
        return res.status(400).json({
          success: false,
          message: "This fee already exists in this room.",
        });
      }

      const fee = await RoomAdditionalFees.create({
        roomId,
        feeName: trimmedFeeName,
        feeAmount,
        month,
        year,
      });

      // Cập nhật ngay dữ liệu phí bổ sung vào Room
      await syncRoomOnCreateFee(fee);

      return res.status(201).json({
        success: true,
        message: "Create fee successfully",
        data: fee,
      });
    } catch (error) {
      // Bắt lỗi trùng khoá duy nhất ở tầng DB (unique index BR-32)
      if (error?.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "This fee already exists in this room.",
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAllRoomAdditionFees(req, res) {
    try {
      const accountId = req.user._id;

      const houses = await BoardingHouse.find({
        $or: [{ ownerId: accountId }, { staffId: accountId }],
      }).select("_id");

      const rooms = await Room.find({
        boardingHouseId: { $in: houses.map((h) => h._id) },
      }).select("_id");

      const additionFee = await RoomAdditionalFees.find({
        roomId: { $in: rooms.map((r) => r._id) },
      }).populate({
        path: "roomId",
        select: "roomNumber",
      });

      res.status(200).json(additionFee);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }

  //update room addition fee
  async updateRoomAdditionFee(req, res) {
    try {
      const { id } = req.params;
      const { feeName, feeAmount, month, year } = req.body;

      if (!feeName || feeAmount == null || !month || !year) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      if (feeAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Fee amount must be greater than or equal to 0",
        });
      }

      const fee = await RoomAdditionalFees.findById(id);

      if (!fee) {
        return res.status(404).json({
          success: false,
          message: "Fee not found",
        });
      }

      const trimmedFeeName = feeName.trim();

      // BR-32: kiểm tra trùng tên trong cùng phòng/tháng/năm (trừ chính nó)
      const duplicate = await RoomAdditionalFees.findOne({
        _id: { $ne: id },
        roomId: fee.roomId,
        month,
        year,
        feeName: { $regex: `^${trimmedFeeName}$`, $options: "i" },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Fee name already exists.",
        });
      }

      fee.feeName = trimmedFeeName;
      fee.feeAmount = feeAmount;
      fee.month = month;
      fee.year = year;

      await fee.save();

      // Cập nhật lại dữ liệu phí trong Room tương ứng
      await syncRoomOnUpdateFee(fee);

      return res.status(200).json({
        success: true,
        message: "Update successfully",
        data: fee,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Fee name already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  //Delete room addition fee
  async deleteRoomAdditionFee(req, res) {
    try {
      const { id } = req.params;
      const deletedFee = await RoomAdditionalFees.findByIdAndDelete(id);

      if (!deletedFee) {
        return res.status(404).json({ message: "Fee not found" });
      }

      // Gỡ khoản phí đã xoá ra khỏi Room tương ứng
      await syncRoomOnDeleteFee(deletedFee);

      res.status(200).json({ message: "Fee deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getRoomAdditionFeesByRoomId(req, res) {
    try {
      const { roomId } = req.params;
      const { month, year } = req.query;

      const filter = {
        roomId,
      };

      if (month) {
        filter.month = Number(month);
      }

      if (year) {
        filter.year = Number(year);
      }

      const fees = await RoomAdditionalFees.find(filter)
        .populate("roomId", "roomNumber")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: fees,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: fees.length,
          limit: fees.length,
        },
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getRoomAdditionFeeForMonthlyCalculate(req, res) {
    try {
      const { roomId } = req.params;
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: "Month and year are required.",
        });
      }

      const fees = await RoomAdditionalFees.find({
        roomId,
        month: Number(month),
        year: Number(year),
      });

      const totalAmount = fees.reduce((sum, fee) => sum + fee.feeAmount, 0);

      return res.status(200).json({
        success: true,
        data: fees,
        totalAmount,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new RoomAdditionFeeController();