import { Subject } from 'rxjs';
import * as fse from 'fs-extra';
const PromisePlus = require('@dreadhalor/bluebird-plus');

const scriptGenerator = require('./table-helpers/script-generator');
const processor = require('./table-helpers/processor');
const saveOps = require('./table-helpers/save-ops');
const deleteOps = require('./table-helpers/delete-ops');
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
    let columns = [];
    let pk = this.primaryKey(JSON.stringify(id));
    columns.push(pk);
    return fse.readFile(`${tablesDirectory}/${this.schema.name}/pull_by_id_${this.schema.name}.sql`,'utf8')
      .then(query => sqlClient.prepareStatementAndExecute(query,columns))
      .then(found => {
       return  processor.processRecordsets(found, this.schema.columns)[0]
      });
  }
  pullAll(){
    return fse.readFile(`${tablesDirectory}/${this.schema.name}/pull_all_${this.schema.name}.sql`,'utf8')
      .then(query => sqlClient.prepareStatementAndExecute(query))
      .then(pulled => processor.processRecordsets(pulled, this.schema.columns));
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