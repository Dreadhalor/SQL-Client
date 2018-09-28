import { Subject } from 'rxjs';

export module Transaction {

  

  const execute = exports.execute = (ops: Promise<any>[], tag: string) => {
    return Promise.all(ops);
  }

  /*
  action.execute([
    promiseA,
    promiseB,
    etc
  ],
  "checkout")
  */
}

/*
db -> table -> record

databaseOp -> tableOp -> recordOp

databaseOp:
--defined with tableOps

tableOp:
--defined with recordOps
--ops:
*save
*delete
--executed serially

recordOp:
--defined with.. actual edits?
*save: --create, update, 




--track changes to a record in terms of recordOps
record.save()
record.delete()

--track changes to a table in terms of tableOps
table.save(record)
table.delete(recordId)

--track changes to a db in terms of databaseOps
db.save(stuff)
db.delete(stuff)

---dbOp
-recordOp
---dbOp
--tableOp
--tableOp
--tableOp
---dbOp
-recordOp

*/