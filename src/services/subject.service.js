const Subject = require("../models/Subject");

const {
    uploadToGoogleDrive,
    deleteFromGoogleDrive
} = require("./googleDrive.service");


// ==========================================
// Faculty creates a new subject
// ==========================================

const createSubject = async ({
    data,
    facultyId,
    file
}) => {

    if (!file) {
        throw new Error("Syllabus PDF is required");
    }

    // Upload PDF to Google Drive
    const syllabus =
        await uploadToGoogleDrive(file);


    // Create subject in MongoDB
    const subject = await Subject.create({

        subjectName: data.subjectName,

        subjectCode: data.subjectCode,

        course: data.course,

        branch: data.branch,

        semester: Number(data.semester),

        credits: Number(data.credits),

        type: data.type,

        syllabus: {
            fileId: syllabus.fileId,
            fileName: syllabus.fileName,
            fileUrl: syllabus.fileUrl
        },

        submittedBy: facultyId,

        status: "pending"

    });


    return subject;
};


// ==========================================
// Get subjects submitted by a faculty member
// ==========================================

const getMySubjects = async (facultyId) => {

    return await Subject.find({
        submittedBy: facultyId
    })
    .populate(
        "reviewedBy",
        "firstName lastName emailId"
    )
    .sort({
        createdAt: -1
    });

};


// ==========================================
// Get one faculty submission
// ==========================================

const getMySubjectById = async ({
    subjectId,
    facultyId
}) => {

    const subject = await Subject.findOne({
        _id: subjectId,
        submittedBy: facultyId
    })
    .populate(
        "reviewedBy",
        "firstName lastName emailId"
    );


    if (!subject) {
        throw new Error(
            "Subject submission not found"
        );
    }


    return subject;
};


// ==========================================
// Admin gets all subjects
// ==========================================

const getAllSubjects = async ({
    status
}) => {

    const filter = {};

    if (status) {
        filter.status = status;
    }


    return await Subject.find(filter)

        .populate(
            "submittedBy",
            "firstName lastName emailId"
        )

        .populate(
            "reviewedBy",
            "firstName lastName emailId"
        )

        .sort({
            createdAt: -1
        });

};


// ==========================================
// Admin gets one subject
// ==========================================

const getSubjectById = async (subjectId) => {

    const subject = await Subject.findById(
        subjectId
    )

    .populate(
        "submittedBy",
        "firstName lastName emailId"
    )

    .populate(
        "reviewedBy",
        "firstName lastName emailId"
    );


    if (!subject) {
        throw new Error(
            "Subject not found"
        );
    }


    return subject;
};


// ==========================================
// Admin approves subject
// ==========================================

const approveSubject = async ({
    subjectId,
    adminId
}) => {

    const subject =
        await Subject.findById(subjectId);


    if (!subject) {
        throw new Error(
            "Subject not found"
        );
    }


    if (subject.status === "approved") {
        throw new Error(
            "Subject is already approved"
        );
    }


    subject.status = "approved";

    subject.reviewedBy = adminId;

    subject.reviewedAt = new Date();

    subject.rejectionReason = null;

    subject.isActive = true;


    await subject.save();


    return subject;
};


// ==========================================
// Admin rejects subject
// ==========================================

const rejectSubject = async ({
    subjectId,
    adminId,
    reason
}) => {

    const subject =
        await Subject.findById(subjectId);


    if (!subject) {
        throw new Error(
            "Subject not found"
        );
    }


    if (!reason || reason.trim().length < 3) {
        throw new Error(
            "Rejection reason is required"
        );
    }


    subject.status = "rejected";

    subject.reviewedBy = adminId;

    subject.reviewedAt = new Date();

    subject.rejectionReason =
        reason.trim();


    await subject.save();


    return subject;
};


// ==========================================
// Faculty resubmits a subject
// ==========================================

const resubmitSubject = async ({
    subjectId,
    facultyId,
    data,
    file
}) => {

    const subject =
        await Subject.findOne({
            _id: subjectId,
            submittedBy: facultyId
        });


    if (!subject) {
        throw new Error(
            "Subject not found"
        );
    }


    if (
        subject.status !== "rejected" &&
        subject.status !== "pending"
    ) {
        throw new Error(
            "Only pending or rejected subjects can be edited"
        );
    }


    // Update subject information

    subject.subjectName =
        data.subjectName;

    subject.subjectCode =
        data.subjectCode;

    subject.course =
        data.course;

    subject.branch =
        data.branch;

    subject.semester =
        Number(data.semester);

    subject.credits =
        Number(data.credits);

    subject.type =
        data.type;


    // ==========================================
    // If faculty uploads a new PDF
    // ==========================================

    if (file) {

        // Delete old Google Drive PDF
        if (subject.syllabus?.fileId) {

            await deleteFromGoogleDrive(
                subject.syllabus.fileId
            );
        }


        // Upload new PDF to Google Drive
        const syllabus =
            await uploadToGoogleDrive(file);


        // Save new Google Drive information
        subject.syllabus = {

            fileId: syllabus.fileId,

            fileName: syllabus.fileName,

            fileUrl: syllabus.fileUrl

        };
    }


    // Send submission through admin approval again

    subject.status = "pending";

    subject.reviewedBy = null;

    subject.reviewedAt = null;

    subject.rejectionReason = null;


    await subject.save();


    return subject;
};


// ==========================================
// Exports
// ==========================================

module.exports = {

    createSubject,

    getMySubjects,

    getMySubjectById,

    getAllSubjects,

    getSubjectById,

    approveSubject,

    rejectSubject,

    resubmitSubject

};