"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSectionsHelper = void 0;
const CourseData_1 = __importDefault(require("../dataModels/CourseData"));
const jszip_1 = __importDefault(require("jszip"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
class AddSectionsHelper {
    async addSectionsDataset(id, content, idCollection, dataCollection) {
        let dataset;
        let filePromises = Array();
        const zip = await jszip_1.default.loadAsync(content, { base64: true });
        const coursesFolder = zip.folder("courses");
        if (!coursesFolder) {
            throw new IInsightFacade_1.InsightError("Folder does not exist in the zip file");
        }
        coursesFolder.forEach((relativePath, file) => {
            filePromises.push(file.async("text"));
        });
        const filesContent = await Promise.all(filePromises);
        dataset = new CourseData_1.default(id, IInsightFacade_1.InsightDatasetKind.Sections, filesContent);
        if (dataset.sections.length === 0) {
            throw new IInsightFacade_1.InsightError("No valid sections to add");
        }
        idCollection.push(id);
        dataCollection.push(dataset);
        return idCollection;
    }
}
exports.AddSectionsHelper = AddSectionsHelper;
//# sourceMappingURL=AddSectionsHelper.js.map