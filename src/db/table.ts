import { Subject } from 'rxjs';
import * as fse from 'fs-extra';
const PromisePlus = require('@dreadhalor/bluebird-plus');

const scriptGenerator = require('./table-helpers/table-script-generator');
import { TableProcessor } from './table-helpers/table-processor';

const path = require("path");

export class Table {

  tableName: string;
  columns: any[] = [];
  db: any;
  processor = new TableProcessor(this);
  templateDirectory = path.resolve(__dirname,'scripts/templates/tables');
  tablesDirectory = path.resolve(__dirname,'scripts/generated/tables');

  public update = new Subject<any>();

  getTemplateFiles(){
    let names;
    let files = {};
    return fse.readdir(this.templateDirectory)
      .then(filenames => {
        names = filenames;
        return Promise.all(filenames.map(filename => fse.readFile(`${this.templateDirectory}/${filename}`,'utf8')))
      })
      .then(fileContents => {
        fileContents.forEach((content, index) => {
          let name = names[index].substring(0,names[index].lastIndexOf('.template'));
          files[name] = {
            file: names[index],
            runOrder: this.findRunOrder(content)
          }
        })
        return files;
      })
  }

  findRunOrder(singleFileContents){
    let runOrderKey = 'RUN-ORDER '
    try {
      let trimmed: any = singleFileContents.substring(singleFileContents.indexOf(runOrderKey));
      let carriageReturnIndex = trimmed.indexOf(`\r`);
      let newlineIndex =  trimmed.indexOf(`\n`);
      let cutIndex = carriageReturnIndex >= 0 ? carriageReturnIndex : newlineIndex;
      trimmed = trimmed.substring(runOrderKey.length,cutIndex);
      trimmed = Number.parseInt(trimmed);
      return trimmed;
    } catch {
      return -1;
    }
  }
  get templateFilesMapped(){
    return this.getTemplateFiles()
      .then(files => {
        let result: any = {};
        let keys = Object.keys(files);
        keys.forEach(key => result[key] = files[key].file);
        return result;
      })
  }
  get templateFilesInRunOrder(){
    let queue = [];
    return this.getTemplateFiles()
      .then((files: any) => {
        files = Object.entries(files);
        files = files.map(file => {
          return {
            name: file[0],
            runOrder: file[1].runOrder
          };
        })
        files.sort((a, b) => a.runOrder - b.runOrder);
        files = files.filter(a => a.runOrder >= 0);
        while (files.length > 0){
          let group = [], indexes = [], turn = files[0].runOrder;
          for (let i = 0; i < files.length; i++)
            if (files[i].runOrder == turn) indexes.push(i);
          for (let i = indexes.length - 1; i >= 0; i--)
            group = group.concat(files.splice(i,1).map(file => file.name));
          queue.push(group);
        }
        return queue;
      })
  }
  get destDirectory(){
    return `${this.tablesDirectory}/${this.tableName}`;
  }

  constructor(db: any, schema: any){
    this.db = db;
    this.tableName = schema.name;
    schema.columns.forEach(column => {
      this.columns.push({
        name: column.name,
        dataType: column.dataType,
        primary: !!column.primary
      });
    });
    this.columns = this.singularizePrimaryKey(this.columns);
    this.constructTable();
  }
  
  async constructTable(){
    let scripts;
    let scriptFiles;
    scriptGenerator.generateScripts({
      database: this.db,
      tableName: this.tableName,
      columns: this.columns,
      templateDirectory: this.templateDirectory,
      templateFiles: await this.templateFilesMapped,
      tablesDirectory: this.tablesDirectory,
    })
    .then(scriptFilesVariable => {
      scriptFiles = scriptFilesVariable;
      return this.templateFilesInRunOrder;
    })
    .then(filesInRunOrder => {
      scripts = filesInRunOrder.map(
        group => group.map(name => scriptFiles[name])
      );
      return new Promise((resolve) => {
        this.db.onConnected((result) => resolve(result))
      })
    })
    .then(databaseExists => PromisePlus.nestedPromiseAll(scripts, (file) => fse.readFile(file,'utf8')))
    .then(result => PromisePlus.sequentialPromiseAll(result, this.db.executeQueryAsPreparedStatement))
    .catch(exception => console.log(exception));
  }

  singularizePrimaryKey(columns: any[]){
    let primary = false;
    for (let i = 0; i < columns.length; i++){
      if (columns[i].primary){
        if (primary) columns[i].primary = false;
        primary = true;
      }
    }
    return columns;
  }
  primaryKey(){
    let pk = Table.deepCopy(this.columns.find(match => match.primary));
    return pk;
  }

  fields(){
    return this.columns.map(column => column.name);
  }
  oneHotPrimaryKeyArray(){
    return this.columns.map(column => column.primary);
  }
  formatRow(obj: any){
    let columns = this.columns.map(column => {
      //DEEP COPYING NECESSARY FOR CLOSELY-SPACED EDITS
      column = Table.deepCopy(column);
      column.value = obj[column.name];
      return column;
    });
    return columns;
  }
  tableInfo(){
    return {
      tableName: this.tableName,
      columns: this.columns.map(column => Table.deepCopy(column))
    };
  }

