import DepositRoom from "../models/depositRoom.js";
import Room from "../models/room.js";
import { updateBoardingHouseRoomCounts } from "./updateBoardingHouseRoomCounts.js";

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const DEPOSIT_PAYMENT_MINUTES = toPositiveInt(
  process.env.DEPOSIT_PAYMENT_MINUTES,
  1440
);

export const RENT_DUE_DAYS = toPositiveInt(process.env.RENT_DUE_DAYS, 5);
export const RENT_GRACE_DAYS = toPositiveInt(process.env.RENT_GRACE_DAYS, 7);
export const AUTO_RELEASE_OVERDUE_RENT =
  String(process.env.AUTO_RELEASE_OVERDUE_RENT ?? "true").toLowerCase() === "true";

export const addMinutes = (date, minutes) =>
  new Date(new Date(date).getTime() + minutes * 60 * 1000);

export const addDays = (date, days) =>
  new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);

export const buildDepositPaymentDeadline = (from = new Date()) =>
  addMinutes(from, DEPOSIT_PAYMENT_MINUTES);

export const buildRentDeadlines = (from = new Date()) => {
  const dueDate = addDays(from, RENT_DUE_DAYS);
  return {
    dueDate,
    gracePeriodEnd: addDays(dueDate, RENT_GRACE_DAYS),
  };
};

export const getRoomCapacityState = async (roomId, options = {}) => {
  const { excludeDepositId = null } = options;

  const room = await Room.findById(roomId)
    .populate({
      path: "boardingHouseId",
      populate: {
        path: "boardingHouseType",
        select: "codeName",
      },
    })
    .populate({
      path: "roomTypeId",
      select: "peopleNumber",
    });

  if (!room) return null;

  const typeCode = room.boardingHouseId?.boardingHouseType?.codeName || "";
  const isDormitory = typeCode === "nha_tro_kien_truc_xa";
  const capacity = isDormitory
    ? Math.max(1, Number(room.roomTypeId?.peopleNumber || 1))
    : 1;

  const holdFilter = {
    roomId: room._id,
    status: "accepted",
    paymentDeadline: { $gt: new Date() },
  };

  if (excludeDepositId) {
    holdFilter._id = { $ne: excludeDepositId };
  }

  const activeHolds = await DepositRoom.find(holdFilter)
    .select("accountId")
    .lean();

  const occupiedAccountIds = new Set(
    (Array.isArray(room.rentBy) ? room.rentBy : []).map((id) => id.toString())
  );

  // Không đếm trùng nếu cùng một tài khoản đã ở trong phòng nhưng còn giữ một
  // yêu cầu accepted cũ.
  const reservedAccountIds = new Set(
    activeHolds
      .map((item) => item.accountId?.toString())
      .filter((id) => id && !occupiedAccountIds.has(id))
  );

  const occupiedCount = occupiedAccountIds.size;
  const reservedCount = reservedAccountIds.size;
  const usedSlots = occupiedCount + reservedCount;
  const availableSlots = Math.max(0, capacity - usedSlots);

  return {
    room,
    typeCode,
    isDormitory,
    capacity,
    occupiedCount,
    reservedCount,
    usedSlots,
    availableSlots,
    isAvailable: availableSlots > 0,
  };
};

export const syncRoomAvailabilityWithReservations = async (roomId) => {
  const state = await getRoomCapacityState(roomId);
  if (!state) return null;

  const { room, isAvailable } = state;

  room.isAvailable = isAvailable;
  // Đây là trạng thái hệ thống tự tính.
  room.manuallySet = false;

  await room.save();

  if (room.boardingHouseId?._id) {
    await updateBoardingHouseRoomCounts(room.boardingHouseId._id);
  }

  return room;
};
