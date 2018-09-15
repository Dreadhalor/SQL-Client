export module TableScriptGenerator {
  const fse = require('fs-extra');
  const replace = require('replace-in-file');
  const path = require('path');
  const dataType = 'varchar(max)';

  const templateStrings = {
    databaseName: /<database_name>/g,
    tableName: /<table_name>/g,
    tableInitFields: /<table_init_fields>/g,
    tableSetFields: /<table_set_fields>/g,
    tableInsertFields: /<table_insert_fields>/g,
    tableInsertValues: /<table_insert_values>/g,
    primaryKey: /<primary_key>/g,
    triggerName: /<trigger_name>/g
  }

  exports.generateScripts = (data) => {
    let templateValues = generateTemplateValues(data);
    let destDirectory = `${data.tablesDirectory}/${data.schema.name}`;
    let templateFiles = Object.values<string>(data.templateFiles);
    let destPaths = templateFiles.map(template => {
      let trimIndex = template.lastIndexOf('.template');
      let trimmed = template.substring(0,trimIndex);
      return `${destDirectory}/${trimmed}_${data.schema.name}.sql`;
    })
    let substitutionOptions = {
      files: destPaths,
      from: Object.values(templateStrings),
      to: Object.values(templateValues)
    };

    return fse.ensureDir(destDirectory)
      .then(() => fse.emptyDir(destDirectory))
      .then(emptied => {
        let copyPromises = templateFiles.map((template, index) =>
          fse.copy(
            `${data.templateDirectory}/${template}`,
            destPaths[index]
          ))
        return Promise.all(copyPromises)
      })
      .then(copied => replace(substitutionOptions))
      .then(replaced => {
        let keys = Object.keys(data.templateFiles);
        let result: any = {};
        for (let i = 0; i < keys.length; i++) result[keys[i]] = replaced[i];
        return result;
      });
  }

  const generateTemplateValues = (data) => {
    let templateValues: any = {
      databaseName: data.database.databaseName,
      tableName: data.schema.name
    };

    let tableInitFields = '';
    data.schema.columns.forEach((name, index) => {
      tableInitFields += `[${name}] ${dataType}`
      if (index < data.schema.columns.length - 1) tableInitFields += `,\n\t\t`;
    });
    templateValues.tableInitFields = tableInitFields;

    let tableSetFields = '', tableInsertFields = '', tableInsertValues = '';
    data.schema.columns.forEach((name, index) => {
      let primary = name == data.schema.primary;
      if (!primary) tableSetFields += `[${name}] = @${name}`;
      tableInsertFields += `[${name}]`;
      tableInsertValues += `@${name}`;
      if (index < data.schema.columns.length - 1){
        if (!primary) tableSetFields += `,\n\t`;
        tableInsertFields += `,\n\t\t`;
        tableInsertValues += `,\n\t\t`;
      }
    })
    templateValues.tableSetFields = tableSetFields;
    templateValues.tableInsertFields = tableInsertFields;
    templateValues.tableInsertValues = tableInsertValues;
    templateValues.primaryKey = data.schema.primary;

    templateValues.triggerName = `update_trigger_${data.schema.name}`;

    return templateValues;
  }

}