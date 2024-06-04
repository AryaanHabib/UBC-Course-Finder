"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const Parser_1 = require("../query/Parser");
const Validator_1 = require("../query/Validator");
const Executor_1 = require("../query/Executor");
const AddRoomsHelper_1 = require("../util/AddRoomsHelper");
const AddSectionsHelper_1 = require("../util/AddSectionsHelper");
class InsightFacade {
    datasetCollection = [];
    courseDataCollection = [];
    queryParser;
    queryValidator;
    queryExecutor;
    adderRoom;
    adderSections;
    constructor() {
        console.log("InsightFacadeImpl::init()");
        this.queryParser = new Parser_1.Parser();
        this.queryValidator = new Validator_1.Validator();
        this.queryExecutor = new Executor_1.Executor();
        this.adderRoom = new AddRoomsHelper_1.AddRoomsHelper();
        this.adderSections = new AddSectionsHelper_1.AddSectionsHelper();
    }
    async addDataset(id, content, kind) {
        console.log("START OF ADD");
        if (!id || id.includes("_") || id.trim() === "") {
            throw new IInsightFacade_1.InsightError("Invalid ID (contains underscore)");
        }
        if (this.datasetCollection.includes(id)) {
            throw new IInsightFacade_1.InsightError("ID already exists");
        }
        if (kind === IInsightFacade_1.InsightDatasetKind.Sections) {
            console.log("Sections");
            return this.adderSections.addSectionsDataset(id, content, this.datasetCollection, this.courseDataCollection);
        }
        else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            console.log("Rooms");
            return this.adderRoom.addRoomsDataset(id, content, this.datasetCollection, this.courseDataCollection);
        }
        else {
            throw new IInsightFacade_1.InsightError("Invalid Kind Type");
        }
    }
    async removeDataset(id) {
        const dataDir = "./data/";
        const filePath = `${dataDir}${id}.json`;
        if (!id || id.includes("_") || id.trim() === "") {
            throw new IInsightFacade_1.InsightError("Invalid ID");
        }
        try {
            const index = this.datasetCollection.indexOf(id);
            if (index === -1) {
                throw new IInsightFacade_1.NotFoundError("Dataset not found");
            }
            if (index !== -1) {
                this.datasetCollection.splice(index, 1);
                this.courseDataCollection.splice(index, 1);
            }
            return id;
        }
        catch (error) {
            if (error instanceof IInsightFacade_1.NotFoundError) {
                throw error;
            }
            else {
                throw new IInsightFacade_1.InsightError(`Failed to remove dataset: ${error}`);
            }
        }
    }
    async performQuery(query) {
        const MAX_RESULTS = 5000;
        try {
            const parsedQuery = this.queryParser.parseQuery(query);
            console.log(parsedQuery.TRANSFORMATION?.APPLY);
            const validatedQuery = this.queryValidator.validateQuery(parsedQuery);
            const datasetId = this.queryExecutor.extractDatasetId(parsedQuery);
            const dataset = this.courseDataCollection[this.datasetCollection.indexOf(datasetId)];
            if (!dataset) {
                throw new IInsightFacade_1.InsightError("Dataset not found");
            }
            let filteredResults = this.queryExecutor.applyFilters(dataset, parsedQuery.WHERE);
            if (parsedQuery.TRANSFORMATION) {
                filteredResults = this.queryExecutor.executeGroupAndApply(filteredResults, parsedQuery.TRANSFORMATION);
            }
            let finalResults = this.queryExecutor.formatResults(filteredResults, parsedQuery.OPTIONS);
            if (parsedQuery.OPTIONS.ORDER) {
                const order = parsedQuery.OPTIONS.ORDER;
                const orderObject = typeof order === "string" ? { dir: "UP", keys: [order] } : order;
                finalResults = this.queryExecutor.sortResults(finalResults, orderObject);
            }
            if (finalResults.length > MAX_RESULTS) {
                throw new IInsightFacade_1.ResultTooLargeError("The query results exceed the allowed limit.");
            }
            return finalResults;
        }
        catch (error) {
            if (error instanceof IInsightFacade_1.ResultTooLargeError) {
                throw new IInsightFacade_1.ResultTooLargeError("ll");
            }
            else {
                throw new IInsightFacade_1.InsightError("l");
            }
        }
    }
    async listDatasets() {
        return new Promise((resolve, reject) => {
            try {
                const datasetList = [];
                for (const courseData of this.courseDataCollection) {
                    datasetList.push(courseData.insightDataset);
                }
                resolve(datasetList);
            }
            catch (error) {
                reject(new IInsightFacade_1.InsightError("Failed to list datasets"));
            }
        });
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map