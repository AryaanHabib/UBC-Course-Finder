"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const IInsightFacade_1 = require("../controller/IInsightFacade");
class Validator {
    validateQuery(query) {
        this.validateWhereClause(query.WHERE);
        this.validateOptionsClause(query.OPTIONS);
        if (query.TRANSFORMATION) {
            this.validateTransformationsClause(query.TRANSFORMATION);
        }
    }
    validateWhereClause(filter) {
        if (Object.keys(filter).length === 0) {
            return;
        }
        if ("AND" in filter || "OR" in filter) {
            this.validateLogicComparison(filter);
        }
        else if ("LT" in filter || "GT" in filter || "EQ" in filter) {
            this.validateMComparison(filter);
        }
        else if ("IS" in filter) {
            this.validateSComparison(filter);
        }
        else if ("NOT" in filter) {
            this.validateWhereClause(filter.NOT);
        }
        else {
            throw new IInsightFacade_1.InsightError("Invalid filter type in WHERE clause");
        }
    }
    validateLogicComparison(logicComparison) {
        const filters = logicComparison.AND || logicComparison.OR;
        if (!Array.isArray(filters) || filters.length === 0) {
            throw new IInsightFacade_1.InsightError("AND/OR must have at least one filter");
        }
        filters.forEach((filter) => this.validateWhereClause(filter));
    }
    validateMComparison(mComparison) {
        const comparator = mComparison.LT || mComparison.GT || mComparison.EQ;
        if (typeof comparator !== "object" || Object.keys(comparator).length !== 1) {
            throw new IInsightFacade_1.InsightError("MComparison must have exactly one key-value pair");
        }
        if (typeof Object.values(comparator)[0] !== "number") {
            throw new IInsightFacade_1.InsightError("The value for MComparison must be a number");
        }
    }
    validateSComparison(sComparison) {
        const comparator = sComparison.IS;
        if (typeof comparator !== "object" || Object.keys(comparator).length !== 1) {
            throw new IInsightFacade_1.InsightError("SComparison must have exactly one key-value pair");
        }
        if (typeof Object.values(comparator)[0] !== "string") {
            throw new IInsightFacade_1.InsightError("The value for SComparison must be a string");
        }
    }
    validateOptionsClause(options) {
        if (!options.COLUMNS || options.COLUMNS.length === 0) {
            throw new IInsightFacade_1.InsightError("COLUMNS must be a non-empty array");
        }
        options.COLUMNS.forEach((column) => {
            if (typeof column !== "string") {
                throw new IInsightFacade_1.InsightError("Each item in COLUMNS must be a string");
            }
        });
        if (options.ORDER) {
            const order = options.ORDER;
            if (typeof order === "string") {
                this.validateOrderString(order, options.COLUMNS);
            }
            else {
                this.validateOrderObject(order, options.COLUMNS);
            }
        }
    }
    validateOrderString(order, columns) {
        if (!columns.includes(order)) {
            throw new IInsightFacade_1.InsightError("ORDER must be one of the COLUMNS when it's a string");
        }
    }
    validateOrderObject(order, columns) {
        if (order.dir !== "UP" && order.dir !== "DOWN") {
            throw new IInsightFacade_1.InsightError("ORDER direction must be UP or DOWN");
        }
        if (!Array.isArray(order.keys) || order.keys.length === 0) {
            throw new IInsightFacade_1.InsightError("ORDER keys must be a non-empty array");
        }
        order.keys.forEach((key) => {
            if (typeof key !== "string" || !columns.includes(key)) {
                throw new IInsightFacade_1.InsightError("Each ORDER key must be a string and included in COLUMNS");
            }
        });
    }
    validateTransformationsClause(transformations) {
        this.validateGroupArray(transformations.GROUP);
        this.validateApplyArray(transformations.APPLY);
    }
    validateGroupArray(group) {
        group.forEach((key) => {
            if (typeof key !== "string") {
                throw new IInsightFacade_1.InsightError("Each GROUP key must be a string");
            }
        });
    }
    validateApplyArray(apply) {
        const seenApplyKeys = new Set();
        apply.forEach((rule) => {
            const applyKey = Object.keys(rule)[0];
            if (seenApplyKeys.has(applyKey)) {
                throw new IInsightFacade_1.InsightError(`Each APPLY key must be unique. Duplicate found: ${applyKey}`);
            }
            seenApplyKeys.add(applyKey);
            const applyToken = Object.keys(rule[applyKey])[0];
            const tokenValue = rule[applyKey][applyToken];
            this.validateApplyToken(applyToken, tokenValue);
        });
    }
    validateApplyToken(applyToken, tokenValue) {
        if (!["MAX", "MIN", "AVG", "COUNT", "SUM"].includes(applyToken)) {
            throw new IInsightFacade_1.InsightError(`Invalid APPLY token: ${applyToken}`);
        }
        if (typeof tokenValue !== "string") {
            throw new IInsightFacade_1.InsightError(`Value for ${applyToken} must be a string`);
        }
    }
}
exports.Validator = Validator;
//# sourceMappingURL=Validator.js.map