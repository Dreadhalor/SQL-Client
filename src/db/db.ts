export module Database {
  const sql = require('mssql/msnodesqlv8');
  const fse = require('fs-extra');
  const replace = require('replace-in-file');
  const promisify = require('util').promisify;
  const datatypeParser = require('./db-helpers/datatype-parser');
  const path = require('path');
  const sqlClient = require('./sql-client');

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
}