  equals(array1: string[], array2: string[]){
    let a1 = array1.length, a2 = array2.length;
    if (a1 != a2) return false;
    for (let i = 0; i < a1; i++){
      if (array1[i] != array2[i]) return false;
    }
    return true;
  }

  saveSingular(item){
    if (!item) throw 'Item is null';
    let itemKeys = Object.keys(item);
    if (this.equals(itemKeys, this.fields())){
      let formattedItem = this.processor.formatObject(item)
      let info = {
        tableName: this.tableName,
        columns: this.formatRow(formattedItem)
      };
      return fse.readFile(`${this.tablesDirectory}/${this.tableName}/save_${this.tableName}.sql`,'utf8')
      .then(file => this.db.prepareQueryAndExecute(file,info))
      .then(executed => this.processor.processRecordsets(executed))
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
  saveMultiple(items){
    if (!items) throw 'Item is null';
    if (!Array.isArray(items)){
      let array = [];
      array.push(items);
      items = array;
    }
    let promises = items.map(item => this.saveSingular(item));
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
  save(items, agent?){
    return this.saveMultiple(items)
      .then(result => {
        if (result){
          result.table = this.tableName;
          if (agent) result.agent = agent;
          this.update.next(result);
        }
        return result;
      })
  }
  findById(id: string){
    let columns = [];
    let pk = this.primaryKey();
    pk.value = id;
    columns.push(pk);
    return fse.readFile(`${this.tablesDirectory}/${this.tableName}/pull_by_id_${this.tableName}.sql`,'utf8')
      .then(query => this.db.prepareQueryFromColumnsAndExecute(query,columns))
      .then(found => {
       return  this.processor.processRecordsets(found)[0]
      });
  }
  pullAll(){
    return fse.readFile(`${this.tablesDirectory}/${this.tableName}/pull_all_${this.tableName}.sql`,'utf8')
      .then(query => this.db.executeQueryAsPreparedStatement(query))
      .then(pulled => this.processor.processRecordsets(pulled));
  }
  deleteById(id: string, agent?){
    let columns = [];
    let pk = this.primaryKey();
    pk.value = id;
    columns.push(pk);
    return fse.readFile(`${this.tablesDirectory}/${this.tableName}/delete_by_id_${this.tableName}.sql`,'utf8')
      .then(query => this.db.prepareQueryFromColumnsAndExecute(query,columns))
      .then(deleted => this.processor.processRecordsets(deleted))
      .then(processed => {
        let array = [];
        array.push(processed[0]);
        let result: any = {
          table: this.tableName,
          operation: 'delete',
          deleted: array
        };
        if (agent) result.agent = agent;
        this.update.next(result);
        return result;
      })
  }
  deleteSingularById(id: string){
    let columns = [];
    let pk = this.primaryKey();
    pk.value = id;
    columns.push(pk);
    return fse.readFile(`${this.tablesDirectory}/${this.tableName}/delete_by_id_${this.tableName}.sql`,'utf8')
      .then(query => this.db.prepareQueryFromColumnsAndExecute(query,columns))
      .then(deleted => this.processor.processRecordsets(deleted))
      .then(processed => {
        let result: any = {
          operation: 'delete',
          deleted: processed[0]
        };
        return result;
      })
  }
  deleteMultipleByIds(ids: string[]){
    if (ids){
      if (!Array.isArray(ids)){
        let array = [];
        array.push(ids);
        ids = array;
      }
      let promises = ids.map(id => this.deleteSingularById(id));
      return Promise.all(promises)
        .then((success: any[]) => {
          //success = array of delete ops
          let deleted: any[] = success.filter(match => match.operation == 'delete')
            .map(op => op.deleted);
          let result;
          if (deleted.length > 0){
            result = {
              operation: 'delete',
              deleted: deleted
            }
          }
          return result;
        })
    } else throw 'No items specified to delete.'
  }
  merge(items, agent?){
    if (items){
      let toSave = items.toSave;
      let toDelete = items.toDelete;
      if ((toSave && Array.isArray(toSave)) || (toDelete && Array.isArray(toDelete))){
        let saved, deleted, result;
        saved = this.saveMultiple(toSave);
        deleted = this.deleteMultipleByIds(toDelete);
        return Promise.all([saved, deleted])
          .then(success => {
            saved = success[0];
            deleted = success[1];
            if (saved && deleted){
              result = {
                operation: (`${saved.operation} ${deleted.operation}`).trim(),
                created: saved.created,
                updated: saved.updated,
                deleted: deleted.deleted
              }
            } else if (saved) result = saved;
            else if (deleted) result = deleted;
            if (result){
              result.table = this.tableName;
              if (agent) result.agent = agent;
              this.update.next(result);
            }
            return result;
          })
      } else throw 'Incorrect format.'
    } else throw 'No items to modify.'
  }

  public static deepCopy(obj) {
    var copy;
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;
    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }
    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = this.deepCopy(obj[i]);
        }
        return copy;
    }
    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = this.deepCopy(obj[attr]);
        }
        return copy;
    }
    throw new Error("Unable to copy obj! Its type isn't supported.");
  }

}