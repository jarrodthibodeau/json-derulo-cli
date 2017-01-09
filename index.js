#!/usr/bin/env node --harmony
const commander =  require('commander'),
      fs = require('fs')
      assert = require('assert');

commander
    .arguments('<file>')
    .option('-f --field <field>', 'Field that you want to have sorted')
    .option('-s --sort <sort>', 'Direction you want field to be sorted in, ASC for ascending, DESC for descending, DESC is default')
    .action((file) => {
        if (!file.includes('.json')) {
            throw new Error('File must be a JSON file');
        } else {
            parseArguments(file, commander.field , commander.sort , commander.dupes);
        }
    })
    .parse(process.argv);

function parseArguments(file, field, sort) {
    sort = typeof sort === undefined ? 'DESC' : sort;

    sortFile(file, field, sort);
}

function sortFile(file, field, sort) {
    fs.readFile(file, 'utf-8', (err, readFile) => {
        //This means you want the highest level of the file sorted
        if (field === undefined) {
            let fields = Object.keys(JSON.parse(readFile));
            const fileFields = JSON.parse(readFile);
            
            if (sort === 'DESC') {
                fields = fields.sort((a, b) => a > b ? 1 : -1);
            } else {
                fields = fields.sort((a, b) => a < b ? 1 : -1);
            }
            

            let json = {};

            fields.map((field) => json[field] = fileFields[field]);
            
            json = JSON.stringify(json, null, 2);

            fs.writeFile(file, json, 'utf-8', (err ,file) => {
                if (err) {
                    throw new Error(err);
                }
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
                if (sort === 'DESC') {
                    json = json.sort((a, b) => {
                        return a[field] - b[field];
                    });
                } else {
                    json = json.sort((a, b) => {
                        return b[field] - a[field]; 
                    });
                }
            }

            json = JSON.stringify(json, null, 2);

            fs.writeFile(file, json, 'utf-8', (err, file) => {
                if (err) {
                    throw new Error(err);
                }
            });
        }
    });
}