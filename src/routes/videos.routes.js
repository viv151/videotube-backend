import { Router } from "express";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.use(verifyJWT);

router.route("/all-videos").get(getAllVideos);

router.route("/publish-video").post(upload.fields([
    {
        name: "video",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), publishAVideo);


router.route("/:videoId").get(getVideoById);

router.route("/update-video/:videoId").patch(upload.single("thumbnail"), updateVideo);

router.route("/delete-video/:videoId").delete(deleteVideo);


router.route("/toggle-status/:videoId").patch(togglePublishStatus);




export default router