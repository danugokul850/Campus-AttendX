const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/role.middleware");

const upload = require("../middleware/upload.middleware");

const {
    createSubject,
    getMySubjects,
    getMySubjectById,
    resubmitSubject
} = require("../controllers/subject.controller");


router.post(
    "/",
    authMiddleware,
    roleMiddleware("faculty"),
    upload.single("syllabus"),
    createSubject
);


router.get(
    "/my-submissions",
    authMiddleware,
    roleMiddleware("faculty"),
    getMySubjects
);


router.get(
    "/my-submissions/:id",
    authMiddleware,
    roleMiddleware("faculty"),
    getMySubjectById
);


router.patch(
    "/:id",
    authMiddleware,
    roleMiddleware("faculty"),
    upload.single("syllabus"),
    resubmitSubject
);


module.exports = router;