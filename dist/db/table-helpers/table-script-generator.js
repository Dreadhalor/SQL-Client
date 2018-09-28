"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TableScriptGenerator;
(function (TableScriptGenerator) {
    var fse = require('fs-extra');
    var replace = require('replace-in-file');
    var path = require('path');
    var dataType = 'varchar(max)';
    var templateDirectory = path.resolve(__dirname, '../scripts/templates/tables');
    var tablesDirectory = path.resolve(__dirname, '../scripts/generated/tables');
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
    var generateScripts = exports.generateScripts = function (database, schema) {
        var templateValues = generateTemplateValues(database, schema);
        var destDirectory = tablesDirectory + "/" + schema.name;
        var templateFilenames, destPaths, substitutionOptions;
        return fse.readdir(templateDirectory)
            .then(function (files) {
            templateFilenames = files;
            destPaths = templateFilenames.map(function (name) {
                var trimIndex = name.lastIndexOf('.template');
                var trimmed = name.substring(0, trimIndex);
                return destDirectory + "/" + trimmed + "_" + schema.name + ".sql";
            });
            substitutionOptions = {
                files: destPaths,
                from: Object.values(templateStrings),
                to: Object.values(templateValues)
            };
            return fse.ensureDir(destDirectory);
        })
            .then(function () { return fse.emptyDir(destDirectory); })
            .then(function (emptied) {
            var copyPromises = templateFilenames.map(function (template, index) {
                return fse.copy(templateDirectory + "/" + template, destPaths[index]);
            });
            return Promise.all(copyPromises);
        })
            .then(function (copied) { return replace(substitutionOptions); });
        /*.then(replaced => {
          let keys = templateFilenames;
          let result: any = {};
          for (let i = 0; i < keys.length; i++) result[keys[i]] = replaced[i];
          return result;
        });*/
    };
    var generateTemplateValues = function (database, schema) {
        var templateValues = {
            databaseName: database.name,
            tableName: schema.name
        };
        var tableInitFields = '';
        schema.columns.forEach(function (name, index) {
            tableInitFields += "[" + name + "] " + dataType;
            if (index < schema.columns.length - 1)
                tableInitFields += ",\n\t\t";
        });
        templateValues.tableInitFields = tableInitFields;
        var tableSetFields = '', tableInsertFields = '', tableInsertValues = '';
        schema.columns.forEach(function (name, index) {
            var primary = name == schema.primary;
            if (!primary)
                tableSetFields += "[" + name + "] = @" + name;
            tableInsertFields += "[" + name + "]";
            tableInsertValues += "@" + name;
            if (index < schema.columns.length - 1) {
                if (!primary)
                    tableSetFields += ",\n\t";
                tableInsertFields += ",\n\t\t";
                tableInsertValues += ",\n\t\t";
            }
        });
        templateValues.tableSetFields = tableSetFields;
        templateValues.tableInsertFields = tableInsertFields;
        templateValues.tableInsertValues = tableInsertValues;
        templateValues.primaryKey = schema.primary;
        templateValues.triggerName = "update_trigger_" + schema.name;
        return templateValues;
    };
})(TableScriptGenerator = exports.TableScriptGenerator || (exports.TableScriptGenerator = {}));
//# sourceMappingURL=table-script-generator.js.map