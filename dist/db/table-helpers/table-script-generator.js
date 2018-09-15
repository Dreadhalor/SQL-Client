"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TableScriptGenerator;
(function (TableScriptGenerator) {
    var fse = require('fs-extra');
    var replace = require('replace-in-file');
    var path = require('path');
    var templateStrings = {
        databaseName: /<database_name>/g,
        tableName: /<table_name>/g,
        tableInitFields: /<table_init_fields>/g,
        tableSetFields: /<table_set_fields>/g,
        tableInsertFields: /<table_insert_fields>/g,
        tableInsertValues: /<table_insert_values>/g,
        primaryKey: /<primary_key>/g,
        triggerName: /<trigger_name>/g
    };
    exports.generateScripts = function (data) {
        var templateValues = generateTemplateValues(data);
        var destDirectory = data.tablesDirectory + "/" + data.tableName;
        var templateFiles = Object.values(data.templateFiles);
        var destPaths = templateFiles.map(function (template) {
            var trimIndex = template.lastIndexOf('.template');
            var trimmed = template.substring(0, trimIndex);
            return destDirectory + "/" + trimmed + "_" + data.tableName + ".sql";
        });
        var substitutionOptions = {
            files: destPaths,
            from: Object.values(templateStrings),
            to: Object.values(templateValues)
        };
        return fse.ensureDir(destDirectory)
            .then(function () { return fse.emptyDir(destDirectory); })
            .then(function (emptied) {
            var copyPromises = templateFiles.map(function (template, index) {
                return fse.copy(data.templateDirectory + "/" + template, destPaths[index]);
            });
            return Promise.all(copyPromises);
        })
            .then(function (copied) { return replace(substitutionOptions); })
            .then(function (replaced) {
            var keys = Object.keys(data.templateFiles);
            var result = {};
            for (var i = 0; i < keys.length; i++)
                result[keys[i]] = replaced[i];
            return result;
        });
    };
    var generateTemplateValues = function (data) {
        var templateValues = {
            databaseName: data.database.databaseName,
            tableName: data.tableName
        };
        var tableInitFields = '';
        data.columns.forEach(function (column, index) {
            tableInitFields += "[" + column.name + "] " + data.database.parseDataType(column.dataType, true);
            if (index < data.columns.length - 1)
                tableInitFields += ",\n\t\t";
        });
        templateValues.tableInitFields = tableInitFields;
        var tableSetFields = '', tableInsertFields = '', tableInsertValues = '';
        data.columns.forEach(function (column, index) {
            var primary = data.columns[index].primary;
            if (!primary)
                tableSetFields += "[" + column.name + "] = @" + column.name;
            tableInsertFields += "[" + column.name + "]";
            tableInsertValues += "@" + column.name;
            if (index < data.columns.length - 1) {
                if (!primary)
                    tableSetFields += ",\n\t";
                tableInsertFields += ",\n\t\t";
                tableInsertValues += ",\n\t\t";
            }
        });
        templateValues.tableSetFields = tableSetFields;
        templateValues.tableInsertFields = tableInsertFields;
        templateValues.tableInsertValues = tableInsertValues;
        templateValues.primaryKey = data.columns.find(function (match) { return match.primary; }).name;
        templateValues.triggerName = "update_trigger_" + data.tableName;
        return templateValues;
    };
})(TableScriptGenerator = exports.TableScriptGenerator || (exports.TableScriptGenerator = {}));
//# sourceMappingURL=table-script-generator.js.map