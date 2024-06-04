"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Section_1 = __importDefault(require("./Section"));
class CourseData {
    id;
    insightDatasetKind;
    insightDataset;
    sections;
    constructor(id, insightDatasetKind, coursesList) {
        this.id = id;
        this.insightDatasetKind = insightDatasetKind;
        this.sections = [];
        this.insightDataset = { id: id, kind: insightDatasetKind, numRows: this.sections.length };
        for (let course of coursesList) {
            let parsedCourse = (typeof course === "string") ? JSON.parse(course) : course;
            this.parse(parsedCourse);
        }
        this.insightDataset.numRows = this.sections.length;
    }
    parse(courses) {
        for (let course of courses.result) {
            let uuid = course.id;
            let courseID = course.Course;
            let title = course.Title;
            let instructor = course.Professor;
            let dept = course.Subject;
            let year = course.Year;
            let avg = course.Avg;
            let pass = course.Pass;
            let fail = course.Fail;
            let audit = course.Audit;
            if (course.Section === "overall") {
                year = 1900;
            }
            let section = new Section_1.default(uuid, courseID, title, instructor, dept, year, avg, pass, fail, audit);
            this.sections.push(section);
        }
        this.insightDataset.numRows = this.sections.length;
    }
}
exports.default = CourseData;
//# sourceMappingURL=CourseData.js.map