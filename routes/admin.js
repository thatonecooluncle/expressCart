const express = require('express');
const common = require('../lib/common');
const { restrict, checkAccess } = require('../lib/auth');
const escape = require('html-entities').AllHtmlEntities;
const colors = require('colors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const glob = require('glob');
const mime = require('mime-type/with-db');
const ObjectId = require('mongodb').ObjectID;
'use strict';
const sessionstorage = require('sessionstorage');
const router = express.Router();

// Admin section
router.get('/admin', restrict, (req, res, next) => {
    res.redirect('/admin/orders');
});

// logout
router.get('/admin/logout', (req, res) => {
    req.session.user = null;
    req.session.message = null;
    req.session.messageType = null;
    res.redirect('/');
});

// login form
router.get('/admin/login', (req, res) => {
    const db = req.app.db;

    db.users.count({}, (err, userCount) => {
        if(err){
            // if there are no users set the "needsSetup" session
            req.session.needsSetup = true;
            res.redirect('/admin/setup');
        }
        // we check for a user. If one exists, redirect to login form otherwise setup
        if(userCount > 0){
            // set needsSetup to false as a user exists
            req.session.needsSetup = false;
            res.render('login', {
                title: 'Login',
                referringUrl: req.header('Referer'),
                config: req.app.config,
                message: common.clearSessionValue(req.session, 'message'),
                messageType: common.clearSessionValue(req.session, 'messageType'),
                helpers: req.handlebars.helpers,
                showFooter: 'showFooter'
            });
        }else{
            // if there are no users set the "needsSetup" session
            req.session.needsSetup = true;
            res.redirect('/admin/setup');
        }
    });
});

// login the user and check the password
router.post('/admin/login_action', (req, res) => {
    var request = require("request");

var options = { 
method: 'POST',
  url: 'https://qabook.hollandamerica.com/api/dspm/login/v1.0.0/authenticate',
  gzip: true,
  qs: { companyCode: 'HAL' },
  headers: 
   { 'Postman-Token': 'd5904c86-b375-4a65-8002-ccf0470de226',
     'cache-control': 'no-cache',
     ADRUM: 'isAjax:true',
     'Client-Id': 'secondaryFlow',
     Connection: 'keep-alive',
     Cookie: 'BIGipServerHALQA-BOOK_TCP_443_pl=2012559626.47873.0000; TLTSID=8B04B267853E5CCF6BBE89727DDFC3EE; TLTUID=8FF904D7895199EE38B65C53D44A618E; _sdsat_landing_page=https://qabook.hollandamerica.com/secondaryFlow/login|1564500305285; _sdsat_session_count=1; _sdsat_lt_pages_viewed=1; _sdsat_pages_viewed=1; _sdsat_traffic_source=; check=true; AMCVS_21C91F2F575539D07F000101%40AdobeOrg=1; _gcl_au=1.1.757429834.1564500306; s_ecid=MCMID%7C84821131846084444903644302718755412169; AMCV_21C91F2F575539D07F000101%40AdobeOrg=-1891778711%7CMCIDTS%7C18108%7CMCMID%7C84821131846084444903644302718755412169%7CMCAAMLH-1565105105%7C7%7CMCAAMB-1565105105%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1564507505s%7CNONE%7CMCAID%7CNONE%7CMCSYNCSOP%7C411-18115%7CvVersion%7C2.4.0; mf_user=de4ff6d1d8a3ff428bd3110b26d4ac75|; s_dfa=crbrhollandamericadevus%2Ccrbrcarnivalbrandsdevus; s_ppn=hal%3Asecondaryflow%3Aauthentication%3Alogin; gds_s=First%20Visit; s_vnum=1564642800670%26vn%3D1; s_invisit=true; s_ppvl=hal%253Asecondaryflow%253Aauthentication%253Alogin%2C26%2C26%2C167%2C1323%2C167%2C1366%2C768%2C1%2CP; mbox=session#f2ed8a0a4b5e40f08efa41538d885126#1564502183|PC#f2ed8a0a4b5e40f08efa41538d885126.28_12#1627745107; mf_aad55bff-9657-41d3-86a6-b08482f06c7f=c2804583aaa27043d3b4f16fb86ef0f0|07300622245d31834e6d564dbb8bc7d139f607a2.-864550067.1564500319015|1564500339033||1|||0|16.13|5; s_ppv=hal%253Asecondaryflow%253Aauthentication%253Alogin%2C100%2C26%2C642%2C1323%2C258%2C1366%2C768%2C1%2CP; s_nr=1564500345980-New; gds=1564500345984; s_sq=%5B%5BB%5D%5D; s_cc=true',
     Referer: 'https://qabook.hollandamerica.com/secondaryFlow/login',
     'Cache-Control': 'no-cache',
     Accept: 'application/json, text/plain, */*',
     'Content-Type': 'application/json',
     'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
     'Accept-Language': 'en-US,en;q=0.9',
     'Accept-Encoding': 'gzip, deflate, br',
     Origin: 'https://qabook.hollandamerica.com',
     Pragma: 'no-cache' },
  body: 
   { bookingNumber: 'CLHTVH',
     lastName: 'aasd',
     role: 'GIFTER',
     clientId: 'secondaryFlow' },
  json: true };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body.token);
  res.status(200).json({ message: 'Token added' });
  req.session.bookingNumber = body.bookingNumber;
  req.session.lastName = body.lastName;
  req.session.token = body.token;
  //window.sessionstorage.setItem("Token", req.session.token);
});
});

