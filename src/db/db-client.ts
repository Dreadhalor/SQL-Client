import { SQLTable } from './table';
import { Subject } from 'rxjs';

const db = require('./db');
const action = require('./action');

exports.connect = (config) => db.connect(config);

let subscriptions = [];

const history = new Subject<any>();
exports.history = history.asObservable();

const Table = exports.Table = (schema: any) => {
  let table = new SQLTable(db, schema);
  //subscriptions.push(table.update.asObservable().subscribe(next => history.next(next)));
  return table;
}
const Tables = exports.Tables = (schemas) => {
  let keys = Object.keys(schemas);
  keys.forEach(key => schemas[key] = Table(schemas[key]));
  return schemas;
}
exports.Action = require('./action');
