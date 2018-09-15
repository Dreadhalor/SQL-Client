export module DatatypeParser {
  const sql = require('mssql/msnodesqlv8');

  const parseDataType = exports.parseDataType = (type: string, stringify: boolean) => {
    if (stringify){
      switch (type){
        case 'varchar(max)[]':
        case 'object':
        case 'object[]':
        case 'string':
        case 'string[]':
          return 'varchar(max)';
        default: return type;
      }
    }
    switch (type){
      case 'varchar(max)':
      case 'varchar(max)[]':
      case 'object':
      case 'object[]':
      case 'string':
      case 'string[]':
        return sql.VarChar(sql.MAX);
      case 'nvarchar(max)': return sql.NVarChar(sql.MAX);
      case 'varbinary(max)': return sql.VarBinary(sql.MAX);
      case 'bit': return sql.Bit;
      case 'int': return sql.Int;
    }
  }
}