// setup form is shown when there are no users setup in the DB
router.get('/admin/setup', (req, res) => {
    const db = req.app.db;

    db.users.count({}, (err, userCount) => {
        if(err){
            console.error(colors.red('Error getting users for setup', err));
        }
        // dont allow the user to "re-setup" if a user exists.
        // set needsSetup to false as a user exists
        req.session.needsSetup = false;
        if(userCount === 0){
            req.session.needsSetup = true;
            res.render('setup', {
                title: 'Setup',
                config: req.app.config,
                helpers: req.handlebars.helpers,
                message: common.clearSessionValue(req.session, 'message'),
                messageType: common.clearSessionValue(req.session, 'messageType'),
                showFooter: 'showFooter'
            });
        }else{
            res.redirect('/admin/login');
        }
    });
});

// insert a user
router.post('/admin/setup_action', (req, res) => {
    const db = req.app.db;

    const doc = {
        usersName: req.body.usersName,
        userEmail: req.body.userEmail,
        userPassword: bcrypt.hashSync(req.body.userPassword, 10),
        isAdmin: true
    };

    // check for users
    db.users.count({}, (err, userCount) => {
        if(err){
            console.info(err.stack);
        }
        if(userCount === 0){
            // email is ok to be used.
            db.users.insert(doc, (err, doc) => {
                // show the view
                if(err){
                    console.error(colors.red('Failed to insert user: ' + err));
                    req.session.message = 'Setup failed';
                    req.session.messageType = 'danger';
                    res.redirect('/admin/setup');
                }else{
                    req.session.message = 'User account inserted';
                    req.session.messageType = 'success';
                    res.redirect('/admin/login');
                }
            });
        }else{
            res.redirect('/admin/login');
        }
    });
});

// settings update
router.get('/admin/settings', restrict, (req, res) => {
    res.render('settings', {
        title: 'Cart settings',
        session: req.session,
        admin: true,
        themes: common.getThemes(),
        message: common.clearSessionValue(req.session, 'message'),
        messageType: common.clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        config: req.app.config,
        footerHtml: typeof req.app.config.footerHtml !== 'undefined' ? escape.decode(req.app.config.footerHtml) : null,
        googleAnalytics: typeof req.app.config.googleAnalytics !== 'undefined' ? escape.decode(req.app.config.googleAnalytics) : null
    });
});

// settings update
router.post('/admin/createApiKey', restrict, checkAccess, async (req, res) => {
    const db = req.app.db;
    const result = await db.users.findOneAndUpdate({
        _id: ObjectId(req.session.userId),
        isAdmin: true
    }, {
        $set: {
            apiKey: new ObjectId()
        }
    }, {
        returnOriginal: false
    });

    if(result.value && result.value.apiKey){
        res.status(200).json({ message: 'API Key generated', apiKey: result.value.apiKey });
        return;
    }
    res.status(400).json({ message: 'Failed to generate API Key' });
});

