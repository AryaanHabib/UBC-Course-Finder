"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const InsightFacade_1 = __importDefault(require("../controller/InsightFacade"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
class ServerHelper {
    insightFacade = new InsightFacade_1.default();
    async putDataset(req, res) {
        try {
            const id = req.params.id;
            const kind = req.params.kind;
            if (!req.body || req.body === "") {
                res.status(400).json({ error: "Invalid File" });
                return;
            }
            const content = req.body.toString("base64");
            const result = await this.insightFacade.addDataset(id, content, kind);
            res.status(200).json({ result });
        }
        catch (error) {
            res.status(400).json({ error: "Error adding dataset" });
        }
    }
    async deleteDataset(req, res) {
        try {
            const id = req.params.id;
            const result = await this.insightFacade.removeDataset(id);
            res.status(200).json({ result });
        }
        catch (error) {
            if (error instanceof IInsightFacade_1.NotFoundError) {
                res.status(404).json({ error: "Dataset not found" });
            }
            else {
                res.status(400).json({ error: "Error removing dataset" });
            }
        }
    }
    async postQuery(req, res) {
        try {
            const query = req.body;
            const result = await this.insightFacade.performQuery(query);
            res.status(200).json({ result });
        }
        catch (error) {
            res.status(400).json({ error: "Error performing query" });
        }
    }
    async getDatasets(req, res) {
        try {
            const result = await this.insightFacade.listDatasets();
            res.status(200).json({ result });
        }
        catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    }
}
exports.default = ServerHelper;
//# sourceMappingURL=ServerHelper.js.map