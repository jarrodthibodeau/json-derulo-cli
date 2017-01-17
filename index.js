#!/usr/bin/env node --harmony
'use strict';

const commander =  require('commander'),
      fs = require('fs'),
      assert = require('assert'),
      co = require('co'),
      prompt = require('co-prompt'),
      _ = require('underscore');

commander
    .arguments('<file>')
    .option('-f --field <field>', 'Field that you want to have sorted')
    .option('-s --sort <sort>', 'Direction you want field to be sorted in, ASC for ascending, DESC for descending')
    .option('-d --dupes <option>', 'Determine whether you want to find dupes or remove them, options are "find" & "remove"')
    .action((file) => {
        if (!file.includes('.json')) {
            throw new Error('File must be a JSON file');
        } else {
            parseArguments(file, commander.field , commander.sort , commander.dupes);
        }
    })
    .parse(process.argv);

function parseArguments(file, field, sort, dupes) {
    if (dupes && sort) {
        dealWithDupes(file, field, dupes, sort);
    } else if (dupes && !sort) {
        dealWithDupes(file, field, dupes);
    } else {
        sortFile(file, field, sort)
            .then((res) => console.log(res));
    }
}

function findDupes(jsonFile, field) {
    return new Promise((resolve, reject) => {
        let json,
            dupedItems = [];

        json = JSON.parse(jsonFile);

        if (json.length === undefined) {
            reject('This is not an array of objects.');
        }

        for (let i = 0; i < json.length; i++) {
            let itemCount = 0;

            for (let j = 0; j < json.length; j++) {
                if (json[j][field] === json[i][field]) {
                    itemCount++;
                }

                if (itemCount > 1 && dupedItems.indexOf(json[i][field]) === -1)  {
                    dupedItems.push(json[i][field]);
                }
            }
        }

        if (dupedItems.length === 0) {
            return reject(`There are no duplication items for field "${field}"`);
        } else {
            return resolve(_.uniq(dupedItems));
        }
    });
}

function removeDupes(file, jsonFile, dupes, field) {
    return new Promise((resolve, reject) => {
        let json = JSON.parse(jsonFile),
            dupeArray = [],
            itemsToKeep = [];
    
        for (let i = 0; i < dupes.length; i++) {
            dupeArray.push(json.filter(item => item[field] === dupes[i]));
        }

        co(function* () {
            for (let i = 0; i < dupeArray.length; i++) {
                let selection = yield prompt(`What field do you want to keep? \n ${JSON.stringify(dupeArray[i], null, 2)} \n`);

                while (dupeArray[i][selection - 1] === undefined) {
                    selection = yield prompt(`That's not a valid selection, please pick again.`);
                }

                itemsToKeep.push(dupeArray[i][selection - 1]);
            } 

            let writeResult = yield writeJsonFileWithoutDupes(itemsToKeep, dupeArray, file, json);

            if (writeResult) {
                resolve(writeResult);
            } else {
                reject(writeResult);
            }

        });
    });
}

function writeJsonFileWithoutDupes(itemsToKeep, dupeArray, jsonFile, json) {
    return new Promise((resolve, reject) => {

        for (let i = 0; i < dupeArray.length; i++) {
            for (let j = 0; j < dupeArray[i].length; j++) {
                if (dupeArray[i][j] === itemsToKeep[i]) {
                    dupeArray[i].splice(j, 1);
                    break;
                }
            }
        }

        for (let i = 0; i < dupeArray.length; i++) {
            for (let j = 0; j < dupeArray[i].length; j++) {
                json.splice(json.indexOf(dupeArray[i][j]), 1);
            }
        }

        json = JSON.stringify(json, null, 2);
        
        fs.writeFile(jsonFile, json, 'utf-8', (err, res) => {
            if (err) {
                return reject(err);
            }

            return resolve(true);
        });
        
    });
}

function dealWithDupes(file, field, dupes, sort) {
    if (!field) {
        throw new Error('Field needs to be specified');
    } else {
        fs.readFile(file, 'utf-8', (err, jsonFile) => {
            if (dupes === 'find') {
                findDupes(jsonFile, field)
                    .then(dupes => console.log(`Here are dupes found for field "${field}"...  ${dupes}`))
                    .catch(err => console.error(err));
            } else {
                findDupes(jsonFile, field, dupes)
                    .then((dupes) => removeDupes(file, jsonFile, dupes, field))
                    .then(res => {
                        console.log(`Dupes have been removed for field "${field}" for file ${file}`);

                        if (sort) {
                            sortFile(file, field, sort)
                            .then((res) =>  {
                                console.log(res);
                                process.exit(1);
                            });
                            
                        }
                    })
                    .catch(err => console.error(err));
            }
        });
    }
}

function sortFile(file, field, sort) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf-8', (err, readFile) => {
            //This means you want the highest level of the file sorted
            if (!field) {
                let fields = Object.keys(JSON.parse(readFile));
                const fileFields = JSON.parse(readFile);

                fields = sort === 'ASC' ? fields.sort((a, b) => a < b ? 1 : -1) : fields.sort((a, b) => a > b ? 1 : -1);
                
                let json = {};

                fields.map((field) => json[field] = fileFields[field]);
                
                json = JSON.stringify(json, null, 2);

                fs.writeFile(file, json, 'utf-8', (err, writtenFile) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(`File ${file} has been sorted successfully`);
                });
            } else {
                let json = JSON.parse(readFile);

                json.map((item) => {
                    assert(item[field] !== undefined, 'Sort value needs to exist for all items');
                    assert(typeof(item[field]) === 'string' || typeof(item[field] === 'Number'), 'Sort field must be sortable');
                });


                if (typeof(json[0][field]) === "string") {
                    json = json.sort((a, b) => {
                        return a[field].localeCompare(b[field]);
                    });

                    if (sort === 'ASC') {
                        json = json.reverse();
                    }
                    
                } else {
                    if (sort === 'ASC') {
                       json = json.sort((a, b) => {
                            return b[field] - a[field]; 
                        });
                    } else {
                        json = json.sort((a, b) => {
                            return a[field] - b[field];
                        });
                    }
                }

                json = JSON.stringify(json, null, 2);

                fs.writeFile(file, json, 'utf-8', (err, writtenfile) => {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(`File ${file} has been sorted successfully`);
                });
            }
        });  
    }); 
}