export module Database {
  const sql = require('mssql/msnodesqlv8');
  const fse = require('fs-extra');
  const replace = require('replace-in-file');
  const promisify = require('util').promisify;
  const datatypeParser = require('./db-helpers/datatype-parser');
  const path = require('path');
  const sqlClient = require('./sql');
  const util = require('util');

  let name = exports.name;
  let connected = false;
  let callbacks = [];
  let config;

  const srcDirectory = path.resolve(__dirname,'scripts/templates/database');
  const destDirectory = path.resolve(__dirname,'scripts/generated/database');

  module.exports.connect = (configuration) => {

    config = configuration;

    setDatabaseName(config.database);
    let destFile = `create_database_${name}.sql`;
    let destPath = `${destDirectory}/${destFile}`;
    let srcPath = `${srcDirectory}/create_database.template.sql`;
    const substitutionOptions = {
      files: destPath,
      from: /<database_name>/g,
      to: name
    };
    config.database = 'master';
    return sql.connect(config)
      .then(connected => fse.ensureDir(destDirectory))
      .then(directory => fse.emptyDir(destDirectory))
      .then(emptied => fse.copy(srcPath, destPath))
      .then(copied => replace(substitutionOptions))
      .then(replaced => fse.readFile(destPath,'utf8'))
      .then(query => sqlClient.prepareStatementAndExecute(query))
      .then(
        dbExists => {
          config.database = name;
          return sql.close();
        }
      )
      .then(closed => sql.connect(config))
      .then(connected => hasConnected());

  }
  const setDatabaseName = (dbName) => {
    name = dbName;
    exports.name = name;
  }
  const onConnected = exports.onConnected = (fxn) => {
    if (fxn){
      if (connected) fxn(connected);
      else callbacks.unshift(fxn);
    }
  }
  const hasConnected = () => {
    connected = true;
    let len = callbacks.length - 1;
    for (let i = len; i >= 0; i--){
      callbacks[i](connected);
      callbacks.splice(i,1);
    }
  }

  const all = exports.all = (promiseFxns: any[]) => {
    if (promiseFxns.length > 0){
      return Promise.all(promiseFxns)
      .then(results => {
        for (let i = results.length; i >= 0; i--) if (!results[i]) results.splice(i,1);
        let tables = [];
        results.forEach(entry => {
          let index = tables.findIndex(match => match.table == entry.table);
          let table = (index >= 0) ? tables[index] : {
            table: entry.table,
            info: {}
          };
          let created = table.info.created, updated = table.info.updated, deleted = table.info.deleted;
          if (entry.info.created){
            if (!created) created = [];
            created = created.concat(entry.info.created)
          };
          if (entry.info.updated){
            if (!updated) updated = [];
            updated = updated.concat(entry.info.updated)
          };
          if (entry.info.deleted){
            if (!deleted) deleted = [];
            deleted = deleted.concat(entry.info.deleted)
          };
          table.info = {};
          if (created) table.info.created = created;
          if (updated) table.info.updated = updated;
          if (deleted) table.info.deleted = deleted;
          if (index >= 0) tables[index] = table;
          else tables.push(table);
        })
        return tables;
      });
    } return null;
  }
}