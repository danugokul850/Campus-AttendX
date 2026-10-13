const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../../middleware/authMiddleware");

const roleMiddleware =
    require("../../middleware/role.middleware");

const {
    getStudents,
    getStudentById,

    getFaculty,
    getFacultyById,

    getAdmins,
    getAdminById,

    activateUser,
    deactivateUser
} = require(
    "../../controllers/admin/adminUser.controller"
);


// ==========================================
// STUDENTS
// ==========================================

router.get(
    "/students",
    authMiddleware,
    roleMiddleware("admin"),
    getStudents
);

router.get(
    "/students/:id",
    authMiddleware,
    roleMiddleware("admin"),
    getStudentById
);


// ==========================================
// FACULTY
// ==========================================

router.get(
    "/faculty",
    authMiddleware,
    roleMiddleware("admin"),
    getFaculty
);

router.get(
    "/faculty/:id",
    authMiddleware,
    roleMiddleware("admin"),
    getFacultyById
);


// ==========================================
// ADMINS
// ==========================================

router.get(
    "/admins",
    authMiddleware,
    roleMiddleware("admin"),
    getAdmins
);

router.get(
    "/admins/:id",
    authMiddleware,
    roleMiddleware("admin"),
    getAdminById
);


// ==========================================
// USER STATUS
// ==========================================

router.patch(
    "/:id/activate",
    authMiddleware,
    roleMiddleware("admin"),
    activateUser
);

router.patch(
    "/:id/deactivate",
    authMiddleware,
    roleMiddleware("admin"),
    deactivateUser
);


module.exports = router;    