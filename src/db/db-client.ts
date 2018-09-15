import { Table } from './table';
import { Subject } from 'rxjs';

const db = require('./db');

exports.connect = (config) => db.connect(config);

let subscriptions = [];

const history = new Subject<any>();
exports.history = history.asObservable();

exports.Table = (schema: any) => {
  let table = new Table(db, schema);
  subscriptions.push(table.update.asObservable().subscribe(next => history.next(next)));
  return table;
}