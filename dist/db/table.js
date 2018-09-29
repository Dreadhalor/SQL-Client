"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var PromisePlus = require('@dreadhalor/bluebird-plus');
var scriptGenerator = require('./table-helpers/script-generator');
var processor = require('./table-helpers/processor');
var saveOps = require('./table-helpers/save-ops');
var deleteOps = require('./table-helpers/delete-ops');
var readOps = require('./table-helpers/read-ops');
var constructor = require('./table-helpers/constructor');
var path = require('path');
var util = require('util');
var tablesDirectory = path.resolve(__dirname, './scripts/generated/tables');
var SQLTable = /** @class */ (function () {
    function SQLTable(db, schema) {
        this.update = new rxjs_1.Subject();
        this.db = db;
        this.schema = schema;
        this.constructTable();
    }
    SQLTable.prototype.constructTable = function () {
        var _this = this;
        scriptGenerator.generateScripts(this.db, this.schema)
            .then(function (scriptsGenerated) { return _this.db.onConnected(function () { return constructor.constructTable(_this.schema.name); }); })
            .catch(function (exception) { return console.log(exception); });
    };
    SQLTable.prototype.primaryKey = function (value) {
        if (value)
            return {
                name: this.schema.primary,
                value: value
            };
        return this.schema.primary;
    };
    SQLTable.prototype.formatRow = function (obj) {
        var columns = this.schema.columns.map(function (columnName) {
            return {
                name: columnName,
                value: obj[columnName]
            };
        });
        return columns;
    };
    SQLTable.prototype.all = function (promiseFxns) {
        return Promise.all(promiseFxns)
            .then(function (results) {
            var created = [], updated = [], deleted = [];
            var table;
            results.forEach(function (entry) {
                table = entry.table;
                if (entry.info.created)
                    created = created.concat(entry.info.created);
                if (entry.info.updated)
                    updated = updated.concat(entry.info.updated);
                if (entry.info.deleted)
                    deleted = deleted.concat(entry.info.deleted);
            });
            var categorized = {
                table: table,
                info: {
                    created: created,
                    updated: updated,
                    deleted: deleted
                }
            };
            return categorized;
        });
    };
    SQLTable.prototype.save = function (items, options) {
        var _this = this;
        if (items) {
            var standalone_1 = options.standalone;
            return saveOps.save(items, this.schema, options)
                .then(function (saved) {
                if (standalone_1) {
                    _this.update.next(saved);
                }
                return saved;
            });
        }
        return null;
    };
    SQLTable.prototype.delete = function (id, options) {
        var _this = this;
        if (id) {
            var standalone_2 = options.standalone;
            return deleteOps.deleteByField(id, this.schema.primary, this.schema)
                .then(function (deleted) {
                if (standalone_2) {
                    _this.update.next(deleted);
                }
                return deleted;
            });
        }
        return null;
    };
    SQLTable.prototype.findById = function (id) {
        var _this = this;
        return readOps.pullByField(JSON.stringify(id), this.schema.primary, this.schema.name)
            .then(function (found) { return processor.processRecordsets(found, _this.schema.columns)[0]; });
    };
    SQLTable.prototype.pullAll = function () {
        var _this = this;
        return readOps.pullAll(this.schema.name)
            .then(function (pulled) { return processor.processRecordsets(pulled, _this.schema.columns); });
    };
    SQLTable.prototype.merge = function (items, agent) {
        var toSave = items.toSave;
        var toDelete = items.toDelete;
        if ((toSave && Array.isArray(toSave)) || (toDelete && Array.isArray(toDelete))) {
            var saved = void 0, deleted = void 0;
            saved = this.save(toSave);
            deleted = this.delete(toDelete);
            return Promise.all([saved, deleted]);
        }
    };
    return SQLTable;
}());
exports.SQLTable = SQLTable;
//# sourceMappingURL=table.js.map