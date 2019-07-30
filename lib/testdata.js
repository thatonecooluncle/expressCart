const { getConfig } = require('./common');
const { initDb } = require('./db');
const { fixProductDates } = require('./indexing');
const fs = require('fs');
const path = require('path');

const testData = 'https://stg.api.bazaarvoice.com/data/products.json?action=preview&passKey=q7pvzrjaun87rsfhuq9spveg&apiversion=5.4&stats=reviews&limit=100&filter=id:100032297,100055482,100081420,1719,100055480,5401,100055488,1010053617,891,100032295,100030671,100055481,100060402,100060401,100060404,100060403,100026774,890';
fetch(testData)
.then(res => res.json())
.then(function (out) {
  console.log(out);
  //appendData(out);
})
.catch(err => { throw err });
const jsonData = JSON.parse(testData);

// get config
const config = getConfig();

initDb(config.databaseConnectionString, (err, db) => {
    Promise.all([
        db.users.remove({}, {}),
        db.customers.remove({}, {}),
        db.products.remove({}, {}),
        db.menu.remove({}, {})
    ])
    .then(() => {
        Promise.all([
            db.users.insertMany(jsonData.users),
            db.customers.insertMany(jsonData.customers),
            db.products.insertMany(fixProductDates(jsonData.products)),
            db.menu.insertOne(jsonData.menu)
        ])
        .then(() => {
            console.log('Test data complete');
            process.exit();
        })
        .catch((err) => {
            console.log('Error inserting test data', err);
            process.exit(2);
        });
    })
    .catch((err) => {
        console.log('Error removing existing test data', err);
        process.exit(2);
    });
});
