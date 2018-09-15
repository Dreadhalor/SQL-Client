import { SQLTable } from "../table";

export class TableProcessor {

  constructor(
    private table: SQLTable
  ){}

  public processRecordsets(result){
    if (result &&
        result.recordset &&
        result.recordset.length > 0)
        return this.parseObjects(result.recordset);
    return [];
  }
  public formatObject(obj: object): any {
    let result = {};
    this.table.schema.columns.forEach(name => result[name] = JSON.stringify(obj[name]));
    return result;
  }
  public parseObjects(objs: object[]){
    let result = [];
    objs.forEach(obj => {
      let parsedObj = {};
      let keys = Object.keys(obj)
      keys.forEach(key => {
        let found = this.table.schema.columns.find(match => match == key);
        if (found) parsedObj[key] = JSON.parse(obj[key]);
      })
      result.push(parsedObj);
    })
    return result; 
  }
  
}