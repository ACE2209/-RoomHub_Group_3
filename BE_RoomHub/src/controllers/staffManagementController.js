import bcrypt from "bcrypt";
import mongoose from "mongoose";
import BoardingHouse from "../models/boardingHouse.js";
import { Account, Staff } from "../models/account.js";

class StaffManagementController {
  getOwnerId(req) {
    return req.user?.userId || req.user?._id;
  }

  parsePagination(req) {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      100
    );

    return { page, limit };
  }

  parseBoardingHouseIds(value) {
    if (value === undefined) return undefined;
    if (value === null || value === "") return [];

    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (error) {
        return trimmed.split(",").map((id) => id.trim()).filter(Boolean);
      }

      return trimmed.split(",").map((id) => id.trim()).filter(Boolean);
    }

    return [];
  }

  async validateOwnerBoardingHouses(boardingHouseIds, ownerId) {
    const uniqueIds = [...new Set(boardingHouseIds.map((id) => id.toString()))];

    if (
      uniqueIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
    ) {
      return {
        valid: false,
        message: "Invalid boarding house id",
      };
    }

    const count = await BoardingHouse.countDocuments({
      _id: { $in: uniqueIds },
      ownerId,
      deleted: { $ne: true },
    });

    if (count !== uniqueIds.length) {
      return {
        valid: false,
        message: "Some boarding houses do not belong to this owner",
      };
    }

    return { valid: true, ids: uniqueIds };
  }

  async assignBoardingHousesToStaff(staffId, ownerId, boardingHouseIds) {
    if (boardingHouseIds === undefined) return;

    await BoardingHouse.updateMany(
      { ownerId, staffId },
      { $set: { staffId: null } }
    );

    if (!boardingHouseIds.length) return;

    await BoardingHouse.updateMany(
      { _id: { $in: boardingHouseIds }, ownerId, deleted: { $ne: true } },
      { $set: { staffId } }
    );
  }

  async enrichStaffs(staffs, ownerId) {
    const staffIds = staffs.map((staff) => staff._id);

    const boardingHouses = await BoardingHouse.find({
      ownerId,
      staffId: { $in: staffIds },
      deleted: { $ne: true },
    })
      .select("_id name staffId")
      .lean();

    const boardingHouseMap = boardingHouses.reduce((map, boardingHouse) => {
      const staffId = boardingHouse.staffId?.toString();
      if (!staffId) return map;

      if (!map[staffId]) map[staffId] = [];
      map[staffId].push({
        _id: boardingHouse._id,
        name: boardingHouse.name,
      });

      return map;
    }, {});

    return staffs.map((staff) => {
      const assignedBoardingHouses = boardingHouseMap[staff._id.toString()] || [];

      return {
        ...staff,
        assignedBoardingHouses,
        assignedBoardingHouseCount: assignedBoardingHouses.length,
      };
    });
  }

  async getOwnerStaffs(req, res) {
    try {
      const ownerId = this.getOwnerId(req);
      const { page, limit } = this.parsePagination(req);
      const { search } = req.query;

      const filter = {
        createdBy: ownerId,
        deleted: { $ne: true },
      };

      if (search) {
        const regex = new RegExp(search, "i");
        filter.$or = [
          { username: regex },
          { fullname: regex },
          { email: regex },
          { phoneNumber: regex },
        ];
      }

      const [totalItems, staffs] = await Promise.all([
        Staff.countDocuments(filter),
        Staff.find(filter)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
      ]);

      const data = await this.enrichStaffs(staffs, ownerId);

      return res.status(200).json({
        success: true,
        data,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          limit,
          hasNextPage: page * limit < totalItems,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch staffs",
        error: error.message,
      });
    }
  }

  async createOwnerStaff(req, res) {
    try {
      const ownerId = this.getOwnerId(req);
      const {
        username,
        password,
        email,
        phoneNumber,
        fullname,
        gender,
        hireDate,
      } = req.body;
      const boardingHouseIds = this.parseBoardingHouseIds(req.body.boardingHouseIds);

      if (!username || !password || !email || !fullname) {
        return res.status(400).json({
          success: false,
          message: "Username, password, email and fullname are required",
        });
      }

      if (boardingHouseIds !== undefined) {
        const validation = await this.validateOwnerBoardingHouses(
          boardingHouseIds,
          ownerId
        );

        if (!validation.valid) {
          return res.status(400).json({ success: false, message: validation.message });
        }
      }

      const duplicateAccount = await Account.findOne({
        $or: [{ username }, { email: email.toLowerCase() }],
      });

      if (duplicateAccount) {
        return res.status(400).json({
          success: false,
          message: "Username or email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const staff = await Staff.create({
        username,
        password: hashedPassword,
        email,
        phoneNumber,
        fullname,
        gender,
        role: "staff",
        hireDate,
        createdBy: ownerId,
      });

      await this.assignBoardingHousesToStaff(
        staff._id,
        ownerId,
        boardingHouseIds
      );

      const [data] = await this.enrichStaffs(
        [staff.toObject()],
        ownerId
      );
      delete data.password;

      return res.status(201).json({
        success: true,
        message: "Staff created successfully",
        data,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create staff",
        error: error.message,
      });
    }
  }

  async updateOwnerStaff(req, res) {
    try {
      const ownerId = this.getOwnerId(req);
      const { staffId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(staffId)) {
        return res.status(400).json({ success: false, message: "Invalid staff id" });
      }

      const staff = await Staff.findOne({
        _id: staffId,
        createdBy: ownerId,
        deleted: { $ne: true },
      });

      if (!staff) {
        return res.status(404).json({ success: false, message: "Staff not found" });
      }

      const {
        username,
        password,
        email,
        phoneNumber,
        fullname,
        gender,
        hireDate,
      } = req.body;
      const boardingHouseIds = this.parseBoardingHouseIds(req.body.boardingHouseIds);

      if (boardingHouseIds !== undefined) {
        const validation = await this.validateOwnerBoardingHouses(
          boardingHouseIds,
          ownerId
        );

        if (!validation.valid) {
          return res.status(400).json({ success: false, message: validation.message });
        }
      }

      const duplicateConditions = [];
      if (username && username !== staff.username) {
        duplicateConditions.push({ username });
      }
      if (email && email.toLowerCase() !== staff.email) {
        duplicateConditions.push({ email: email.toLowerCase() });
      }

      if (duplicateConditions.length) {
        const duplicateAccount = await Account.findOne({
          _id: { $ne: staffId },
          $or: duplicateConditions,
        });

        if (duplicateAccount) {
          return res.status(400).json({
            success: false,
            message: "Username or email already exists",
          });
        }
      }

      if (username !== undefined) staff.username = username;
      if (email !== undefined) staff.email = email;
      if (phoneNumber !== undefined) staff.phoneNumber = phoneNumber;
      if (fullname !== undefined) staff.fullname = fullname;
      if (gender !== undefined) staff.gender = gender;
      if (hireDate !== undefined) staff.hireDate = hireDate;
      if (password) staff.password = await bcrypt.hash(password, 10);

      await staff.save();
      await this.assignBoardingHousesToStaff(
        staff._id,
        ownerId,
        boardingHouseIds
      );

      const [data] = await this.enrichStaffs(
        [staff.toObject()],
        ownerId
      );
      delete data.password;

      return res.status(200).json({
        success: true,
        message: "Staff updated successfully",
        data,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update staff",
        error: error.message,
      });
    }
  }

  async deleteOwnerStaff(req, res) {
    try {
      const ownerId = this.getOwnerId(req);
      const { staffId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(staffId)) {
        return res.status(400).json({ success: false, message: "Invalid staff id" });
      }

      const staff = await Staff.findOne({
        _id: staffId,
        createdBy: ownerId,
        deleted: { $ne: true },
      });

      if (!staff) {
        return res.status(404).json({ success: false, message: "Staff not found" });
      }

      staff.deleted = true;
      staff.deletedAt = new Date();
      await staff.save();

      await BoardingHouse.updateMany(
        { ownerId, staffId: staff._id },
        { $set: { staffId: null } }
      );

      return res.status(200).json({
        success: true,
        message: "Staff deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete staff",
        error: error.message,
      });
    }
  }
}

export default new StaffManagementController();
