import { Table } from "../table";

export class TableProcessor {

  constructor(
    private table: Table
  ){}

  private shouldStringify(column){
    return true;//column.dataType.includes('[]') || column.dataType == 'object';
  }

  public processRecordsets(result){
    if (result &&
        result.recordset &&
        result.recordset.length > 0)
        return this.parseObjects(result.recordset);
    return [];
  }
  public formatObject(obj: object): any {
    let result = {};
    this.table.columns.forEach(column => {
      let val = obj[column.name];
      if (this.shouldStringify(column)){
        val = JSON.stringify(val);
      }
      result[column.name] = val;
    })
    return result;
  }
  public parseObjects(objs: object[]){
    let result = [];
    objs.forEach(obj => {
      let parsedObj = {};
      let keys = Object.keys(obj)
      keys.forEach(key => {
        let found = this.table.columns.find(match => match.name == key);
        if (found){
          if (this.shouldStringify(found)) parsedObj[key] = JSON.parse(obj[key]);
          else parsedObj[key] = obj[key];
        }
      })
      result.push(parsedObj);
    })
    return result; 
  }
  
}