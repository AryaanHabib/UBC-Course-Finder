"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetCacheManager = void 0;
const fse = __importStar(require("fs-extra"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
const path = __importStar(require("path"));
const CourseData_1 = __importDefault(require("../dataModels/CourseData"));
class DatasetCacheManager {
    dataDir = "./data/";
    async saveDataset(id, data) {
        await fse.ensureDir(this.dataDir);
        const filePath = `${this.dataDir}${id}.json`;
        await fse.writeJson(filePath, data);
    }
    async removeDataset(id) {
        const filePath = `${this.dataDir}${id}.json`;
        try {
            await fse.remove(filePath);
            console.log(`Dataset ${id} removed successfully from disk.`);
        }
        catch (error) {
            console.error(`Error removing dataset ${id} from disk: ${error}`);
            throw new IInsightFacade_1.InsightError("o");
        }
    }
    async listDatasetIds() {
        try {
            const files = await fse.readdir(this.dataDir);
            const ids = files
                .filter((file) => path.extname(file) === ".json")
                .map((file) => path.basename(file, ".json"));
            return ids;
        }
        catch (error) {
            console.error(`Error listing dataset IDs: ${error}`);
            throw new IInsightFacade_1.InsightError("Failed to list dataset IDs from disk.");
        }
    }
    async loadDataset(id) {
        const filePath = path.join(this.dataDir, `${id}.json`);
        try {
            const data = await fse.readJson(filePath);
            console.log(data);
            const sectionsArray = data.sections;
            const datasetKind = data.insightDatasetKind = IInsightFacade_1.InsightDatasetKind.Sections;
            return new CourseData_1.default(id, datasetKind, sectionsArray);
        }
        catch (error) {
            console.error(`Error loading dataset ${id} from disk: ${error}`);
            throw new Error(`Failed to load dataset ${id} from disk.`);
        }
    }
}
exports.DatasetCacheManager = DatasetCacheManager;
//# sourceMappingURL=DatasetCacheManager.js.map