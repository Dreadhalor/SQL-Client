export module ReadOps {

  const sqlClient = require('../sql-client');
  const fse = require('fs-extra');
  const paths = require('./paths');

  const pullByPrimary = (value, primary: string, table: string) => {

  }
  const pullByField = exports.pullByField = (value, field: string, table: string) => {
    let columns = [];
    columns.push({
      name: field,
      value: value
    });
    return fse.readFile(paths.getQuery('pull_by_field',table),'utf8')
      .then(query => {
        query = query.replace(/<field>/g, field);
        return sqlClient.prepareStatementAndExecute(query,columns)
      })
  }
  const pullAll = exports.pullAll = (table: string) => {
    return fse.readFile(paths.getQuery('pull_all',table),'utf8')
      .then(query => {
        console.log(query);
        sqlClient.prepareStatementAndExecute(query)
      });
  }

}