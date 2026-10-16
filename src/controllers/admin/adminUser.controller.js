
const adminUserService = require("../../services/Admin/adminUser.service");


// =====================================================
// STUDENTS
// =====================================================

// GET /api/admin/users/students
const getStudents = async (req, res, next) => {

    try {

        const {
            search,
            course,
            branch,
            semester,
            batch,
            isActive
        } = req.query;

        const result =
            await adminUserService.getStudents({
                search,
                course,
                branch,
                semester,
                batch,
                isActive,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET STUDENT BY ID
// =====================================================

// GET /api/admin/users/students/:id
const getStudentById = async (req, res, next) => {

    try {

        const student =
            await adminUserService.getStudentById({
                studentId: req.params.id,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            data: student
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// FACULTY
// =====================================================

// GET /api/admin/users/faculty
const getFaculty = async (req, res, next) => {

    try {

        const {
            search,
            branch,
            course,
            isActive
        } = req.query;

        const result =
            await adminUserService.getFaculty({
                search,
                branch,
                course,
                isActive,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET FACULTY BY ID
// =====================================================

// GET /api/admin/users/faculty/:id
const getFacultyById = async (req, res, next) => {

    try {

        const faculty =
            await adminUserService.getFacultyById({
                facultyId: req.params.id,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            data: faculty
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// ADMINS
// =====================================================

// GET /api/admin/users/admins
const getAdmins = async (req, res, next) => {

    try {

        const {
            search,
            isActive
        } = req.query;

        const result =
            await adminUserService.getAdmins({
                search,
                isActive,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET ADMIN BY ID
// =====================================================

// GET /api/admin/users/admins/:id
const getAdminById = async (req, res, next) => {

    try {

        const admin =
            await adminUserService.getAdminById({
                adminId: req.params.id,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            data: admin
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// ACTIVATE USER
// =====================================================

// PATCH /api/admin/users/:id/activate
const activateUser = async (req, res, next) => {

    try {

        const user =
            await adminUserService.activateUser({
                userId: req.params.id,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            message: "User activated successfully",
            data: user
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// DEACTIVATE USER
// =====================================================

// PATCH /api/admin/users/:id/deactivate
const deactivateUser = async (req, res, next) => {

    try {

        const user =
            await adminUserService.deactivateUser({
                userId: req.params.id,
                adminId: req.user.id,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            message: "User deactivated successfully",
            data: user
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    getStudents,
    getStudentById,

    getFaculty,
    getFacultyById,

    getAdmins,
    getAdminById,

    activateUser,
    deactivateUser
};