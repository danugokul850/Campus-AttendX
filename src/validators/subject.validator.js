const validateSubjectData = ({
    subjectName,
    subjectCode,
    course,
    branch,
    semester,
    credits,
    type
}) => {

    const errors = {};

    if (!subjectName || subjectName.trim().length < 2) {
        errors.subjectName = "Valid subject name is required";
    }

    if (!subjectCode || subjectCode.trim().length < 2) {
        errors.subjectCode = "Subject code is required";
    }

    if (!["B.TECH", "BCA", "DIPLOMA"].includes(course)) {
        errors.course = "Invalid course";
    }

    if (!branch || branch.trim().length === 0) {
        errors.branch = "Branch is required";
    }

    if (
        semester === undefined ||
        semester < 1 ||
        semester > 8
    ) {
        errors.semester = "Semester must be between 1 and 8";
    }

    if (
        credits === undefined ||
        credits < 0
    ) {
        errors.credits = "Credits cannot be negative";
    }

    if (!["theory", "lab", "elective"].includes(type)) {
        errors.type = "Type must be theory, lab and elective";
    }

    return errors;
};


module.exports = {
    validateSubjectData
};