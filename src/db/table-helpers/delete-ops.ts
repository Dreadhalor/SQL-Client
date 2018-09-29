export module DeleteOps {
  const sqlClient = require('../sql-client');
  const fse = require('fs-extra');
  const processor = require('./processor');
  const paths = require('./paths');

  const deleteByField = exports.deleteByField = (values, field: string, schema) => {
    return deleteMultipleByField(values, field, schema);
  }
  const deleteSingularByField = (value: string, field: string, schema) => {
    let cols = [];
    let pk = {
      name: field,
      value: JSON.stringify(value)
    }
    cols.push(pk);
    return fse.readFile(paths.getQuery(schema.name,'delete_by_id'),'utf8')
      .then(query => sqlClient.prepareStatementAndExecute(query,cols))
      .then(results => {
        results = processor.processRecordsets(results, schema.columns);
        if (results.length > 0){
          return {
            objectId: results[0][schema.primary],
            operation: 'delete',
            deleted: results[0]
          }
        }
        return null;
      });
  }
  const deleteMultipleByField = (values, field: string, schema) => {
    if (!values) values = [];
    if (!Array.isArray(values)){
      let array = [];
      array.push(values);
      values = array;
    }
    let promises = values.map(value => deleteSingularByField(value, field, schema));
    return Promise.all(promises)
      .then((results: any[]) => {
        let deleted = results.filter(entry => entry.operation == 'delete').map(entry => {
          return {
            objectId: entry.objectId,
            fields: entry.deleted
          }
        });
        let result: any = {};
        if (deleted.length > 0) result.deleted = deleted;
        if (Object.keys(result).length == 0) result = null;
        if (result) result = {
          table: schema.name,
          info: result
        }
        return result;
      })
  }

}
