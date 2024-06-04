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
exports.AddRoomsHelper = void 0;
const IInsightFacade_1 = require("../controller/IInsightFacade");
const jszip_1 = __importDefault(require("jszip"));
const Room_1 = __importDefault(require("../dataModels/Room"));
const RoomData_1 = __importDefault(require("../dataModels/RoomData"));
const parse5 = __importStar(require("parse5"));
const http = __importStar(require("http"));
class AddRoomsHelper {
    async addRoomsDataset(id, content, idCollection, dataCollection) {
        const rooms = [];
        const zip = await jszip_1.default.loadAsync(content, { base64: true });
        const buildings = await this.parseIndexHtml(zip);
        const buildingRoomPromises = buildings.map((building) => {
            building = building.replace(/^\.\//, "");
            return this.parseBuildingHtml(zip, building);
        });
        const buildingRoomsArray = await Promise.all(buildingRoomPromises);
        buildingRoomsArray.forEach((buildingRooms) => {
            rooms.push(...buildingRooms);
        });
        if (rooms.length === 0) {
            throw new Error("No valid rooms found.");
        }
        const roomData = new RoomData_1.default(id, rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
        idCollection.push(id);
        dataCollection.push(roomData);
        return idCollection;
    }
    async parseIndexHtml(zip) {
        const tableRows = [];
        const indexFile = zip.file("index.htm");
        if (!indexFile) {
            throw new Error("index.htm file does not exist in the zip file");
        }
        const htmlContent = await indexFile.async("string");
        const document = parse5.parse(htmlContent);
        const buildingTable = this.findBuildingTable(document);
        if (buildingTable) {
            const rows = this.getTableRows(buildingTable, tableRows);
            return this.extractLinksFromRows(rows);
        }
        else {
            throw new IInsightFacade_1.InsightError("Building table not found in index.htm");
        }
    }
    async parseBuildingHtml(zip, buildingPath) {
        const buildingRooms = [];
        const file = zip.file(buildingPath);
        if (!file) {
            throw new IInsightFacade_1.InsightError(`${buildingPath} not found`);
        }
        const htmlContent = await file.async("string");
        const document = parse5.parse(htmlContent);
        const fName = this.findFullName(document);
        const sName = this.findShortName(buildingPath);
        const address = this.findAddress(document);
        let lat;
        let lon;
        let geo = {
            lat: 0,
            lon: 0,
            error: "no coordinates"
        };
        if (address) {
            try {
                geo = await this.getGeoLocation(address);
                lat = geo.lat;
                lon = geo.lon;
            }
            catch {
                throw new IInsightFacade_1.InsightError(geo.error);
            }
        }
        const roomsList = this.extractRoomRows(document);
        for (const roomRow of roomsList) {
            const tableProps = this.extractTableFeatures(roomRow);
            if (lat !== undefined && lon !== undefined) {
                const room = new Room_1.default(fName, sName, tableProps[0], sName + "_" + tableProps[0], address, lat, lon, tableProps[1], tableProps[3].trim(), tableProps[2].trim(), tableProps[4]);
                buildingRooms.push(room);
            }
        }
        return buildingRooms;
    }
    findBuildingTable(node) {
        if (node.tagName === "table" && node.attrs && node.attrs.some((attr) => attr.name === "class" && attr.value.includes("views-table"))) {
            return node;
        }
        if (node.childNodes) {
            for (const childNode of node.childNodes) {
                const result = this.findBuildingTable(childNode);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }
    getTableRows(node, rowsList) {
        if (node.tagName === "tr") {
            rowsList.push(node);
        }
        if (node.childNodes) {
            for (const cNode of node.childNodes) {
                this.getTableRows(cNode, rowsList);
            }
        }
        return rowsList;
    }
    extractLinksFromRows(rows) {
        const links = [];
        rows.forEach((row) => {
            if (row.childNodes) {
                for (const cNode of row.childNodes) {
                    this.extractLinks(cNode, links);
                }
            }
        });
        return links;
    }
    extractLinks(node, links) {
        if (node.tagName === "td" && node.attrs && node.attrs.some((attr) => attr.name === "class" && attr.value.includes("views-field views-field-title"))) {
            if (node.childNodes) {
                node.childNodes.forEach((childNode) => {
                    if (childNode.tagName === "a" && childNode.attrs) {
                        const hrefAttr = childNode.attrs.find((attr) => attr.name === "href");
                        if (hrefAttr) {
                            links.push(hrefAttr.value);
                        }
                    }
                });
            }
        }
    }
    findFullName(node) {
        if (node.tagName === "div" && node.attrs && node.attrs.some((attr) => attr.name === "id" && attr.value === "building-info")) {
            if (node.childNodes) {
                return this.extractFullName(node);
            }
        }
        if (node.childNodes) {
            for (const childNode of node.childNodes) {
                const result = this.findFullName(childNode);
                if (result) {
                    return result;
                }
            }
        }
        return "";
    }
    extractFullName(node) {
        if (node.attrs && node.attrs.some((attr) => attr.name === "class" && attr.value === "field-content")) {
            const text = node.childNodes.find((child) => child.nodeName === "#text");
            return text?.value;
        }
        if (node.childNodes) {
            for (const childNode of node.childNodes) {
                const result = this.extractFullName(childNode);
                if (result) {
                    return result;
                }
            }
        }
        return "";
    }
    findShortName(path) {
        const name = path.split("/").pop();
        if (name) {
            return name?.replace(/\.htm$/i, "");
        }
        else {
            return "";
        }
    }
    findAddress(node) {
        if (node.tagName === "div" && node.attrs && node.attrs.some((attr) => attr.name === "class" && attr.value.includes("building-field"))) {
            return node.childNodes[0].childNodes[0].value;
        }
        if (node.childNodes) {
            for (const childNode of node.childNodes) {
                const result = this.findAddress(childNode);
                if (result) {
                    return result;
                }
            }
        }
        return "";
    }
    async getGeoLocation(address) {
        return new Promise((resolve, reject) => {
            const encodedAddress = encodeURIComponent(address);
            const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team117/${encodedAddress}`;
            http.get(url, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Request Failed. Status Code: ${res.statusCode}`));
                    return;
                }
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    try {
                        const parsedData = JSON.parse(data);
                        resolve(parsedData);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            }).on("error", (e) => {
                reject(e);
            });
        });
    }
    extractRoomRows(document) {
        const roomRows = [];
        let rows = [];
        const roomsTable = this.findBuildingTable(document);
        if (roomsTable) {
            const tbody = roomsTable.childNodes.find((child) => child.tagName === "tbody");
            rows = this.getTableRows(tbody, roomRows);
        }
        return rows;
    }
    extractTableFeatures(roomRow) {
        let properties = [];
        properties[0] = this.extractNumber(roomRow);
        properties[1] = this.extractCapacity(roomRow);
        properties[2] = this.extractFurnitureNType(roomRow, "furniture");
        properties[3] = this.extractFurnitureNType(roomRow, "type");
        properties[4] = this.extractHref(roomRow);
        return properties;
    }
    extractNumber(node) {
        if (node.tagName === "td" && node.attrs && node.attrs.some((attr) => attr.name === "class" && attr.value.includes("views-field views-field-field-room-number"))) {
            return node.childNodes[1].childNodes[0].value;
        }
        if (node.childNodes) {
            for (const childNode of node.childNodes) {
                const result = this.extractNumber(childNode);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }
    extractCapacity(node) {
        if (node.tagName === "td" && node.attrs && node.attrs.some((attr) => attr.name === "class" && attr.value.includes("views-field views-field-field-room-capacity"))) {
            return parseInt(node.childNodes[0].value.trim(), 10);
        }
        if (node.childNodes) {
            for (const childNode of node.childNodes) {
                const result = this.extractCapacity(childNode);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }
    extractFurnitureNType(node, property) {
        if (node.tagName === "td" && node.attrs && node.attrs.some((attr) => attr.name === "class" && attr.value.includes(`views-field views-field-field-room-${property}`))) {
            return node.childNodes[0].value;
        }
        if (node.childNodes) {
            for (const childNode of node.childNodes) {
                const result = this.extractFurnitureNType(childNode, property);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }
    extractHref(node) {
        if (node.tagName === "td" && node.attrs && node.attrs.some((attr) => attr.name === "class" && attr.value.includes("views-field views-field-nothing"))) {
            return node.childNodes[1].attrs.find((attr) => attr.name === "href").value;
        }
        if (node.childNodes) {
            for (const childNode of node.childNodes) {
                const result = this.extractHref(childNode);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }
}
exports.AddRoomsHelper = AddRoomsHelper;
//# sourceMappingURL=AddRoomsHelper.js.map