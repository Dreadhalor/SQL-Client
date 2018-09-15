"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TableProcessor = /** @class */ (function () {
    function TableProcessor(table) {
        this.table = table;
    }
    TableProcessor.prototype.shouldStringify = function (column) {
        return column.dataType.includes('[]') || column.dataType == 'object';
    };
    TableProcessor.prototype.processRecordsets = function (result) {
        if (result &&
            result.recordset &&
            result.recordset.length > 0)
            return this.parseObjects(result.recordset);
        return [];
    };
    TableProcessor.prototype.formatObject = function (obj) {
        var _this = this;
        var result = {};
        this.table.columns.forEach(function (column) {
            var val = obj[column.name];
            if (_this.shouldStringify(column)) {
                val = JSON.stringify(val);
            }
            result[column.name] = val;
        });
        return result;
    };
    TableProcessor.prototype.parseObjects = function (objs) {
        var _this = this;
        var result = [];
        objs.forEach(function (obj) {
            var parsedObj = {};
            var keys = Object.keys(obj);
            keys.forEach(function (key) {
                var found = _this.table.columns.find(function (match) { return match.name == key; });
                if (found) {
                    if (_this.shouldStringify(found))
                        parsedObj[key] = JSON.parse(obj[key]);
                    else
                        parsedObj[key] = obj[key];
                }
            });
            result.push(parsedObj);
        });
        return result;
    };
    return TableProcessor;
}());
exports.TableProcessor = TableProcessor;
//# sourceMappingURL=table-processor.js.map