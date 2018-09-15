"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TableProcessor = /** @class */ (function () {
    function TableProcessor(table) {
        this.table = table;
    }
    TableProcessor.prototype.processRecordsets = function (result) {
        if (result &&
            result.recordset &&
            result.recordset.length > 0)
            return this.parseObjects(result.recordset);
        return [];
    };
    TableProcessor.prototype.formatObject = function (obj) {
        var result = {};
        this.table.schema.columns.forEach(function (name) { return result[name] = JSON.stringify(obj[name]); });
        return result;
    };
    TableProcessor.prototype.parseObjects = function (objs) {
        var _this = this;
        var result = [];
        objs.forEach(function (obj) {
            var parsedObj = {};
            var keys = Object.keys(obj);
            keys.forEach(function (key) {
                var found = _this.table.schema.columns.find(function (match) { return match == key; });
                if (found)
                    parsedObj[key] = JSON.parse(obj[key]);
            });
            result.push(parsedObj);
        });
        return result;
    };
    return TableProcessor;
}());
exports.TableProcessor = TableProcessor;
//# sourceMappingURL=table-processor.js.map