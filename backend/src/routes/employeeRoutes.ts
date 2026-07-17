import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { employeeId } = req.body;

    // Employee Collection Create
    await mongoose.connection.createCollection(employeeId);

    res.json({
      success: true,
      message: `${employeeId} collection created`
    });

  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

export default router;