// settings update
router.post('/admin/settings/update', restrict, checkAccess, (req, res) => {
    const result = common.updateConfig(req.body);
    if(result === true){
        res.status(200).json({ message: 'Settings successfully updated' });
        res.configDirty = true;
        return;
    }
    res.status(400).json({ message: 'Permission denied' });
});

// settings update
router.post('/admin/settings/option/remove', restrict, checkAccess, (req, res) => {
    const db = req.app.db;
    db.products.findOne({ _id: common.getId(req.body.productId) }, (err, product) => {
        if(err){
            console.info(err.stack);
        }
        if(product && product.productOptions){
            const optJson = JSON.parse(product.productOptions);
            delete optJson[req.body.optName];

            db.products.update({ _id: common.getId(req.body.productId) }, { $set: { productOptions: JSON.stringify(optJson) } }, (err, numReplaced) => {
                if(err){
                    console.info(err.stack);
                }
                if(numReplaced.result.nModified === 1){
                    res.status(200).json({ message: 'Option successfully removed' });
                }else{
                    res.status(400).json({ message: 'Failed to remove option. Please try again.' });
                }
            });
        }else{
            res.status(400).json({ message: 'Product not found. Try saving before removing.' });
        }
    });
});

// settings update
router.get('/admin/settings/menu', restrict, async (req, res) => {
    const db = req.app.db;
    res.render('settings_menu', {
        title: 'Cart menu',
        session: req.session,
        admin: true,
        message: common.clearSessionValue(req.session, 'message'),
        messageType: common.clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        config: req.app.config,
        menu: common.sortMenu(await common.getMenu(db))
    });
});

// settings page list
router.get('/admin/settings/pages', restrict, (req, res) => {
    const db = req.app.db;
    db.pages.find({}).toArray(async (err, pages) => {
        if(err){
            console.info(err.stack);
        }

        res.render('settings_pages', {
            title: 'Static pages',
            pages: pages,
            session: req.session,
            admin: true,
            message: common.clearSessionValue(req.session, 'message'),
            messageType: common.clearSessionValue(req.session, 'messageType'),
            helpers: req.handlebars.helpers,
            config: req.app.config,
            menu: common.sortMenu(await common.getMenu(db))
        });
    });
});

// settings pages new
router.get('/admin/settings/pages/new', restrict, checkAccess, async (req, res) => {
    const db = req.app.db;

    res.render('settings_page_edit', {
        title: 'Static pages',
        session: req.session,
        admin: true,
        button_text: 'Create',
        message: common.clearSessionValue(req.session, 'message'),
        messageType: common.clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        config: req.app.config,
        menu: common.sortMenu(await common.getMenu(db))
    });
});

// settings pages editor
router.get('/admin/settings/pages/edit/:page', restrict, checkAccess, (req, res) => {
    const db = req.app.db;
    db.pages.findOne({ _id: common.getId(req.params.page) }, async (err, page) => {
        if(err){
            console.info(err.stack);
        }
        // page found
        const menu = common.sortMenu(await common.getMenu(db));
        if(page){
            res.render('settings_page_edit', {
                title: 'Static pages',
                page: page,
                button_text: 'Update',
                session: req.session,
                admin: true,
                message: common.clearSessionValue(req.session, 'message'),
                messageType: common.clearSessionValue(req.session, 'messageType'),
                helpers: req.handlebars.helpers,
                config: req.app.config,
                menu
            });
        }else{
            // 404 it!
            res.status(404).render('error', {
                title: '404 Error - Page not found',
                config: req.app.config,
                message: '404 Error - Page not found',
                helpers: req.handlebars.helpers,
                showFooter: 'showFooter',
                menu
            });
        }
    });
});

