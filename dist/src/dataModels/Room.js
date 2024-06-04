"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Room {
    fullname;
    shortname;
    num;
    name;
    address;
    lat;
    lon;
    seats;
    typ;
    furniture;
    href;
    constructor(fullname, shortname, num, name, address, lat, lon, seats, typ, furniture, href) {
        this.fullname = fullname;
        this.shortname = shortname;
        this.num = num;
        this.name = name;
        this.address = address;
        this.lat = lat;
        this.lon = lon;
        this.seats = seats;
        this.typ = typ;
        this.furniture = furniture;
        this.href = href;
    }
    get(keyID) {
        if (keyID === "fullname") {
            return this.fullname;
        }
        else if (keyID === "shortname") {
            return this.shortname;
        }
        else if (keyID === "number") {
            return this.num;
        }
        else if (keyID === "name") {
            return this.name;
        }
        else if (keyID === "address") {
            return this.address;
        }
        else if (keyID === "lat") {
            return this.lat;
        }
        else if (keyID === "lon") {
            return this.lon;
        }
        else if (keyID === "seats") {
            return this.seats;
        }
        else if (keyID === "type") {
            return this.typ;
        }
        else if (keyID === "furniture") {
            return this.furniture;
        }
        else if (keyID === "href") {
            return this.href;
        }
        else {
            return undefined;
        }
    }
}
exports.default = Room;
//# sourceMappingURL=Room.js.map