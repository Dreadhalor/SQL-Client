"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var table_1 = require("./table");
var rxjs_1 = require("rxjs");
var db = require('./db');
exports.connect = function (config) { return db.connect(config); };
var subscriptions = [];
var history = new rxjs_1.Subject();
exports.history = history.asObservable();
exports.Table = function (schema) {
    var table = new table_1.Table(db, schema);
    subscriptions.push(table.update.asObservable().subscribe(function (next) { return history.next(next); }));
    return table;
};
//# sourceMappingURL=db-client.js.map