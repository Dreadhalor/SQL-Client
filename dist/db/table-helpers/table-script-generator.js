"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TableScriptGenerator;
(function (TableScriptGenerator) {
    var fse = require('fs-extra');
    var replace = require('replace-in-file');
    var path = require('path');
    var dataType = 'varchar(max)';
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
        var destDirectory = data.tablesDirectory + "/" + data.schema.name;
        var templateFiles = Object.values(data.templateFiles);
        var destPaths = templateFiles.map(function (template) {
            var trimIndex = template.lastIndexOf('.template');
            var trimmed = template.substring(0, trimIndex);
            return destDirectory + "/" + trimmed + "_" + data.schema.name + ".sql";
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
            tableName: data.schema.name
        };
        var tableInitFields = '';
        data.schema.columns.forEach(function (name, index) {
            tableInitFields += "[" + name + "] " + dataType;
            if (index < data.schema.columns.length - 1)
                tableInitFields += ",\n\t\t";
        });
        templateValues.tableInitFields = tableInitFields;
        var tableSetFields = '', tableInsertFields = '', tableInsertValues = '';
        data.schema.columns.forEach(function (name, index) {
            var primary = name == data.schema.primary;
            if (!primary)
                tableSetFields += "[" + name + "] = @" + name;
            tableInsertFields += "[" + name + "]";
            tableInsertValues += "@" + name;
            if (index < data.schema.columns.length - 1) {
                if (!primary)
                    tableSetFields += ",\n\t";
                tableInsertFields += ",\n\t\t";
                tableInsertValues += ",\n\t\t";
            }
        });
        templateValues.tableSetFields = tableSetFields;
        templateValues.tableInsertFields = tableInsertFields;
        templateValues.tableInsertValues = tableInsertValues;
        templateValues.primaryKey = data.schema.primary;
        templateValues.triggerName = "update_trigger_" + data.schema.name;
        return templateValues;
    };
})(TableScriptGenerator = exports.TableScriptGenerator || (exports.TableScriptGenerator = {}));
//# sourceMappingURL=table-script-generator.js.map