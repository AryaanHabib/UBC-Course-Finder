"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Executor = void 0;
const CourseData_1 = __importDefault(require("../dataModels/CourseData"));
const Section_1 = __importDefault(require("../dataModels/Section"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
const Room_1 = __importDefault(require("../dataModels/Room"));
const decimal_js_1 = __importDefault(require("decimal.js"));
class Executor {
    extractDatasetId(query) {
        let datasetIds = new Set();
        this.extractIdsFromFilter(query.WHERE, datasetIds);
        query.OPTIONS.COLUMNS.forEach((column) => {
            const datasetId = this.extractIdFromKey(column);
            if (datasetId) {
                datasetIds.add(datasetId);
            }
        });
        if (datasetIds.size !== 1) {
            throw new Error("Query must use a single dataset ID");
        }
        return datasetIds.values().next().value;
    }
    extractIdsFromFilter(filter, datasetIds) {
        Object.entries(filter).forEach(([key, value]) => {
            if (key === "AND" || key === "OR") {
                value.forEach((subFilter) => this.extractIdsFromFilter(subFilter, datasetIds));
            }
            else if (key === "NOT") {
                this.extractIdsFromFilter(value, datasetIds);
            }
            else {
                const fieldKey = Object.keys(value)[0];
                const datasetId = this.extractIdFromKey(fieldKey);
                if (datasetId) {
                    datasetIds.add(datasetId);
                }
            }
        });
    }
    extractIdFromKey(key) {
        const underscoreIndex = key.indexOf("_");
        if (underscoreIndex !== -1) {
            return key.substring(0, underscoreIndex);
        }
        return null;
    }
    applyFilters(courseData, filter) {
        if (Object.keys(filter).length === 0) {
            if (courseData instanceof CourseData_1.default) {
                return courseData.sections;
            }
            else {
                return courseData.rooms;
            }
        }
        if (courseData instanceof CourseData_1.default) {
            return courseData.sections.filter((section) => {
                return this.evaluateFilter(section, filter);
            });
        }
        else {
            return courseData.rooms.filter((section) => {
                return this.evaluateFilter(section, filter);
            });
        }
    }
    isLogicComparison(filter) {
        return "AND" in filter || "OR" in filter;
    }
    isMComparison(filter) {
        return "LT" in filter || "GT" in filter || "EQ" in filter;
    }
    isSComparison(filter) {
        return "IS" in filter;
    }
    isNegation(filter) {
        return "NOT" in filter;
    }
    evaluateFilter(section, filter) {
        if (this.isLogicComparison(filter)) {
            if (filter.AND) {
                return filter.AND.every((subFilter) => this.evaluateFilter(section, subFilter));
            }
            else if (filter.OR) {
                return filter.OR.some((subFilter) => this.evaluateFilter(section, subFilter));
            }
            else {
                return false;
            }
        }
        else if (this.isNegation(filter)) {
            return !this.evaluateFilter(section, filter.NOT);
        }
        else if (this.isSComparison(filter)) {
            const [key, comparisonValue] = Object.entries(filter.IS)[0];
            const keyParts = key.split("_");
            const value = filter.IS[key];
            const getValue = section.get(keyParts[1]);
            if (comparisonValue.startsWith("*") && comparisonValue.endsWith("*")) {
                const trimmedValue = comparisonValue.slice(1, -1);
                return getValue.includes(trimmedValue);
            }
            else if (comparisonValue.startsWith("*")) {
                const trimmedValue = comparisonValue.slice(1);
                return getValue.endsWith(trimmedValue);
            }
            else if (comparisonValue.endsWith("*")) {
                const trimmedValue = comparisonValue.slice(0, -1);
                return getValue.startsWith(trimmedValue);
            }
            else {
                return getValue === value;
            }
        }
        else if (this.isMComparison(filter)) {
            const comparatorKey = Object.keys(filter)[0];
            const key = Object.keys(filter[comparatorKey])[0];
            const targetValue = filter[comparatorKey][key];
            const keyParts = key.split("_");
            const sectionValue = section.get(keyParts[1]);
            if (sectionValue === undefined) {
                throw new Error("Attempted to compare an undefined value");
            }
            switch (comparatorKey) {
                case "LT": return sectionValue < targetValue;
                case "GT": return sectionValue > targetValue;
                case "EQ": return sectionValue === targetValue;
                default: throw new Error(`Unknown comparison: ${comparatorKey}`);
            }
        }
        else {
            throw new Error("Unknown filter type");
        }
    }
    formatResults(sections, options) {
        const results = sections.map((section) => {
            const result = {};
            options.COLUMNS.forEach((column) => {
                const colParts = column.split("_");
                const key = colParts[1];
                if (colParts.length === 2) {
                    if ((section instanceof Section_1.default) || (section instanceof Room_1.default)) {
                        result[column] = section.get(key);
                    }
                    else {
                        result[column] = section[column];
                    }
                }
                else {
                    result[column] = section[column];
                }
            });
            return result;
        });
        if (options.ORDER) {
            results.sort(this.getSortFunction(options.ORDER));
        }
        return results;
    }
    getSortFunction(order) {
        if (typeof order === "string") {
            return (a, b) => {
                return a[order] > b[order] ? 1 : a[order] < b[order] ? -1 : 0;
            };
        }
        return (a, b) => {
            for (const key of order.keys) {
                if (a[key] !== b[key]) {
                    const directionMultiplier = order.dir === "UP" ? 1 : -1;
                    return a[key] > b[key] ? directionMultiplier : -directionMultiplier;
                }
            }
            return 0;
        };
    }
    executeGroupAndApply(rows, transformations) {
        const groups = this.groupBy(rows, transformations.GROUP);
        return this.applyTransformations(groups, transformations.APPLY, transformations.GROUP);
    }
    groupBy(rows, groupKeys) {
        const groups = new Map();
        rows.forEach((row) => {
            const groupKey = groupKeys.map((key) => {
                const value = row.get(key.split("_")[1]);
                if (value === undefined) {
                    throw new IInsightFacade_1.InsightError(`Value for key ${key} is undefined`);
                }
                return typeof value === "number" ? value.toString() : value;
            }).join("||");
            const group = groups.get(groupKey) || [];
            group.push(row);
            groups.set(groupKey, group);
        });
        return groups;
    }
    applyTransformations(groups, applyRules, groupKeys) {
        const transformedResults = [];
        groups.forEach((groupRows, groupKey) => {
            const result = {};
            applyRules.forEach((rule) => {
                const applyKey = Object.keys(rule)[0];
                const applyOperation = rule[applyKey];
                const operationType = Object.keys(applyOperation)[0];
                const fieldToOperateOn = applyOperation[operationType];
                result[applyKey] = this.performApplyOperation(groupRows, fieldToOperateOn, operationType);
            });
            const groupValues = groupKey.split("||");
            groupKeys.forEach((key, index) => {
                result[key] = groupValues[index];
            });
            transformedResults.push(result);
        });
        return transformedResults;
    }
    performApplyOperation(groupRows, applyToken, targetField) {
        if (targetField === "AVG") {
            return this.getAvg(groupRows, applyToken);
        }
        else if (targetField === "MAX") {
            return this.getMax(groupRows, applyToken);
        }
        else if (targetField === "MIN") {
            return this.getMin(groupRows, applyToken);
        }
        else if (targetField === "SUM") {
            return this.getSum(groupRows, applyToken);
        }
        else if (targetField === "COUNT") {
            return this.getCount(groupRows, applyToken);
        }
        else {
            throw new IInsightFacade_1.InsightError("Invalid");
        }
    }
    getMax(groupRows, targetField) {
        return groupRows.reduce((max, row) => {
            const value = row.get(targetField.split("_")[1]);
            return typeof value === "number" && value > max ? value : max;
        }, Number.NEGATIVE_INFINITY);
    }
    getMin(groupRows, targetField) {
        return groupRows.reduce((min, row) => {
            const value = row.get(targetField.split("_")[1]);
            return typeof value === "number" && value < min ? value : min;
        }, Number.POSITIVE_INFINITY);
    }
    getAvg(groupRows, targetField) {
        let total = new decimal_js_1.default(0);
        groupRows.forEach((row) => {
            const value = row.get(targetField.split("_")[1]);
            if (typeof value === "number") {
                total = total.add(new decimal_js_1.default(value));
            }
        });
        if (groupRows.length === 0) {
            throw new IInsightFacade_1.InsightError("No valid rows for average calculation");
        }
        const avg = total.toNumber() / (groupRows.length);
        return Number(avg.toFixed(2));
    }
    getSum(groupRows, targetField) {
        let total = 0;
        groupRows.forEach((row) => {
            const value = row.get(targetField.split("_")[1]);
            if (typeof value === "number") {
                total += value;
            }
        });
        return Number(total.toFixed(2));
    }
    getCount(groupRows, targetField) {
        const uniqueValues = new Set();
        groupRows.forEach((row) => {
            const value = row.get(targetField.split("_")[1]);
            if (value !== undefined) {
                uniqueValues.add(value);
            }
        });
        return uniqueValues.size;
    }
    sortResults(results, order) {
        const directionMultiplier = order.dir === "UP" ? 1 : -1;
        return results.sort((a, b) => {
            for (const key of order.keys) {
                if (a[key] < b[key]) {
                    return -1 * directionMultiplier;
                }
                else if (a[key] > b[key]) {
                    return 1 * directionMultiplier;
                }
            }
            return 0;
        });
    }
}
exports.Executor = Executor;
//# sourceMappingURL=Executor.js.map