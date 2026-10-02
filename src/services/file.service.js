const fs = require("fs");
const path = require("path");

const deleteFile = async (filePath) => {

    if (!filePath) {
        return;
    }

    try {

        await fs.promises.unlink(filePath);

    } catch (error) {

        // File may already be deleted
        if (error.code !== "ENOENT") {
            throw error;
        }

    }
};


const getFileUrl = (filename) => {

    return `/uploads/syllabus/${filename}`;

};


module.exports = {
    deleteFile,
    getFileUrl
};