const fs = require("fs");
const path = require("path");
const { getGoogleDrive } = require("../config/googleDrive");

const uploadToGoogleDrive = async (file) => {

    if (!file) {
        throw new Error("File is required");
    }

    const drive = getGoogleDrive();

    // Find or create main folder
    const mainFolderResponse = await drive.files.list({
        q: "name = 'SVSU Attendance' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: "files(id, name)"
    });

    let mainFolderId;

    if (mainFolderResponse.data.files.length > 0) {

        mainFolderId =
            mainFolderResponse.data.files[0].id;

    } else {

        const folder = await drive.files.create({
            requestBody: {
                name: "SVSU Attendance",
                mimeType:
                    "application/vnd.google-apps.folder"
            },
            fields: "id"
        });

        mainFolderId = folder.data.id;
    }


    // Find or create Syllabus folder
    const syllabusFolderResponse =
        await drive.files.list({
            q:
                `'${mainFolderId}' in parents and ` +
                `name = 'Syllabus' and ` +
                `mimeType = 'application/vnd.google-apps.folder' and ` +
                `trashed = false`,

            fields: "files(id, name)"
        });


    let syllabusFolderId;

    if (syllabusFolderResponse.data.files.length > 0) {

        syllabusFolderId =
            syllabusFolderResponse.data.files[0].id;

    } else {

        const folder = await drive.files.create({

            requestBody: {
                name: "Syllabus",
                mimeType:
                    "application/vnd.google-apps.folder",

                parents: [mainFolderId]
            },

            fields: "id"
        });

        syllabusFolderId = folder.data.id;
    }


    // Upload PDF
    const response = await drive.files.create({

        requestBody: {
            name: file.originalname,
            parents: [syllabusFolderId]
        },

        media: {
            mimeType: file.mimetype,
            body: fs.createReadStream(file.path)
        },

        fields: "id, name, webViewLink"
    });


    // Delete temporary local file
    await fs.promises.unlink(file.path);

    return {
        fileId: response.data.id,
        fileName: response.data.name,
        fileUrl: response.data.webViewLink
    };
};
const deleteFromGoogleDrive = async (fileId) => {

    if (!fileId) {
        return;
    }

    const drive = getGoogleDrive();

    await drive.files.delete({
        fileId
    });
};


module.exports = {
    uploadToGoogleDrive,deleteFromGoogleDrive
};