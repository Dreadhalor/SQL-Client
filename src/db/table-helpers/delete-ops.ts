export module DeleteOps {
  const sqlClient = require('../sql-client');
  const fse = require('fs-extra');
  const processor = require('./processor');

  const deleteByField = exports.deleteByField = (values, field: string, path: string) => {
    return deleteMultipleByField(values, field, path);
  }
  const deleteSingularByField = (value: string, field: string, path: string) => {
    let cols = [];
    let pk = {
      name: field,
      value: value
    }
    cols.push(pk);
    return fse.readFile(path,'utf8')
      .then(query => sqlClient.prepareStatementAndExecute(query,cols));
  }
  const deleteMultipleByField = (values: string[], field: string, path: string) => {
    if (!values) values = [];
    if (!Array.isArray(values)){
      let array = [];
      array.push(values);
      values = array;
    }
    let promises = values.map(value => deleteSingularByField(value, field, path));
    return Promise.all(promises);
  }

}
