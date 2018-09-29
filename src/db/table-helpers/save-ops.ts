export module SaveOps {
  const sqlClient = require('../sql-client');
  const fse = require('fs-extra');
  const processor = require('./processor');
  const paths = require('./paths');
  const util = require('util');

  const save = exports.save = (items, schema, options?) => {
    return saveMultiple(items, schema, options);
  }
  const saveMultiple = (items, schema, options?: any) => {
    if (!items) throw 'Item is null';
    if (!Array.isArray(items)){
      let array = [];
      array.push(items);
      items = array;
    }
    let promises = items.map(item => saveSingular(item, schema));
    return Promise.all(promises)
      .then((results: any[]) => {
        let created = results.filter(entry => entry.operation == 'create').map(entry => {
          return {
            objectId: entry.objectId,
            fields: entry.created
          }
        });
        let updated = results.filter(entry => entry.operation == 'update').map(entry => {
          return {
            objectId: entry.objectId,
            fields: entry.updated
          }
        });
        let result: any = {};
        if (created.length > 0) result.created = created;
        if (updated.length > 0) result.updated = updated;
        if (Object.keys(result).length == 0) result = null;
        if (result) result = {
          table: schema.name,
          info: result
        }
        return result;
      });
  }
  const saveSingular = (item, schema) => {
    let itemKeys = Object.keys(item);
    if (equals(itemKeys, schema.columns)){
      let formattedItem = processor.formatObject(item, schema.columns)
      let cols = formatRow(formattedItem, schema.columns);
      return fse.readFile(paths.getQuery(schema.name,'save'),'utf8')
        .then(file => sqlClient.prepareStatementAndExecute(file, cols))
        .then(results => {
          results = processor.processRecordsets(results, schema.columns);
          if (results.length > 0){
            let entry: any = {
              objectId: results[0][schema.primary]
            }
            if (results.length == 1){
              entry.operation = 'create';
              entry.created = results[0];
            }
            else {
              let changes: any = {};
              let item1 = results[0];
              let item2 = results[1];
              let keys = Object.keys(item1);
              keys.forEach(key => {
                if (util.inspect(item1[key], false, null) != util.inspect(item2[key], false, null))
                  changes[key] = item2[key];
              })
              entry.operation = 'update';
              entry.updated = changes;
            }
            return entry;
          }
          return null;
        })
    } throw 'Item properties are incorrect.';
  }

  const equals = (array1: string[], array2: string[]) => {
    let a1 = array1.length, a2 = array2.length;
    if (a1 != a2) return false;
    for (let i = 0; i < a1; i++){
      if (array1[i] != array2[i]) return false;
    }
    return true;
  }
  const formatRow = (obj: any, columns: string[]) => {
    let result = columns.map(columnName => {
      return {
        name: columnName,
        value: obj[columnName]
      }
    });
    return result;
  }

}
