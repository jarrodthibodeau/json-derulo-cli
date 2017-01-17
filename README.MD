# json-derulo-cli

### A CLI tool to manage JSON files, specifically areas where there is an array of objects.

### Currently only working for Node V4+. Will fix ASAP.

### DISCLAIMER: This is not a stable tool yet. Right now this mainly support JSON files that contain an array of objects or just an object (package.json). If this meets your needs then use away!

### Installation
` npm i -g json-derulo-cli `

### Usage

#### Sorting a file 
` json-derulo package.json -s ASC`

First thing that is passed in is the file you want to sort. The -s (--sort) is the sort field.
This will accept either ASC or DESC as a value. If nothing is set for that flag then it will default to DESC.


#### Sorting a specific field of a file

` json-derulo <file> -f <field> -s <sort> `

The -f(--field) flag specifies what field of the JSON Array you want to sort on

#### Finding all dupes of a field

`json-derulo <file> -d find -f <field>`

The -d (--dupes) flag is the dupes flag. This will take in two options... find and remove. The find option 
will grab all the duplicates in a JSON Array of Objects in which the values are the same for a key.

#### Removing all dupes for a field

` json-derulo <file> -d remove -f <field> `

The remove option for the dupes flag will process everything through a field and grab all duplicates. Once
all duplications are found, you will be asked to decide what JSON object you want to keep of the found dupes.
After that, your file will be rewritten without the dupes.

#### Removing all dupes and sorting the file

` json-derulo <file> -d remove -f <field> -s <sort> `

This will remove all dupes for a field and then proceed to sort the file based on that field. 

# Future Plans

* Adding tests
* Allow for more deep sorting (Nested arrays/objects)
* Code optimizations and cleanup (Because when doesn't code need to be improved?)
* Probably a better way of using flags
* Not sure what else at this current moment