import { Subject } from 'rxjs';
import * as fse from 'fs-extra';
const PromisePlus = require('@dreadhalor/bluebird-plus');

const scriptGenerator = require('./table-helpers/script-generator');
const processor = require('./table-helpers/processor');
const saveOps = require('./table-helpers/save-ops');
const deleteOps = require('./table-helpers/delete-ops');
const readOps = require('./table-helpers/read-ops');
const constructor = require('./table-helpers/constructor');

const path = require('path');
const util = require('util');

const tablesDirectory = path.resolve(__dirname,'./scripts/generated/tables');

export class SQLTable {

  schema: any;
  db: any;

  update = new Subject<any>();

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

  all(promiseFxns: any[]){
    return Promise.all(promiseFxns)
      .then(results => {
        let created = [], updated = [], deleted = [];
        let table;
        results.forEach(entry => {
          table = entry.table;
          if (entry.info.created) created = created.concat(entry.info.created);
          if (entry.info.updated) updated = updated.concat(entry.info.updated);
          if (entry.info.deleted) deleted = deleted.concat(entry.info.deleted);
        })
        let categorized = {
          table: table,
          info: {
            created: created,
            updated: updated,
            deleted: deleted
          }
        };
        return categorized;
      });
  }
  
  save(items, options?: any){
    if (items){
      let standalone = options.standalone;
      return saveOps.save(items, this.schema, options)
        .then(saved => {
          if (standalone){
            this.update.next(saved);
          }
          return saved;
        })
    } return null;
  }
  delete(id, options?: any){
    if (id){
      let standalone = options.standalone;
      return deleteOps.deleteByField(id, this.schema.primary, this.schema)
        .then(deleted => {
          if (standalone){
            this.update.next(deleted);
          }
          return deleted;
        })
    } return null;
  }

  findById(id: string){
    return readOps.pullByField(JSON.stringify(id), this.schema.primary, this.schema.name)
      .then(found => processor.processRecordsets(found, this.schema.columns)[0]);
  }
  pullAll(){
    return readOps.pullAll(this.schema.name)
      .then(pulled => processor.processRecordsets(pulled, this.schema.columns));
  }
  
  merge(items, agent?){
    let toSave = items.toSave;
    let toDelete = items.toDelete;
    if ((toSave && Array.isArray(toSave)) || (toDelete && Array.isArray(toDelete))){
      let saved, deleted;
      saved = this.save(toSave);
      deleted = this.delete(toDelete);
      return Promise.all([saved, deleted])
    }
  }

}