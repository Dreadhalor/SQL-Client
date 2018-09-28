export module SQLClient {
  const sql = require('mssql/msnodesqlv8');

  const prepareStatementAndExecute = exports.prepareStatementAndExecute = (query, columns?) => {
    let ps = (columns) ? prepareStatement(columns) : new sql.PreparedStatement();
    let values = (columns) ? formatPreparedValues(columns) : {};
    return executePreparedStatement(ps, query, values);
  }
  const formatPreparedValues = (columns) => {
    let result = {};
    columns.forEach(column => result[column.name] = column.value);
    return result;
  }
  const prepareStatement = (columns) => {
    let ps = new sql.PreparedStatement();
    columns.forEach(column => {
      ps.input(column.name, sql.VarChar(sql.MAX));
    })
    return ps;
  }

  const executePreparedStatement = (ps: any, str: string, vals: any) => {
    let result;
    return ps.prepare(str)
    .catch(error => console.log(error))
      .then(prepared => ps.execute(vals))
      .then(executed => {
        result = executed;
        return ps.unprepare();
      })
      .then(unprepared => result);
  }

}