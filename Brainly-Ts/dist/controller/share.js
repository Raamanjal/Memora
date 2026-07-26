import { LinkModel } from "../model/Link.js";
import { random } from "../utils/random.js";
import { content } from "../model/Content.js";
import { UserModel } from "../model/User.js";
export const shareContent = async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({
            message: "Unauthorized"
        });
        return;
    }
    const share = req.body?.share;
    try {
        if (share) {
            const existingLink = await LinkModel.findOne({
                userId
            });
            if (existingLink) {
                res.json({
                    hash: existingLink.hash
                });
                return;
            }
            const hash = random(10);
            await LinkModel.create({
                userId,
                hash
            });
            res.json({
                hash
            });
            return;
        }
        await LinkModel.deleteOne({
            userId
        });
        res.json({
            message: "Removed link"
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something went wrong"
        });
    }
};
export const getSharedContent = async (req, res) => {
    const hash = req.params.shareLink;
    if (!hash) {
        res.status(400).json({
            message: "Missing share link"
        });
        return;
    }
    try {
        const link = await LinkModel.findOne({
            hash
        });
        if (!link) {
            res.status(404).json({
                message: "Sorry incorrect input"
            });
            return;
        }
        const userContent = await content.find({
            userId: link.userId
        }).populate("tags", "title");
        const user = await UserModel.findOne({
            _id: link.userId
        });
        if (!user) {
            res.status(404).json({
                message: "User not found"
            });
            return;
        }
        res.json({
            username: user.username,
            content: userContent
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something went wrong"
        });
    }
};
export const getShareStatus = async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({
            message: "Unauthorized"
        });
        return;
    }
    try {
        const link = await LinkModel.findOne({ userId });
        res.json({
            shared: !!link,
            hash: link ? link.hash : null
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something went wrong"
        });
    }
};
//# sourceMappingURL=share.js.map