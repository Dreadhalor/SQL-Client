import { SQLTable } from './table';
import { Subject } from 'rxjs';
import * as uuid from 'uuid/v4';
import * as moment from 'moment';

const db = exports.db = require('./db');
const util = require('util');

exports.connect = (config) => db.connect(config);

let subscriptions = [];

const history = new Subject<any>();
exports.history = history.asObservable();

const Table = exports.Table = (schema: any) => {
  let table = new SQLTable(db, schema);
  subscriptions.push(table.update.asObservable().subscribe(next => {
    next = formatStandaloneEdit(next);
    //history.next(next)
  }));
  return table;
}
const Tables = exports.Tables = (schemas) => {
  let keys = Object.keys(schemas);
  keys.forEach(key => schemas[key] = Table(schemas[key]));
  return schemas;
}

const formatStandaloneEdit = (edit) => {
  let id = uuid();
  let timestamp = moment().format('dddd, MMMM Do YYYY, h:mm:ss a')
  if (edit) {
    return {
      transactionId: id,
      timestamp: timestamp,
      tables: edit
    };
  }
  return null;
}

const all = exports.all = (promiseFxns: any[], options?: any) => {
  if (promiseFxns.length > 0){
    return Promise.all(promiseFxns)
    .then(results => {
      for (let i = results.length; i >= 0; i--){
        if (!results[i]) results.splice(i,1);
        else if (Array.isArray(results[i])){
          let entry = results[i];
          results.splice(i,1);
          results = results.concat(entry);
        }
      }
      let tables = [];
      results.forEach(entry => {
        let index = tables.findIndex(match => match.table == entry.table);
        let table = (index >= 0) ? tables[index] : {
          table: entry.table,
          info: {}
        };
        let created = table.info.created, updated = table.info.updated, deleted = table.info.deleted;
        if (entry.info.created){
          if (!created) created = [];
          created = created.concat(entry.info.created)
        };
        if (entry.info.updated){
          if (!updated) updated = [];
          updated = updated.concat(entry.info.updated)
        };
        if (entry.info.deleted){
          if (!deleted) deleted = [];
          deleted = deleted.concat(entry.info.deleted)
        };
        table.info = {};
        if (created) table.info.created = created;
        if (updated) table.info.updated = updated;
        if (deleted) table.info.deleted = deleted;
        if (index >= 0) tables[index] = table;
        else tables.push(table);
      })
      if (options){
        if (options.standalone) history.next(formatStandaloneEdit(tables));
      }
      return tables;
    });
  } return null;
}