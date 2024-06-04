"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const IInsightFacade_1 = require("../controller/IInsightFacade");
class Parser {
    parseQuery(query) {
        if (typeof query !== "object" || query === null) {
            throw new IInsightFacade_1.InsightError("Query must be an object");
        }
        const whereClause = this.parseWhereClause(query["WHERE"]);
        const optionsClause = this.parseOptionsClause(query["OPTIONS"]);
        const transformationsClause = query["TRANSFORMATIONS"]
            ? this.parseTransformationsClause(query["TRANSFORMATIONS"])
            : undefined;
        const parsedQuery = {
            WHERE: whereClause,
            OPTIONS: optionsClause,
        };
        if (transformationsClause) {
            parsedQuery.TRANSFORMATION = transformationsClause;
        }
        return parsedQuery;
    }
    parseWhereClause(where) {
        if (typeof where !== "object" || where === null) {
            throw new Error("WHERE clause must be an object");
        }
        if (Object.keys(where).length === 0) {
            return {};
        }
        const filterType = Object.keys(where)[0];
        const filterValue = where[filterType];
        switch (filterType) {
            case "AND":
            case "OR":
                return this.parseLogicalComparison(filterType, filterValue);
            case "LT":
            case "GT":
            case "EQ":
                return this.parseMComparison(filterType, filterValue);
            case "IS":
                return this.parseSComparison(filterValue);
            case "NOT":
                return { NOT: this.parseWhereClause(filterValue) };
            default:
                throw new Error(`Invalid filter type: ${filterType}`);
        }
    }
    parseLogicalComparison(operator, filters) {
        if (!Array.isArray(filters)) {
            throw new Error(`${operator} value must be an array`);
        }
        return {
            [operator]: filters.map((filter) => this.parseWhereClause(filter)),
        };
    }
    parseMComparison(operator, comparison) {
        if (typeof comparison !== "object" || comparison === null || Object.keys(comparison).length !== 1) {
            throw new Error(`${operator} comparison requires a single field with a numeric value`);
        }
        const [field, value] = Object.entries(comparison)[0];
        if (typeof value !== "number") {
            throw new Error(`Value for ${field} in ${operator} comparison must be a number`);
        }
        return { [operator]: { [field]: value } };
    }
    parseSComparison(comparison) {
        if (typeof comparison !== "object" || comparison === null || Object.keys(comparison).length !== 1) {
            throw new Error("IS comparison requires a single field with a string value");
        }
        const [field, value] = Object.entries(comparison)[0];
        if (typeof value !== "string") {
            throw new Error(`Value for ${field} in IS comparison must be a string`);
        }
        return { IS: { [field]: value } };
    }
    parseOptionsClause(options) {
        if (typeof options !== "object" || options === null) {
            throw new IInsightFacade_1.InsightError("OPTIONS must be an object");
        }
        const optionsObj = options;
        if (!Array.isArray(optionsObj.COLUMNS) || optionsObj.COLUMNS.length === 0) {
            throw new IInsightFacade_1.InsightError("COLUMNS must be a non-empty array");
        }
        const columns = optionsObj.COLUMNS;
        columns.forEach((column) => {
            if (typeof column !== "string") {
                throw new IInsightFacade_1.InsightError("Each item in COLUMNS must be a string");
            }
        });
        const parsedOptions = { COLUMNS: columns };
        if (optionsObj.ORDER !== undefined) {
            const order = optionsObj.ORDER;
            if (typeof order === "string") {
                parsedOptions.ORDER = order;
            }
            else if (typeof order === "object" && order !== null) {
                parsedOptions.ORDER = this.parseOrderClause(order);
            }
            else {
                throw new IInsightFacade_1.InsightError("Invalid ORDER format");
            }
        }
        return parsedOptions;
    }
    parseOrderClause(order) {
        if (typeof order === "string") {
            return order;
        }
        if (typeof order === "object" && order !== null && "dir" in order && "keys" in order) {
            const dir = order.dir;
            const keys = order.keys;
            if (dir !== "UP" && dir !== "DOWN") {
                throw new IInsightFacade_1.InsightError("ORDER direction must be UP or DOWN");
            }
            if (!Array.isArray(keys)) {
                throw new IInsightFacade_1.InsightError("ORDER keys must be an array");
            }
            keys.forEach((key) => {
                if (typeof key !== "string") {
                    throw new IInsightFacade_1.InsightError("Each ORDER key must be a string");
                }
            });
            return { dir, keys };
        }
        else {
            throw new IInsightFacade_1.InsightError("Invalid ORDER format");
        }
    }
    parseTransformationsClause(transformations) {
        if (typeof transformations !== "object" || transformations === null) {
            throw new IInsightFacade_1.InsightError("TRANSFORMATIONS must be an object");
        }
        const transformationsObj = transformations;
        if (!Array.isArray(transformationsObj.GROUP) || transformationsObj.GROUP.length === 0) {
            throw new IInsightFacade_1.InsightError("GROUP must be a non-empty array");
        }
        const group = transformationsObj.GROUP;
        group.forEach((key) => {
            if (typeof key !== "string") {
                throw new IInsightFacade_1.InsightError("Each key in GROUP must be a string");
            }
        });
        const apply = [];
        if (Array.isArray(transformationsObj.APPLY)) {
            transformationsObj.APPLY.forEach((rule) => {
                const applyKey = Object.keys(rule)[0];
                const applyToken = Object.keys(rule[applyKey])[0];
                const key = rule[applyKey][applyToken];
                if (typeof applyKey !== "string" || typeof applyToken !== "string" || typeof key !== "string") {
                    throw new IInsightFacade_1.InsightError("Invalid APPLY rule format");
                }
                apply.push({ [applyKey]: { [applyToken]: key } });
            });
        }
        apply.forEach((rule) => {
            const applyKey = Object.keys(rule)[0];
            const applyToken = Object.keys(rule[applyKey])[0];
            const tokenValue = rule[applyKey][applyToken];
            if (!["MAX", "MIN", "AVG", "COUNT", "SUM"].includes(applyToken)) {
                throw new IInsightFacade_1.InsightError(`Invalid APPLY token: ${applyToken}`);
            }
            if (typeof tokenValue !== "string") {
                throw new IInsightFacade_1.InsightError(`Value for ${applyToken} must be a string`);
            }
        });
        return {
            GROUP: group,
            APPLY: apply
        };
    }
}
exports.Parser = Parser;
//# sourceMappingURL=Parser.js.map