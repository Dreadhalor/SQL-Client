export module Database {
  const sql = require('mssql/msnodesqlv8');
  const fse = require('fs-extra');
  const replace = require('replace-in-file');
  const promisify = require('util').promisify;
  const datatypeParser = require('./db-helpers/datatype-parser');
  const path = require('path');

  let databaseName = exports.databaseName;
  let connected = false;
  let callbacks = [];
  let config;

  const srcDirectory = path.resolve(__dirname,'scripts/templates/database');
  const destDirectory = path.resolve(__dirname,'scripts/generated/database');

  module.exports.connect = (configuration) => {

    config = configuration;

    setDatabaseName(config.database);
    let destFile = `create_database_${databaseName}.sql`;
    let destPath = `${destDirectory}/${destFile}`;
    let srcPath = `${srcDirectory}/create_database.template.sql`;
    const substitutionOptions = {
      files: destPath,
      from: /<database_name>/g,
      to: databaseName
    };
    config.database = 'master';
    return sql.connect(config)
      .then(connected => fse.ensureDir(destDirectory))
      .then(directory => fse.emptyDir(destDirectory))
      .then(emptied => fse.copy(srcPath, destPath))
      .then(copied => replace(substitutionOptions))
      .then(replaced => fse.readFile(destPath,'utf8'))
      .then(query => executeQueryAsPreparedStatementOnMaster(query))
      .then(
        dbExists => {
          config.database = databaseName;
          return sql.close();
        }
      )
      .then(closed => sql.connect(config))
      .then(connected => hasConnected());

  }
  const setDatabaseName = (name) => {
    databaseName = name;
    exports.databaseName = databaseName;
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

  const parseDataType = exports.parseDataType = datatypeParser.parseDataType;










  



  const preparedStatementWithInputs3 = (info) => {
    let ps = new sql.PreparedStatement();
    info.columns.forEach(column => ps.input(column.name, parseDataType('string', false)))
    return ps;
  }
  const formatPreparedValues2 = (info: any): any => {
    let result = {};
    info.columns.forEach(column => result[column.name] = column.value);
    return result;
  }

  


  /////

  const prepareQueryFromColumnsAndExecute = exports.prepareQueryFromColumnsAndExecute = (query, columns) => {
    let ps = prepareStatementFromColumns(columns);
    let values = formatPreparedValuesFromColumns(columns);
    return executePreparedStatement(ps, query, values);
  }
  const formatPreparedValuesFromColumns = (columns) => {
    let result = {};
    columns.forEach(column => result[column.name] = column.value);
    return result;
  }
  const prepareStatementFromColumns = exports.prepareStatementFromColumns = (columns) => {
    let ps = new sql.PreparedStatement();
    columns.forEach(column => {
      ps.input(column.name, parseDataType('string', false));
    })
    return ps;
  }
  const executeQueryAsPreparedStatement = exports.executeQueryAsPreparedStatement = (query: string) => {
    return executePreparedStatement(new sql.PreparedStatement(),query,{});
  }
  const executeQueryAsPreparedStatementOnMaster = (query: string) => {
    return executePreparedStatement(new sql.PreparedStatement(),query,{});
  }
  const executePreparedStatement = (ps: any, str: string, vals: any) => {
    let result;
    return ps.prepare(str)
    .catch(error => console.log(error))
      .then(prepared => ps.execute(vals))
      .then(executed => {
        result = executed;
        return ps.unprepare();
      })
      .then(unprepared => result);
  }
  const prepareQueryAndExecute = exports.prepareQueryAndExecute = (query, info) => {
    let ps = preparedStatementWithInputs3(info);
    let values = formatPreparedValues2(info);
    return executePreparedStatement(ps, query, values);
  }
}