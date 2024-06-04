"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RoomData {
    id;
    rooms;
    kind;
    insightDataset;
    constructor(id, rooms, kind) {
        this.rooms = rooms;
        this.id = id;
        this.kind = kind;
        this.insightDataset = { id: id, numRows: this.rooms.length, kind: kind };
    }
}
exports.default = RoomData;
//# sourceMappingURL=RoomData.js.map