"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TableProcessor;
(function (TableProcessor) {
    var processRecordsets = exports.processRecordsets = function (result, columns) {
        if (result &&
            result.recordset &&
            result.recordset.length > 0)
            return parseObjects(result.recordset, columns);
        return [];
    };
    var formatObject = exports.formatObject = function (obj, columns) {
        var result = {};
        columns.forEach(function (name) { return result[name] = JSON.stringify(obj[name]); });
        return result;
    };
    var parseObjects = function (objs, columns) {
        var result = [];
        objs.forEach(function (obj) {
            var parsedObj = {};
            var keys = Object.keys(obj);
            keys.forEach(function (key) {
                var found = columns.find(function (match) { return match == key; });
                if (found)
                    parsedObj[key] = JSON.parse(obj[key]);
            });
            result.push(parsedObj);
        });
        return result;
    };
})(TableProcessor = exports.TableProcessor || (exports.TableProcessor = {}));
//# sourceMappingURL=table-processor.js.map