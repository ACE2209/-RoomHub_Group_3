import mongoose from "mongoose";
import BoardingHouseExpense from "../models/boardingHouseExpense.js";
import BoardingHouse from "../models/boardingHouse.js";

const isValidPeriod = (month, year) => {
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  return (
    Number.isInteger(monthNumber) &&
    monthNumber >= 1 &&
    monthNumber <= 12 &&
    Number.isInteger(yearNumber) &&
    yearNumber >= 2000
  );
};

const findManagedBoardingHouse = (boardingHouseId, userId) =>
  BoardingHouse.findOne({
    _id: boardingHouseId,
    $or: [{ ownerId: userId }, { staffId: userId }],
  })
    .select("_id")
    .lean();

const findManagedExpense = async (expenseId, userId) => {
  if (!expenseId || !mongoose.Types.ObjectId.isValid(expenseId)) {
    return { error: { status: 400, message: "Invalid expense ID" } };
  }

  const expense = await BoardingHouseExpense.findById(expenseId);

  if (!expense) {
    return { error: { status: 404, message: "Expense not found" } };
  }

  const boardingHouse = await findManagedBoardingHouse(
    expense.boardingHouseId,
    userId
  );

  if (!boardingHouse) {
    return {
      error: {
        status: 403,
        message:
          "You do not have permission to manage expenses of this boarding house",
      },
    };
  }

  return { expense };
};

class BhExpenseController {
  async getExpensesByTime(req, res) {
    try {
      const userId = req.user.userId;
      const { boardingHouseId, month, year } = req.query;

      if (!boardingHouseId || !isValidPeriod(month, year)) {
        return res.status(400).json({
          success: false,
          message: "Invalid parameters: boardingHouseId, month (1-12) and year are required",
        });
      }

      const boardingHouse = await findManagedBoardingHouse(
        boardingHouseId,
        userId
      );

      if (!boardingHouse) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to view expenses of this boarding house",
        });
      }

      const expenses = await BoardingHouseExpense.find({
        boardingHouseId,
        month,
        year,
      });

      return res.status(200).json({ success: true, data: expenses });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async addExpense(req, res) {
    try {
      const userId = req.user.userId;
      const { boardingHouseId, month, year } = req.body;

      if (!boardingHouseId || !isValidPeriod(month, year)) {
        return res.status(400).json({
          success: false,
          message: "Invalid fields: boardingHouseId, month (1-12) and year are required",
        });
      }

      const boardingHouse = await findManagedBoardingHouse(
        boardingHouseId,
        userId
      );

      if (!boardingHouse) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to add expenses for this boarding house",
        });
      }

      const existedExpense = await BoardingHouseExpense.findOne({
        boardingHouseId,
        month,
        year,
      });

      if (existedExpense) {
        return res.status(400).json({
          success: false,
          message: "Expense for this month already exists",
        });
      }

      const newExpense = await BoardingHouseExpense.create(req.body);

      return res.status(201).json({
        success: true,
        message: "Expense added successfully",
        data: newExpense,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Invalid expense data",
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async updateExpense(req, res) {
    try {
      const userId = req.user.userId;
      const { expenseId } = req.params;

      const { expense, error } = await findManagedExpense(expenseId, userId);

      if (error) {
        return res
          .status(error.status)
          .json({ success: false, message: error.message });
      }

      const { electricalExpense, waterExpense, otherExpenses } = req.body;

      if (electricalExpense) expense.electricalExpense = electricalExpense;
      if (waterExpense) expense.waterExpense = waterExpense;
      if (otherExpenses) expense.otherExpenses = otherExpenses;

      await expense.save();

      return res.status(200).json({
        success: true,
        message: "Expense updated successfully",
        data: expense,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Invalid expense data",
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async deleteExpense(req, res) {
    try {
      const userId = req.user.userId;
      const { expenseId } = req.params;

      const { expense, error } = await findManagedExpense(expenseId, userId);

      if (error) {
        return res
          .status(error.status)
          .json({ success: false, message: error.message });
      }

      await expense.deleteOne();

      return res.status(200).json({
        success: true,
        message: "Expense deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
}

export default new BhExpenseController();
