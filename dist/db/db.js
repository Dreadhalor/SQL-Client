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
    var databaseName = exports.databaseName;
    var connected = false;
    var callbacks = [];
    var config;
    var srcDirectory = path.resolve(__dirname, 'scripts/templates/database');
    var destDirectory = path.resolve(__dirname, 'scripts/generated/database');
    module.exports.connect = function (configuration) {
        config = configuration;
        setDatabaseName(config.database);
        var destFile = "create_database_" + databaseName + ".sql";
        var destPath = destDirectory + "/" + destFile;
        var srcPath = srcDirectory + "/create_database.template.sql";
        var substitutionOptions = {
            files: destPath,
            from: /<database_name>/g,
            to: databaseName
        };
        config.database = 'master';
        return sql.connect(config)
            .then(function (connected) { return fse.ensureDir(destDirectory); })
            .then(function (directory) { return fse.emptyDir(destDirectory); })
            .then(function (emptied) { return fse.copy(srcPath, destPath); })
            .then(function (copied) { return replace(substitutionOptions); })
            .then(function (replaced) { return fse.readFile(destPath, 'utf8'); })
            .then(function (query) { return executeQueryAsPreparedStatementOnMaster(query); })
            .then(function (dbExists) {
            config.database = databaseName;
            return sql.close();
        })
            .then(function (closed) { return sql.connect(config); })
            .then(function (connected) { return hasConnected(); });
    };
    var setDatabaseName = function (name) {
        databaseName = name;
        exports.databaseName = databaseName;
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
    var parseDataType = exports.parseDataType = datatypeParser.parseDataType;
    var preparedStatementWithInputs3 = function (info) {
        var ps = new sql.PreparedStatement();
        info.columns.forEach(function (column) { return ps.input(column.name, parseDataType('string', false)); });
        return ps;
    };
    var formatPreparedValues2 = function (info) {
        var result = {};
        info.columns.forEach(function (column) { return result[column.name] = column.value; });
        return result;
    };
    /////
    var prepareQueryFromColumnsAndExecute = exports.prepareQueryFromColumnsAndExecute = function (query, columns) {
        var ps = prepareStatementFromColumns(columns);
        var values = formatPreparedValuesFromColumns(columns);
        return executePreparedStatement(ps, query, values);
    };
    var formatPreparedValuesFromColumns = function (columns) {
        var result = {};
        columns.forEach(function (column) { return result[column.name] = column.value; });
        return result;
    };
    var prepareStatementFromColumns = exports.prepareStatementFromColumns = function (columns) {
        var ps = new sql.PreparedStatement();
        columns.forEach(function (column) {
            ps.input(column.name, parseDataType('string', false));
        });
        return ps;
    };
    var executeQueryAsPreparedStatement = exports.executeQueryAsPreparedStatement = function (query) {
        return executePreparedStatement(new sql.PreparedStatement(), query, {});
    };
    var executeQueryAsPreparedStatementOnMaster = function (query) {
        return executePreparedStatement(new sql.PreparedStatement(), query, {});
    };
    var executePreparedStatement = function (ps, str, vals) {
        var result;
        return ps.prepare(str)
            .catch(function (error) { return console.log(error); })
            .then(function (prepared) { return ps.execute(vals); })
            .then(function (executed) {
            result = executed;
            return ps.unprepare();
        })
            .then(function (unprepared) { return result; });
    };
    var prepareQueryAndExecute = exports.prepareQueryAndExecute = function (query, info) {
        var ps = preparedStatementWithInputs3(info);
        var values = formatPreparedValues2(info);
        return executePreparedStatement(ps, query, values);
    };
})(Database = exports.Database || (exports.Database = {}));
//# sourceMappingURL=db.js.map