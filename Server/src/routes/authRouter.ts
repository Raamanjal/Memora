import express from "express";
import { validate } from "../middleware/validate.js";
import{login,signup} from "../controller/auth.js";
import { loginSchema, signupSchema  } from "../schemas/auth.schema.js";

const router = express.Router();


router.post("/login", validate(loginSchema), login);
router.post("/signup", validate(signupSchema), signup);

export default router;