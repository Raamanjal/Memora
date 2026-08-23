import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers["authorization"];

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = header.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        if (decoded && typeof decoded !== "string") {
            req.userId = (decoded as JwtPayload).userId;
            next();
        } else {
            res.status(401).json({ message: "Not logged In" });
        }
    } catch (err) {
        res.status(403).json({ message: "Expired or Invalid Token" });
    }
};