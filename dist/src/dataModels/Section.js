"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Section {
    uuid;
    course_id;
    title;
    instructor;
    dept;
    year;
    avg;
    pass;
    fail;
    audit;
    constructor(uuid, course_id, title, instructor, dept, year, avg, pass, fail, audit) {
        this.uuid = uuid;
        this.course_id = course_id;
        this.title = title;
        this.instructor = instructor;
        this.dept = dept;
        this.year = year;
        this.avg = avg;
        this.pass = pass;
        this.fail = fail;
        this.audit = audit;
    }
    get(keyID) {
        if (keyID === "uuid") {
            return this.uuid;
        }
        else if (keyID === "id") {
            return this.course_id;
        }
        else if (keyID === "title") {
            return this.title;
        }
        else if (keyID === "instructor") {
            return this.instructor;
        }
        else if (keyID === "dept") {
            return this.dept;
        }
        else if (keyID === "year") {
            return this.year;
        }
        else if (keyID === "avg") {
            return this.avg;
        }
        else if (keyID === "pass") {
            return this.pass;
        }
        else if (keyID === "fail") {
            return this.fail;
        }
        else if (keyID === "audit") {
            return this.audit;
        }
        else {
            return;
        }
    }
}
exports.default = Section;
//# sourceMappingURL=Section.js.map