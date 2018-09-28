import * as path from 'path';

export module TablePaths {
  const templateDirectory = exports.templateDirectory = path.resolve(__dirname,'../scripts/templates/tables');
  const tablesDirectory = exports.tablesDirectory = path.resolve(__dirname,'../scripts/generated/tables');

  const getTemplate = exports.getTemplate = (filename) => {
    let result = `${templateDirectory}/${filename}`;
    if (filename.lastIndexOf('.template') < 0) result += '.template.sql';
    return result;
  }
  const getQuery = exports.getQuery = (tableName, filename) => {
    let trimIndex = filename.lastIndexOf('.template');
    if (trimIndex >= 0) filename = filename.substring(0,trimIndex);
    return `${tablesDirectory}/${tableName}/${filename}_${tableName}.sql`;
  }
}