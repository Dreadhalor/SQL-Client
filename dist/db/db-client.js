"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var table_1 = require("./table");
var rxjs_1 = require("rxjs");
var db = require('./db');
exports.connect = function (config) { return db.connect(config); };
var subscriptions = [];
var history = new rxjs_1.Subject();
exports.history = history.asObservable();
var Table = exports.Table = function (schema) {
    var table = new table_1.SQLTable(db, schema);
    subscriptions.push(table.update.asObservable().subscribe(function (next) { return history.next(next); }));
    return table;
};
var Tables = exports.Tables = function (schemas) {
    var keys = Object.keys(schemas);
    keys.forEach(function (key) { return schemas[key] = Table(schemas[key]); });
    return schemas;
};
//# sourceMappingURL=db-client.js.map