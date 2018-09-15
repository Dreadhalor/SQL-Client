"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var fse = require("fs-extra");
var PromisePlus = require('@dreadhalor/bluebird-plus');
var scriptGenerator = require('./table-helpers/table-script-generator');
var table_processor_1 = require("./table-helpers/table-processor");
var path = require("path");
var Table = /** @class */ (function () {
    function Table(db, schema) {
        var _this = this;
        this.columns = [];
        this.processor = new table_processor_1.TableProcessor(this);
        this.templateDirectory = path.resolve(__dirname, 'scripts/templates/tables');
        this.tablesDirectory = path.resolve(__dirname, 'scripts/generated/tables');
        this.update = new rxjs_1.Subject();
        this.db = db;
        this.tableName = schema.name;
        schema.columns.forEach(function (column) {
            _this.columns.push({
                name: column.name,
                primary: !!column.primary
            });
        });
        this.columns = this.singularizePrimaryKey(this.columns);
        this.constructTable();
    }
    Table.prototype.getTemplateFiles = function () {
        var _this = this;
        var names;
        var files = {};
        return fse.readdir(this.templateDirectory)
            .then(function (filenames) {
            names = filenames;
            return Promise.all(filenames.map(function (filename) { return fse.readFile(_this.templateDirectory + "/" + filename, 'utf8'); }));
        })
            .then(function (fileContents) {
            fileContents.forEach(function (content, index) {
                var name = names[index].substring(0, names[index].lastIndexOf('.template'));
                files[name] = {
                    file: names[index],
                    runOrder: _this.findRunOrder(content)
                };
            });
            return files;
        });
    };
    Table.prototype.findRunOrder = function (singleFileContents) {
        var runOrderKey = 'RUN-ORDER ';
        try {
            var trimmed = singleFileContents.substring(singleFileContents.indexOf(runOrderKey));
            var carriageReturnIndex = trimmed.indexOf("\r");
            var newlineIndex = trimmed.indexOf("\n");
            var cutIndex = carriageReturnIndex >= 0 ? carriageReturnIndex : newlineIndex;
            trimmed = trimmed.substring(runOrderKey.length, cutIndex);
            trimmed = Number.parseInt(trimmed);
            return trimmed;
        }
        catch (_a) {
            return -1;
        }
    };
    Object.defineProperty(Table.prototype, "templateFilesMapped", {
        get: function () {
            return this.getTemplateFiles()
                .then(function (files) {
                var result = {};
                var keys = Object.keys(files);
                keys.forEach(function (key) { return result[key] = files[key].file; });
                return result;
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "templateFilesInRunOrder", {
        get: function () {
            var queue = [];
            return this.getTemplateFiles()
                .then(function (files) {
                files = Object.entries(files);
                files = files.map(function (file) {
                    return {
                        name: file[0],
                        runOrder: file[1].runOrder
                    };
                });
                files.sort(function (a, b) { return a.runOrder - b.runOrder; });
                files = files.filter(function (a) { return a.runOrder >= 0; });
                while (files.length > 0) {
                    var group = [], indexes = [], turn = files[0].runOrder;
                    for (var i = 0; i < files.length; i++)
                        if (files[i].runOrder == turn)
                            indexes.push(i);
                    for (var i = indexes.length - 1; i >= 0; i--)
                        group = group.concat(files.splice(i, 1).map(function (file) { return file.name; }));
                    queue.push(group);
                }
                return queue;
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "destDirectory", {
        get: function () {
            return this.tablesDirectory + "/" + this.tableName;
        },
        enumerable: true,
        configurable: true
    });
    Table.prototype.constructTable = function () {
        return __awaiter(this, void 0, void 0, function () {
            var scripts, scriptFiles, _a, _b, _c;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _b = (_a = scriptGenerator).generateScripts;
                        _c = {
                            database: this.db,
                            tableName: this.tableName,
                            columns: this.columns,
                            templateDirectory: this.templateDirectory
                        };
                        return [4 /*yield*/, this.templateFilesMapped];
                    case 1:
                        _b.apply(_a, [(_c.templateFiles = _d.sent(),
                                _c.tablesDirectory = this.tablesDirectory,
                                _c)])
                            .then(function (scriptFilesVariable) {
                            scriptFiles = scriptFilesVariable;
                            return _this.templateFilesInRunOrder;
                        })
                            .then(function (filesInRunOrder) {
                            scripts = filesInRunOrder.map(function (group) { return group.map(function (name) { return scriptFiles[name]; }); });
                            return new Promise(function (resolve) {
                                _this.db.onConnected(function (result) { return resolve(result); });
                            });
                        })
                            .then(function (databaseExists) { return PromisePlus.nestedPromiseAll(scripts, function (file) { return fse.readFile(file, 'utf8'); }); })
                            .then(function (result) { return PromisePlus.sequentialPromiseAll(result, _this.db.executeQueryAsPreparedStatement); })
                            .catch(function (exception) { return console.log(exception); });
                        return [2 /*return*/];
                }
            });
        });
    };
    Table.prototype.singularizePrimaryKey = function (columns) {
        var primary = false;
        for (var i = 0; i < columns.length; i++) {
            if (columns[i].primary) {
                if (primary)
                    columns[i].primary = false;
                primary = true;
            }
        }
        return columns;
    };
    Table.prototype.primaryKey = function () {
        var pk = Table.deepCopy(this.columns.find(function (match) { return match.primary; }));
        return pk;
    };
    Table.prototype.fields = function () {
        return this.columns.map(function (column) { return column.name; });
    };
    Table.prototype.oneHotPrimaryKeyArray = function () {
        return this.columns.map(function (column) { return column.primary; });
    };
    Table.prototype.formatRow = function (obj) {
        var columns = this.columns.map(function (column) {
            //DEEP COPYING NECESSARY FOR CLOSELY-SPACED EDITS
            column = Table.deepCopy(column);
            column.value = obj[column.name];
            return column;
        });
        return columns;
    };
    Table.prototype.tableInfo = function () {
        return {
            tableName: this.tableName,
            columns: this.columns.map(function (column) { return Table.deepCopy(column); })
        };
    };
    Table.prototype.equals = function (array1, array2) {
        var a1 = array1.length, a2 = array2.length;
        if (a1 != a2)
            return false;
        for (var i = 0; i < a1; i++) {
            if (array1[i] != array2[i])
                return false;
        }
        return true;
    };
    Table.prototype.saveSingular = function (item) {
        var _this = this;
        if (!item)
            throw 'Item is null';
        var itemKeys = Object.keys(item);
        if (this.equals(itemKeys, this.fields())) {
            var formattedItem = this.processor.formatObject(item);
            var info_1 = {
                tableName: this.tableName,
                columns: this.formatRow(formattedItem)
            };
            return fse.readFile(this.tablesDirectory + "/" + this.tableName + "/save_" + this.tableName + ".sql", 'utf8')
                .then(function (file) { return _this.db.prepareQueryAndExecute(file, info_1); })
                .then(function (executed) { return _this.processor.processRecordsets(executed); })
                .then(function (processed) {
                var result;
                if (processed.length > 1)
                    result = {
                        operation: 'update',
                        deleted: processed[0],
                        created: processed[1]
                    };
                else
                    result = {
                        operation: 'create',
                        created: processed[0]
                    };
                return result;
            });
        }
        throw 'Item properties are incorrect.';
    };
    Table.prototype.saveMultiple = function (items) {
        var _this = this;
        if (!items)
            throw 'Item is null';
        if (!Array.isArray(items)) {
            var array = [];
            array.push(items);
            items = array;
        }
        var promises = items.map(function (item) { return _this.saveSingular(item); });
        return Promise.all(promises)
            .then(function (success) {
            //success = array of ops
            var created = success.filter(function (match) { return match.operation == 'create'; })
                .map(function (op) { return op.created; });
            var updated = success.filter(function (match) { return match.operation == 'update'; })
                .map(function (op) {
                return {
                    created: op.created,
                    deleted: op.deleted
                };
            });
            var result;
            if (created.length > 0 && updated.length > 0) {
                result = {
                    operation: 'create update',
                    created: created,
                    updated: updated
                };
            }
            else if (created.length > 0) {
                result = {
                    operation: 'create',
                    created: created
                };
            }
            else if (updated.length > 0) {
                result = {
                    operation: 'update',
                    updated: updated
                };
            }
            return result;
        });
    };
    Table.prototype.save = function (items, agent) {
        var _this = this;
        return this.saveMultiple(items)
            .then(function (result) {
            if (result) {
                result.table = _this.tableName;
                if (agent)
                    result.agent = agent;
                _this.update.next(result);
            }
            return result;
        });
    };
    Table.prototype.findById = function (id) {
        var _this = this;
        var columns = [];
        var pk = this.primaryKey();
        pk.value = id;
        columns.push(pk);
        return fse.readFile(this.tablesDirectory + "/" + this.tableName + "/pull_by_id_" + this.tableName + ".sql", 'utf8')
            .then(function (query) { return _this.db.prepareQueryFromColumnsAndExecute(query, columns); })
            .then(function (found) {
            return _this.processor.processRecordsets(found)[0];
        });
    };
    Table.prototype.pullAll = function () {
        var _this = this;
        return fse.readFile(this.tablesDirectory + "/" + this.tableName + "/pull_all_" + this.tableName + ".sql", 'utf8')
            .then(function (query) { return _this.db.executeQueryAsPreparedStatement(query); })
            .then(function (pulled) { return _this.processor.processRecordsets(pulled); });
    };
    Table.prototype.deleteById = function (id, agent) {
        var _this = this;
        var columns = [];
        var pk = this.primaryKey();
        pk.value = id;
        columns.push(pk);
        return fse.readFile(this.tablesDirectory + "/" + this.tableName + "/delete_by_id_" + this.tableName + ".sql", 'utf8')
            .then(function (query) { return _this.db.prepareQueryFromColumnsAndExecute(query, columns); })
            .then(function (deleted) { return _this.processor.processRecordsets(deleted); })
            .then(function (processed) {
            var array = [];
            array.push(processed[0]);
            var result = {
                table: _this.tableName,
                operation: 'delete',
                deleted: array
            };
            if (agent)
                result.agent = agent;
            _this.update.next(result);
            return result;
        });
    };
    Table.prototype.deleteSingularById = function (id) {
        var _this = this;
        var columns = [];
        var pk = this.primaryKey();
        pk.value = id;
        columns.push(pk);
        return fse.readFile(this.tablesDirectory + "/" + this.tableName + "/delete_by_id_" + this.tableName + ".sql", 'utf8')
            .then(function (query) { return _this.db.prepareQueryFromColumnsAndExecute(query, columns); })
            .then(function (deleted) { return _this.processor.processRecordsets(deleted); })
            .then(function (processed) {
            var result = {
                operation: 'delete',
                deleted: processed[0]
            };
            return result;
        });
    };
    Table.prototype.deleteMultipleByIds = function (ids) {
        var _this = this;
        if (ids) {
            if (!Array.isArray(ids)) {
                var array = [];
                array.push(ids);
                ids = array;
            }
            var promises = ids.map(function (id) { return _this.deleteSingularById(id); });
            return Promise.all(promises)
                .then(function (success) {
                //success = array of delete ops
                var deleted = success.filter(function (match) { return match.operation == 'delete'; })
                    .map(function (op) { return op.deleted; });
                var result;
                if (deleted.length > 0) {
                    result = {
                        operation: 'delete',
                        deleted: deleted
                    };
                }
                return result;
            });
        }
        else
            throw 'No items specified to delete.';
    };
    Table.prototype.merge = function (items, agent) {
        var _this = this;
        if (items) {
            var toSave = items.toSave;
            var toDelete = items.toDelete;
            if ((toSave && Array.isArray(toSave)) || (toDelete && Array.isArray(toDelete))) {
                var saved_1, deleted_1, result_1;
                saved_1 = this.saveMultiple(toSave);
                deleted_1 = this.deleteMultipleByIds(toDelete);
                return Promise.all([saved_1, deleted_1])
                    .then(function (success) {
                    saved_1 = success[0];
                    deleted_1 = success[1];
                    if (saved_1 && deleted_1) {
                        result_1 = {
                            operation: (saved_1.operation + " " + deleted_1.operation).trim(),
                            created: saved_1.created,
                            updated: saved_1.updated,
                            deleted: deleted_1.deleted
                        };
                    }
                    else if (saved_1)
                        result_1 = saved_1;
                    else if (deleted_1)
                        result_1 = deleted_1;
                    if (result_1) {
                        result_1.table = _this.tableName;
                        if (agent)
                            result_1.agent = agent;
                        _this.update.next(result_1);
                    }
                    return result_1;
                });
            }
            else
                throw 'Incorrect format.';
        }
        else
            throw 'No items to modify.';
    };
    Table.deepCopy = function (obj) {
        var copy;
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj)
            return obj;
        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = this.deepCopy(obj[i]);
            }
            return copy;
        }
        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr))
                    copy[attr] = this.deepCopy(obj[attr]);
            }
            return copy;
        }
        throw new Error("Unable to copy obj! Its type isn't supported.");
    };
    return Table;
}());
exports.Table = Table;
//# sourceMappingURL=table.js.map