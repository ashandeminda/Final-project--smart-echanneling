import express from "express";
import { getTestController } from "../controllers/testController.js";

const router = express.Router();

router.get("/", getTestController);

export default router;