// settings update page
router.post('/admin/settings/pages/update', restrict, checkAccess, (req, res) => {
    const db = req.app.db;

    const doc = {
        pageName: req.body.pageName,
        pageSlug: req.body.pageSlug,
        pageEnabled: req.body.pageEnabled,
        pageContent: req.body.pageContent
    };

    if(req.body.page_id){
        // existing page
        db.pages.findOne({ _id: common.getId(req.body.page_id) }, (err, page) => {
            if(err){
                console.info(err.stack);
            }
            if(page){
                db.pages.update({ _id: common.getId(req.body.page_id) }, { $set: doc }, {}, (err, numReplaced) => {
                    if(err){
                        console.info(err.stack);
                    }
                    res.status(200).json({ message: 'Page updated successfully', page_id: req.body.page_id });
                });
            }else{
                res.status(400).json({ message: 'Page not found' });
            }
        });
    }else{
        // insert page
        db.pages.insert(doc, (err, newDoc) => {
            if(err){
                res.status(400).json({ message: 'Error creating page. Please try again.' });
            }else{
                res.status(200).json({ message: 'New page successfully created', page_id: newDoc._id });
            }
        });
    }
});

// settings delete page
router.get('/admin/settings/pages/delete/:page', restrict, checkAccess, (req, res) => {
    const db = req.app.db;
    db.pages.remove({ _id: common.getId(req.params.page) }, {}, (err, numRemoved) => {
        if(err){
            req.session.message = 'Error deleting page. Please try again.';
            req.session.messageType = 'danger';
            res.redirect('/admin/settings/pages');
            return;
        }
        req.session.message = 'Page successfully deleted';
        req.session.messageType = 'success';
        res.redirect('/admin/settings/pages');
    });
});

// new menu item
router.post('/admin/settings/menu/new', restrict, checkAccess, (req, res) => {
    const result = common.newMenu(req, res);
    if(result === false){
        req.session.message = 'Failed creating menu.';
        req.session.messageType = 'danger';
    }
    res.redirect('/admin/settings/menu');
});

// update existing menu item
router.post('/admin/settings/menu/update', restrict, checkAccess, (req, res) => {
    const result = common.updateMenu(req, res);
    if(result === false){
        req.session.message = 'Failed updating menu.';
        req.session.messageType = 'danger';
    }
    res.redirect('/admin/settings/menu');
});

// delete menu item
router.get('/admin/settings/menu/delete/:menuid', restrict, checkAccess, (req, res) => {
    const result = common.deleteMenu(req, res, req.params.menuid);
    if(result === false){
        req.session.message = 'Failed deleting menu.';
        req.session.messageType = 'danger';
    }
    res.redirect('/admin/settings/menu');
});

// We call this via a Ajax call to save the order from the sortable list
router.post('/admin/settings/menu/save_order', restrict, checkAccess, (req, res) => {
    const result = common.orderMenu(req, res);
    if(result === false){
        res.status(400).json({ message: 'Failed saving menu order' });
        return;
    }
    res.status(200);
});

// validate the permalink
router.post('/admin/api/validate_permalink', (req, res) => {
    // if doc id is provided it checks for permalink in any products other that one provided,
    // else it just checks for any products with that permalink
    const db = req.app.db;

    let query = {};
    if(typeof req.body.docId === 'undefined' || req.body.docId === ''){
        query = { productPermalink: req.body.permalink };
    }else{
        query = { productPermalink: req.body.permalink, _id: { $ne: common.getId(req.body.docId) } };
    }

    db.products.count(query, (err, products) => {
        if(err){
            console.info(err.stack);
        }
        if(products > 0){
            res.status(400).json({ message: 'Permalink already exists' });
        }else{
            res.status(200).json({ message: 'Permalink validated successfully' });
        }
    });
});

