"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const TestUtil_1 = require("../TestUtil");
(0, chai_1.use)(chai_as_promised_1.default);
describe("InsightFacade", function () {
    let facade;
    let facade2;
    let sections;
    let rooms;
    before(async function () {
        sections = await (0, TestUtil_1.getContentFromArchives)("pair.zip");
        rooms = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
    });
    describe("AddDataset", function () {
        beforeEach(function () {
            facade = new InsightFacade_1.default();
        });
        afterEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("should successfully add a dataset", function () {
            const result = facade.addDataset("ubc2", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.have.members(["ubc2"]);
        });
        it("should fail to add a dataset (blankspace)", async function () {
            const result = facade.addDataset(" ", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            await (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail to add a dataset (empty)", function () {
            const result = facade.addDataset("", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail to add a dataset (whitespace)", function () {
            const result = facade.addDataset("  ", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail to add a dataset (underscore)", function () {
            const result = facade.addDataset("u_b_c", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should successfully add multiple datasets", function () {
            const result1 = facade.addDataset("ubc1", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result2 = facade.addDataset("ubc2", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result2).to.eventually.have.members(["ubc1", "ubc2"]);
        });
        it("should fail to add a dataset (with the same id)", async function () {
            const result1 = await facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result2 = facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result2).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with InsightError for an invalid kind", async function () {
            const result = facade.addDataset("ubc", sections, "invalidKind");
            await (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
    });
    describe("removeDataset", function () {
        beforeEach(function () {
            facade = new InsightFacade_1.default();
        });
        it("should successfully remove a dataset", async function () {
            await facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const removeResult = await facade.removeDataset("ubc");
            (0, chai_1.expect)(removeResult).to.equal("ubc");
            const listResult = await facade.listDatasets();
            (0, chai_1.expect)(listResult).to.be.an("array").that.is.empty;
        });
        it("should reject when dataset with given id does not exist", async function () {
            const result = facade.removeDataset("nonexistentDataset");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.NotFoundError);
        });
        it("should successfully remove an existing dataset", async function () {
            await facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = facade.removeDataset("ubc");
            return (0, chai_1.expect)(result).to.eventually.equal("ubc");
        });
        it("should fail to remove a dataset (blankspace)", function () {
            const result = facade.removeDataset(" ");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail to remove a dataset (empty)", function () {
            const result = facade.removeDataset("");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail to remove a dataset (whitespace)", function () {
            const result = facade.removeDataset("  ");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fail to remove a dataset (underscore)", function () {
            const result = facade.removeDataset("u_b_c");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with InsightError for an invalid kind (delete)", async function () {
            const result = facade.addDataset("ubc", sections, "invalidKind");
            await (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
    });
    describe("ListDatasets", function () {
        beforeEach(function () {
            facade = new InsightFacade_1.default();
            facade2 = new InsightFacade_1.default();
        });
        afterEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("should not list because the dataset is empty", async () => {
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.be.an("array").that.is.empty;
        });
        it("should list one dataset", async function () {
            await facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const datasets = await facade.listDatasets();
            (0, chai_1.expect)(datasets).to.deep.equal([{
                    id: "ubc",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 64612
                }]);
        });
        it("should list multiple dataset", async function () {
            await facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("ubc2", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const datasets = await facade.listDatasets();
            (0, chai_1.expect)(datasets).to.deep.equal([{
                    id: "ubc",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 64612
                }, {
                    id: "ubc2",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 64612
                }]);
            await facade.removeDataset("ubc2");
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.deep.equal([{
                    id: "ubc",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 64612
                }]);
        });
    });
    describe("PerformQuery", function () {
        before(async function () {
            facade = new InsightFacade_1.default();
            const loadDatasetPromises = [
                facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms),
            ];
            try {
                await Promise.all(loadDatasetPromises);
            }
            catch (err) {
                throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
            }
        });
        after(async function () {
        });
        describe("valid queries", function () {
            let validQueries;
            try {
                validQueries = (0, TestUtil_1.readFileQueries)("valid");
            }
            catch (e) {
                chai_1.expect.fail(`Failed to read one or more test queries. ${e}`);
            }
            validQueries.forEach(function (test) {
                it(`${test.title}`, function () {
                    return facade.performQuery(test.input).then((result) => {
                        (0, chai_1.expect)(result).to.deep.equal(test.expected);
                    }).catch((err) => {
                        chai_1.assert.fail(`performQuery threw unexpected error: ${err}`);
                    });
                });
            });
        });
        describe("invalid queries", function () {
            let invalidQueries;
            try {
                invalidQueries = (0, TestUtil_1.readFileQueries)("invalid");
            }
            catch (e) {
                chai_1.expect.fail(`Failed to read one or more test queries. ${e}`);
            }
            invalidQueries.forEach(function (test) {
                it(`${test.title}`, function () {
                    return facade.performQuery(test.input).then((result) => {
                        chai_1.assert.fail(`performQuery resolved when it should have rejected with ${test.expected}`);
                    }).catch((err) => {
                        if (test.expected === "InsightError") {
                            (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
                        }
                        else {
                            chai_1.assert.fail("Query threw unexpected error");
                        }
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map