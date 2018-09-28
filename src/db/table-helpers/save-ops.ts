export module SaveOps {
  const sqlClient = require('../sql-client');
  const fse = require('fs-extra');
  const processor = require('./processor');
  const paths = require('./paths');

  const save = exports.save = (items, schema) => {
    return saveMultiple(items, schema);
  }
  const saveMultiple = (items, schema) => {
    if (!items) throw 'Item is null';
    if (!Array.isArray(items)){
      let array = [];
      array.push(items);
      items = array;
    }
    let promises = items.map(item => saveSingular(item, schema));
    return Promise.all(promises)
      .then((success: any[]) => {
        //success = array of ops
        let created: any[] = success.filter(match => match.operation == 'create')
          .map(op => op.created);
        let updated: any = success.filter(match => match.operation == 'update')
          .map(op => {
            return {
              created: op.created,
              deleted: op.deleted
            }
          });
        let result;
        if (created.length > 0 && updated.length > 0){
          result = {
            operation: 'create update',
            created: created,
            updated: updated
          }
        } else if (created.length > 0){
          result = {
            operation: 'create',
            created: created
          }
        } else if (updated.length > 0){
          result = {
            operation: 'update',
            updated: updated
          }
        }
        return result;
      });
  }
  const saveSingular = (item, schema) => {
    if (!item) throw 'Item is null';
    let itemKeys = Object.keys(item);
    if (equals(itemKeys, schema.columns)){
      let formattedItem = processor.formatObject(item, schema.columns)
      let cols = formatRow(formattedItem, schema.columns);
      return fse.readFile(paths.getQuery(schema.name,'save'),'utf8')
      .then(file => sqlClient.prepareStatementAndExecute(file, cols))
      .then(executed => processor.processRecordsets(executed, schema.columns))
      .then(processed => {
        let result;
        if (processed.length > 1)
          result = {
            operation: 'update',
            deleted: processed[0],
            created: processed[1]
          }
        else result = {
          operation: 'create',
          created: processed[0]
        };
        return result;
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
