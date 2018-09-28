const sqlClient = require('../sql-client');
const paths = require('./paths');
const fse = require('fs-extra')
const PromisePlus = require('@dreadhalor/bluebird-plus');

export module TableConstructor {
  
  const constructTable = exports.constructTable = (tableName) => {
    templateFilesInRunOrder()
      .then(scripts => {
        scripts = scripts.map(group => group.map(filename => paths.getQuery(tableName, filename)));
        return PromisePlus.nestedPromiseAll(scripts, file => fse.readFile(file,'utf8'))
      })
      .then(result => PromisePlus.sequentialPromiseAll(result, sqlClient.prepareStatementAndExecute));
  }

  const getRunFiles = () =>{
    let names;
    let files = {};
    return fse.readdir(paths.templateDirectory)
    .then(filenames => {
      names = filenames;
      return Promise.all(filenames.map(filename => fse.readFile(paths.getTemplate(filename), 'utf8')))
    })
    .then(fileContents => {
      fileContents.forEach((content, index) => {
        let name = names[index].substring(0,names[index].lastIndexOf('.template'));
        files[name] = {
          file: names[index],
          runOrder: findRunOrder(content)
        }
      })
      return files;
    })
  }
  const findRunOrder = (singleFileContents) => {
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

  const templateFilesInRunOrder = () => {
    let queue = [];
    return getRunFiles()
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
}