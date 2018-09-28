export module TableProcessor {

  const processRecordsets = exports.processRecordsets = (result, columns: string[]) => {
    if (result &&
        result.recordset &&
        result.recordset.length > 0)
        return parseObjects(result.recordset, columns);
    return [];
  }
  const formatObject = exports.formatObject = (obj: object, columns: string[]): any => {
    let result = {};
    columns.forEach(name => result[name] = JSON.stringify(obj[name]));
    return result;
  }
  const parseObjects = (objs: object[], columns: string[]) => {
    let result = [];
    objs.forEach(obj => {
      let parsedObj = {};
      let keys = Object.keys(obj)
      keys.forEach(key => {
        let found = columns.find(match => match == key);
        if (found) parsedObj[key] = JSON.parse(obj[key]);
      })
      result.push(parsedObj);
    })
    return result; 
  }
  
}