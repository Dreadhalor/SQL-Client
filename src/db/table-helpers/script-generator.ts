export module TableScriptGenerator {
  const fse = require('fs-extra');
  const replace = require('replace-in-file');
  const paths = require('./paths');
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

  const generateScripts = exports.generateScripts = (database, schema) => {
    let templateValues = generateTemplateValues(database, schema);
    let destDirectory = `${paths.tablesDirectory}/${schema.name}`;
    let templateFilenames, destPaths, substitutionOptions;

    return fse.readdir(paths.templateDirectory)
      .then(files => {
        templateFilenames = files;

        destPaths = templateFilenames.map(filename => paths.getQuery(schema.name, filename));

        substitutionOptions = {
          files: destPaths,
          from: Object.values(templateStrings),
          to: Object.values(templateValues)
        };

        return fse.ensureDir(destDirectory);
      })
      .then(() => fse.emptyDir(destDirectory))
      .then(emptied => {
        let copyPromises = templateFilenames.map((template, index) =>
          fse.copy(
            paths.getTemplate(template),
            destPaths[index]
          ))
        return Promise.all(copyPromises)
      })
      .then(copied => replace(substitutionOptions));
  }

  const generateTemplateValues = (database, schema) => {
    let templateValues: any = {
      databaseName: database.name,
      tableName: schema.name
    };

    let tableInitFields = '';
    schema.columns.forEach((name, index) => {
      tableInitFields += `[${name}] ${dataType}`
      if (index < schema.columns.length - 1) tableInitFields += `,\n\t\t`;
    });
    templateValues.tableInitFields = tableInitFields;

    let tableSetFields = '', tableInsertFields = '', tableInsertValues = '';
    schema.columns.forEach((name, index) => {
      let primary = name == schema.primary;
      if (!primary) tableSetFields += `[${name}] = @${name}`;
      tableInsertFields += `[${name}]`;
      tableInsertValues += `@${name}`;
      if (index < schema.columns.length - 1){
        if (!primary) tableSetFields += `,\n\t`;
        tableInsertFields += `,\n\t\t`;
        tableInsertValues += `,\n\t\t`;
      }
    })
    templateValues.tableSetFields = tableSetFields;
    templateValues.tableInsertFields = tableInsertFields;
    templateValues.tableInsertValues = tableInsertValues;
    templateValues.primaryKey = schema.primary;

    templateValues.triggerName = `update_trigger_${schema.name}`;

    return templateValues;
  }

}