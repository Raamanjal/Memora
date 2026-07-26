import jwt, {} from "jsonwebtoken";
export const authMiddleware = (req, res, next) => {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = header.split(" ")[1];
    try {
        //  @ts-ignore
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded) {
            if (typeof decoded === 'string') {
                res.status(401).json({ message: "Not logged In" });
                return;
            }
            req.userId = decoded.userId;
            next();
        }
        else {
            res.status(403).json({ message: "Not logged In" });
        }
    }
    catch (err) {
        res.status(403).json({ message: "Expired or Invalid Token" });
    }
};
//# sourceMappingURL=authMiddleware.js.map