// upload the file
const upload = multer({ dest: 'public/uploads/' });
router.post('/admin/file/upload', restrict, checkAccess, upload.single('upload_file'), (req, res, next) => {
    const db = req.app.db;

    if(req.file){
        const file = req.file;

        // Get the mime type of the file
        const mimeType = mime.lookup(file.originalname);

        // Check for allowed mime type and file size
        if(!common.allowedMimeType.includes(mimeType) || file.size > common.fileSizeLimit){
            // Remove temp file
            fs.unlinkSync(file.path);

            // Redirect to error
            req.session.message = 'File type not allowed or too large. Please try again.';
            req.session.messageType = 'danger';
            res.redirect('/admin/product/edit/' + req.body.productId);
            return;
        }

        // get the product form the DB
        db.products.findOne({ _id: common.getId(req.body.productId) }, (err, product) => {
            if(err){
                console.info(err.stack);
                // delete the temp file.
                fs.unlinkSync(file.path);

                // Redirect to error
                req.session.message = 'File upload error. Please try again.';
                req.session.messageType = 'danger';
                res.redirect('/admin/product/edit/' + req.body.productId);
                return;
            }

            const productPath = product.productPermalink;
            const uploadDir = path.join('public/uploads', productPath);

            // Check directory and create (if needed)
            common.checkDirectorySync(uploadDir);

            const source = fs.createReadStream(file.path);
            const dest = fs.createWriteStream(path.join(uploadDir, file.originalname.replace(/ /g, '_')));

            // save the new file
            source.pipe(dest);
            source.on('end', () => { });

            // delete the temp file.
            fs.unlinkSync(file.path);

            const imagePath = path.join('/uploads', productPath, file.originalname.replace(/ /g, '_'));

            // if there isn't a product featured image, set this one
            if(!product.productImage){
                db.products.update({ _id: common.getId(req.body.productId) }, { $set: { productImage: imagePath } }, { multi: false }, (err, numReplaced) => {
                    if(err){
                        console.info(err.stack);
                    }
                    req.session.message = 'File uploaded successfully';
                    req.session.messageType = 'success';
                    res.redirect('/admin/product/edit/' + req.body.productId);
                });
            }else{
                req.session.message = 'File uploaded successfully';
                req.session.messageType = 'success';
                res.redirect('/admin/product/edit/' + req.body.productId);
            }
        });
    }else{
        // Redirect to error
        req.session.message = 'File upload error. Please select a file.';
        req.session.messageType = 'danger';
        res.redirect('/admin/product/edit/' + req.body.productId);
    }
});

// delete a file via ajax request
router.post('/admin/testEmail', restrict, (req, res) => {
    const config = req.app.config;
    // TODO: Should fix this to properly handle result
    common.sendEmail(config.emailAddress, 'expressCart test email', 'Your email settings are working');
    res.status(200).json({ message: 'Test email sent' });
});

// delete a file via ajax request
router.post('/admin/file/delete', restrict, checkAccess, (req, res) => {
    req.session.message = null;
    req.session.messageType = null;

    fs.unlink('public/' + req.body.img, (err) => {
        if(err){
            console.error(colors.red('File delete error: ' + err));
            res.writeHead(400, { 'Content-Type': 'application/text' });
            res.end('Failed to delete file: ' + err);
        }else{
            res.writeHead(200, { 'Content-Type': 'application/text' });
            res.end('File deleted successfully');
        }
    });
});

router.get('/admin/files', restrict, (req, res) => {
    // loop files in /public/uploads/
    glob('public/uploads/**', { nosort: true }, (er, files) => {
        // sort array
        files.sort();

        // declare the array of objects
        const fileList = [];
        const dirList = [];

        // loop these files
        for(let i = 0; i < files.length; i++){
            // only want files
            if(fs.lstatSync(files[i]).isDirectory() === false){
                // declare the file object and set its values
                const file = {
                    id: i,
                    path: files[i].substring(6)
                };

                // push the file object into the array
                fileList.push(file);
            }else{
                const dir = {
                    id: i,
                    path: files[i].substring(6)
                };

                // push the dir object into the array
                dirList.push(dir);
            }
        }

        // render the files route
        res.render('files', {
            title: 'Files',
            files: fileList,
            admin: true,
            dirs: dirList,
            session: req.session,
            config: common.get(),
            message: common.clearSessionValue(req.session, 'message'),
            messageType: common.clearSessionValue(req.session, 'messageType')
        });
    });
});

module.exports = router;
