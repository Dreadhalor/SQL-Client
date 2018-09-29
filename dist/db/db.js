"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Database;
(function (Database) {
    var sql = require('mssql/msnodesqlv8');
    var fse = require('fs-extra');
    var replace = require('replace-in-file');
    var promisify = require('util').promisify;
    var datatypeParser = require('./db-helpers/datatype-parser');
    var path = require('path');
    var sqlClient = require('./sql');
    var util = require('util');
    var name = exports.name;
    var connected = false;
    var callbacks = [];
    var config;
    var srcDirectory = path.resolve(__dirname, 'scripts/templates/database');
    var destDirectory = path.resolve(__dirname, 'scripts/generated/database');
    module.exports.connect = function (configuration) {
        config = configuration;
        setDatabaseName(config.database);
        var destFile = "create_database_" + name + ".sql";
        var destPath = destDirectory + "/" + destFile;
        var srcPath = srcDirectory + "/create_database.template.sql";
        var substitutionOptions = {
            files: destPath,
            from: /<database_name>/g,
            to: name
        };
        config.database = 'master';
        return sql.connect(config)
            .then(function (connected) { return fse.ensureDir(destDirectory); })
            .then(function (directory) { return fse.emptyDir(destDirectory); })
            .then(function (emptied) { return fse.copy(srcPath, destPath); })
            .then(function (copied) { return replace(substitutionOptions); })
            .then(function (replaced) { return fse.readFile(destPath, 'utf8'); })
            .then(function (query) { return sqlClient.prepareStatementAndExecute(query); })
            .then(function (dbExists) {
            config.database = name;
            return sql.close();
        })
            .then(function (closed) { return sql.connect(config); })
            .then(function (connected) { return hasConnected(); });
    };
    var setDatabaseName = function (dbName) {
        name = dbName;
        exports.name = name;
    };
    var onConnected = exports.onConnected = function (fxn) {
        if (fxn) {
            if (connected)
                fxn(connected);
            else
                callbacks.unshift(fxn);
        }
    };
    var hasConnected = function () {
        connected = true;
        var len = callbacks.length - 1;
        for (var i = len; i >= 0; i--) {
            callbacks[i](connected);
            callbacks.splice(i, 1);
        }
    };
    var all = exports.all = function (promiseFxns) {
        if (promiseFxns.length > 0) {
            return Promise.all(promiseFxns)
                .then(function (results) {
                for (var i = results.length; i >= 0; i--)
                    if (!results[i])
                        results.splice(i, 1);
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
                return tables;
            });
        }
        return null;
    };
})(Database = exports.Database || (exports.Database = {}));
//# sourceMappingURL=db.js.map