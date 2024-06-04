"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = __importDefault(require("../../src/rest/Server"));
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
const TestUtil_1 = require("../TestUtil");
const PORT = 4321;
const SERVER_URL = `localhost:${PORT}`;
describe("Facade D3", function () {
    let facade;
    let server;
    let pairzip;
    let campuszip;
    before(async function () {
        await (0, TestUtil_1.clearDisk)();
        facade = new InsightFacade_1.default();
        server = new Server_1.default(PORT);
        pairzip = await (0, TestUtil_1.getContentFromArchives)("pair.zip");
        campuszip = await (0, TestUtil_1.getContentFromArchives)("campus.zip");
        await server.start();
    });
    after(async function () {
        await server.stop();
    });
    beforeEach(async function () {
        await (0, TestUtil_1.clearDisk)();
    });
    afterEach(function () {
    });
    it("PUT test for adding the 'pair' dataset", async function () {
        const ZIP_FILE_DATA = Buffer.from(pairzip, "base64");
        const ENDPOINT_URL = "/dataset/pair/sections";
        const response = await (0, supertest_1.default)(SERVER_URL)
            .put(ENDPOINT_URL)
            .set("Content-Type", "application/x-zip-compressed")
            .send(ZIP_FILE_DATA)
            .expect(200);
        (0, chai_1.expect)(response.body).to.have.property("result");
        console.log("PUT test for adding the 'pair' dataset passed with response:", response.body);
    });
    it("PUT test for adding the 'campus' dataset", async function () {
        const ZIP_FILE_DATA = Buffer.from(campuszip, "base64");
        const ENDPOINT_URL = "/dataset/campus/rooms";
        const response = await (0, supertest_1.default)(SERVER_URL)
            .put(ENDPOINT_URL)
            .set("Content-Type", "application/x-zip-compressed")
            .send(ZIP_FILE_DATA)
            .expect(200);
        (0, chai_1.expect)(response.body).to.have.property("result");
        console.log("PUT test for adding the 'campus' dataset passed with response:", response.body);
    });
    it("DELETE test for a dataset", async function () {
        const DATASET_ID = "pair";
        const ENDPOINT_URL = `/dataset/${DATASET_ID}`;
        try {
            const response = await (0, supertest_1.default)(SERVER_URL)
                .del(ENDPOINT_URL)
                .expect(200);
            (0, chai_1.expect)(response.body).to.have.property("result");
            (0, chai_1.expect)(response.body.result).to.be.equal(DATASET_ID);
            console.log("DELETE test passed with response:", response.body);
        }
        catch (err) {
            console.error("DELETE test encountered an error:", err);
            chai_1.expect.fail();
        }
    });
    it("DELETE test for non-existent dataset", async function () {
        const NON_EXISTENT_ID = "nonexistent";
        const ENDPOINT_URL = `/dataset/${NON_EXISTENT_ID}`;
        try {
            const response = await (0, supertest_1.default)(SERVER_URL)
                .del(ENDPOINT_URL)
                .expect(404);
            (0, chai_1.expect)(response.body).to.have.property("error");
            console.log("DELETE test for non-existent dataset passed with response:", response.body);
        }
        catch (err) {
            console.error("DELETE test for non-existent dataset encountered an error:", err);
            chai_1.expect.fail();
        }
    });
    it("GET test to list all datasets", async function () {
        const ENDPOINT_URL = "/datasets";
        try {
            const response = await (0, supertest_1.default)(SERVER_URL)
                .get(ENDPOINT_URL)
                .expect(200);
            (0, chai_1.expect)(response.body).to.have.property("result");
            (0, chai_1.expect)(response.body.result).to.be.an("array");
            console.log("GET test to list all datasets passed with response:", response.body);
        }
        catch (err) {
            console.error("GET test to list all datasets encountered an error:", err);
            chai_1.expect.fail();
        }
    });
});
//# sourceMappingURL=Server.spec.js.map