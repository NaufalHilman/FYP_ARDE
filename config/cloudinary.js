const cloudinary = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const resumeStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const ext = file.originalname.split('.').pop();
        const baseName = file.originalname.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_');
        return {
            folder: 'arde/resumes',
            resource_type: 'raw',
            public_id: `${Date.now()}-${baseName}.${ext}`,
            use_filename: false,
        };
    },
});

const uploadResume = multer({ storage: resumeStorage });

module.exports = { uploadResume };