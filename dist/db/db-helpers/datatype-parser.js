"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DatatypeParser;
(function (DatatypeParser) {
    var sql = require('mssql/msnodesqlv8');
    var parseDataType = exports.parseDataType = function (type, stringify) {
        if (stringify) {
            switch (type) {
                case 'varchar(max)[]':
                case 'object':
                case 'object[]':
                case 'string':
                case 'string[]':
                    return 'varchar(max)';
                default: return type;
            }
        }
        switch (type) {
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
    };
})(DatatypeParser = exports.DatatypeParser || (exports.DatatypeParser = {}));
//# sourceMappingURL=datatype-parser.js.map