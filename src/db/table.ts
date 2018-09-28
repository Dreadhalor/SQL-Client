import { Subject } from 'rxjs';
import * as fse from 'fs-extra';
const PromisePlus = require('@dreadhalor/bluebird-plus');

const scriptGenerator = require('./table-helpers/script-generator');
const processor = require('./table-helpers/processor');
const saveOps = require('./table-helpers/save-ops');
const deleteOps = require('./table-helpers/delete-ops');
const readOps = require('./table-helpers/read-ops');
const constructor = require('./table-helpers/constructor');

const sqlClient = require('./sql-client');
const path = require('path');

const tablesDirectory = path.resolve(__dirname,'./scripts/generated/tables');

export class SQLTable {

  schema: any;
  db: any;

  constructor(db: any, schema: any){
    this.db = db;
    this.schema = schema;
    this.constructTable();
  }
  
  constructTable(){
    scriptGenerator.generateScripts(this.db, this.schema)
      .then(scriptsGenerated => this.db.onConnected(() => constructor.constructTable(this.schema.name)))
      .catch(exception => console.log(exception));
  }

  primaryKey(value?){
    if (value) return {
      name: this.schema.primary,
      value: value
    }
    return this.schema.primary;
  }

  formatRow(obj: any){
    let columns = this.schema.columns.map(columnName => {
      return {
        name: columnName,
        value: obj[columnName]
      }
    });
    return columns;
  }
  
  public save(items, agent?){
    return saveOps.save(items, this.schema);
  }
  public delete(id){
    return deleteOps.deleteByField(id, this.schema.primary, `${tablesDirectory}/${this.schema.name}/delete_by_id_${this.schema.name}.sql`);
  }

  findById(id: string){
    return readOps.pullByField(id, this.schema.primary, this.schema.name)
      .then(found => processor.processRecordsets(found, this.schema.columns)[0]);
  }
  pullAll(){
    return readOps.pullAll(this.schema.name)
      .then(pulled => {
        console.log(pulled);
        return processor.processRecordsets(pulled, this.schema.columns)
      });
  }
  
  merge(items, agent?){
    let toSave = items.toSave;
    let toDelete = items.toDelete;
    if ((toSave && Array.isArray(toSave)) || (toDelete && Array.isArray(toDelete))){
      let saved, deleted, result;
      saved = this.save(toSave);
      deleted = this.delete(toDelete);
      return Promise.all([saved, deleted])
    }
  }

}