"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var table_1 = require("./table");
var rxjs_1 = require("rxjs");
var uuid = require("uuid/v4");
var moment = require("moment");
var db = exports.db = require('./db');
var util = require('util');
exports.connect = function (config) { return db.connect(config); };
var subscriptions = [];
var history = new rxjs_1.Subject();
exports.history = history.asObservable();
var Table = exports.Table = function (schema) {
    var table = new table_1.SQLTable(db, schema);
    subscriptions.push(table.update.asObservable().subscribe(function (next) {
        next = formatStandaloneEdit(next, null);
        //history.next(next)
    }));
    return table;
};
var Tables = exports.Tables = function (schemas) {
    var keys = Object.keys(schemas);
    keys.forEach(function (key) { return schemas[key] = Table(schemas[key]); });
    return schemas;
};
var formatStandaloneEdit = function (edit, options) {
    var id = uuid();
    var timestamp = moment().format('dddd, MMMM Do YYYY, h:mm:ss a');
    if (edit) {
        var result = {
            transactionId: id,
            timestamp: timestamp,
            tables: edit
        };
        if (options.agent)
            result.agent = options.agent;
        return result;
    }
    return null;
};
var all = exports.all = function (promiseFxns, options) {
    if (promiseFxns.length > 0) {
        return Promise.all(promiseFxns)
            .then(function (results) {
            for (var i = results.length; i >= 0; i--) {
                if (!results[i])
                    results.splice(i, 1);
                else if (Array.isArray(results[i])) {
                    var entry = results[i];
                    results.splice(i, 1);
                    results = results.concat(entry);
                }
            }
            var tables = [];
            results.forEach(function (entry) {
                var index = tables.findIndex(function (match) { return match.table == entry.table; });
                var table = (index >= 0) ? tables[index] : {
                    table: entry.table,
                    info: {}
                };
                var created = table.info.created, updated = table.info.updated, deleted = table.info.deleted;
                if (entry.info.created) {
                    if (!created)
                        created = [];
                    created = created.concat(entry.info.created);
                }
                ;
                if (entry.info.updated) {
                    if (!updated)
                        updated = [];
                    updated = updated.concat(entry.info.updated);
                }
                ;
                if (entry.info.deleted) {
                    if (!deleted)
                        deleted = [];
                    deleted = deleted.concat(entry.info.deleted);
                }
                ;
                table.info = {};
                if (created)
                    table.info.created = created;
                if (updated)
                    table.info.updated = updated;
                if (deleted)
                    table.info.deleted = deleted;
                if (index >= 0)
                    tables[index] = table;
                else
                    tables.push(table);
            });
            if (options) {
                if (options.standalone)
                    history.next(formatStandaloneEdit(tables, options));
            }
            return tables;
        });
    }
    return null;
};
//# sourceMappingURL=db-client.js.map