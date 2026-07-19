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

export const syncRoomAvailabilityWithReservations = async (roomId) => {
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

  const activeReservations = await DepositRoom.countDocuments({
    roomId: room._id,
    status: "accepted",
    paymentDeadline: { $gt: new Date() },
  });

  const renterCount = Array.isArray(room.rentBy)
    ? room.rentBy.length
    : 0;

  const capacity = Math.max(
    1,
    Number(room.roomTypeId?.peopleNumber || 1)
  );

  const occupiedOrReserved =
    renterCount + activeReservations;

  if (capacity > 1) {
    room.isAvailable = occupiedOrReserved < capacity;
  } else {
    room.isAvailable = occupiedOrReserved === 0;
  }

  // Đây là trạng thái hệ thống tự tính.
  room.manuallySet = false;

  await room.save();

  if (room.boardingHouseId?._id) {
    await updateBoardingHouseRoomCounts(
      room.boardingHouseId._id
    );
  }

  return room;
};