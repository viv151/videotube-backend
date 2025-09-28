import { v2 as cloudinary } from "cloudinary";
import fs from "fs"


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null; // if file path then dont do anything
        //upload the file on cloudinary if file path exists
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" //specify the type of file being uploaded. 
        })

        //file uploaded successfully'
        fs.unlinkSync(localFilePath) //remove the file from local after it has been uploaded on the cloud
        // console.log("File uploaded on cloudinary successfully", response.url) //response contains many things url is one of them
        // console.log(response);
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temp file as the upload operation got failed
        return null;
    }
}

const deleteOldFileAfterUpdate = async (public_id) => {
    try {
        if (!public_id) return null;

        await cloudinary.uploader.destroy(public_id, {
            resource_type: "auto"
        })

    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to delete the old image")
    }
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export { uploadOnCloudinary, deleteOldFileAfterUpdate }
