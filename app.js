const express = require('express');
const https = require("https");
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const moment = require('moment');
const _ = require('lodash');
const MongoStore = require('connect-mongodb-session')(session);
const numeral = require('numeral');
const helmet = require('helmet');
const colors = require('colors');
const cron = require('node-cron');
const common = require('./lib/common');
const { runIndexing } = require('./lib/indexing');
const { addSchemas } = require('./lib/schema');
const { initDb } = require('./lib/db');
let handlebars = require('express-handlebars');

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
});


// Validate our settings schema
const Ajv = require('ajv');
const ajv = new Ajv({ useDefaults: true });

// get config
let config = common.getConfig();

const baseConfig = ajv.validate(require('./config/baseSchema'), config);
if(baseConfig === false){
    console.log(colors.red(`settings.json incorrect: ${ajv.errorsText()}`));
    process.exit(2);
}

// Validate the payment gateway config
if(config.paymentGateway === 'paypal'){
    const paypalConfig = ajv.validate(require('./config/paypalSchema'), require('./config/paypal.json'));
    if(paypalConfig === false){
        console.log(colors.red(`PayPal config is incorrect: ${ajv.errorsText()}`));
        process.exit(2);
    }
}
if(config.paymentGateway === 'stripe'){
    const stripeConfig = ajv.validate(require('./config/stripeSchema'), require('./config/stripe.json'));
    if(stripeConfig === false){
        console.log(colors.red(`Stripe config is incorrect: ${ajv.errorsText()}`));
        process.exit(2);
    }
}
if(config.paymentGateway === 'authorizenet'){
    const authorizenetConfig = ajv.validate(require('./config/authorizenetSchema'), require('./config/authorizenet.json'));
    if(authorizenetConfig === false){
        console.log(colors.red(`Authorizenet config is incorrect: ${ajv.errorsText()}`));
        process.exit(2);
    }
}

// require the routes
const index = require('./routes/index');
const admin = require('./routes/admin');
const product = require('./routes/product');
const customer = require('./routes/customer');
const order = require('./routes/order');
const user = require('./routes/user');
const paypal = require('./routes/payments/paypal');
const stripe = require('./routes/payments/stripe');
const authorizenet = require('./routes/payments/authorizenet');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, '/views'));
app.engine('hbs', handlebars({
    extname: 'hbs',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    defaultLayout: 'layout.hbs',
    partialsDir: [path.join(__dirname, 'views')]
}));
app.set('view engine', 'hbs');

// helpers for the handlebar templating platform
handlebars = handlebars.create({
    helpers: {
        perRowClass: (numProducts) => {
            if(parseInt(numProducts) === 1){
                return'col-md-12 col-xl-12 col m12 xl12 product-item';
            }
            if(parseInt(numProducts) === 2){
                return'col-md-6 col-xl-6 col m6 xl6 product-item';
            }
            if(parseInt(numProducts) === 3){
                return'col-md-4 col-xl-4 col m4 xl4 product-item';
            }
            if(parseInt(numProducts) === 4){
                return'col-md-3 col-xl-3 col m3 xl3 product-item';
            }

            return'col-md-6 col-xl-6 col m6 xl6 product-item';
        },
        menuMatch: (title, search) => {
            if(!title || !search){
                return'';
            }
            if(title.toLowerCase().startsWith(search.toLowerCase())){
                return'class="navActive"';
            }
            return'';
        },
        getTheme: (view) => {
            return`themes/${config.theme}/${view}`;
        },
        formatAmount: (amt) => {
            if(amt){
                return numeral(amt).format('0.00');
            }
            return'0.00';
        },
        amountNoDecimal: (amt) => {
            if(amt){
                return handlebars.helpers.formatAmount(amt).replace('.', '');
            }
            return handlebars.helpers.formatAmount(amt);
        },
        getStatusColor: (status) => {
            switch(status){
            case'Paid':
                return'success';
            case'Approved':
                return'success';
            case'Approved - Processing':
                return'success';
            case'Failed':
                return'danger';
            case'Completed':
                return'success';
            case'Shipped':
                return'success';
            case'Pending':
                return'warning';
            default:
                return'danger';
            }
        },
        checkProductOptions: (opts) => {
            if(opts){
                return'true';
            }
            return'false';
        },
        currencySymbol: (value) => {
            if(typeof value === 'undefined' || value === ''){
                return'$';
            }
            return value;
        },
        objectLength: (obj) => {
            if(obj){
                return Object.keys(obj).length;
            }
            return 0;
        },
        stringify: (obj) => {
            if(obj){
                return JSON.stringify(obj);
            }
            return'';
        },
        checkedState: (state) => {
            if(state === 'true' || state === true){
                return'checked';
            }
            return'';
        },
        selectState: (state, value) => {
            if(state === value){
                return'selected';
            }
            return'';
        },
        isNull: (value, options) => {
            if(typeof value === 'undefined' || value === ''){
                return options.fn(this);
            }
            return options.inverse(this);
        },
        toLower: (value) => {
            if(value){
                return value.toLowerCase();
            }
            return null;
        },
        formatDate: (date, format) => {
            return moment(date).format(format);
        },
        ifCond: (v1, operator, v2, options) => {
            switch(operator){
            case'==':
                return(v1 === v2) ? options.fn(this) : options.inverse(this);
            case'!=':
                return(v1 !== v2) ? options.fn(this) : options.inverse(this);
            case'===':
                return(v1 === v2) ? options.fn(this) : options.inverse(this);
            case'<':
                return(v1 < v2) ? options.fn(this) : options.inverse(this);
            case'<=':
                return(v1 <= v2) ? options.fn(this) : options.inverse(this);
            case'>':
                return(v1 > v2) ? options.fn(this) : options.inverse(this);
            case'>=':
                return(v1 >= v2) ? options.fn(this) : options.inverse(this);
            case'&&':
                return(v1 && v2) ? options.fn(this) : options.inverse(this);
            case'||':
                return(v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
            }
        },
        isAnAdmin: (value, options) => {
            if(value === 'true' || value === true){
                return options.fn(this);
            }
            return options.inverse(this);
        }
    }
});

// session store
const store = new MongoStore({
    uri: config.databaseConnectionString,
    collection: 'sessions'
});

app.enable('trust proxy');
app.use(helmet());
app.set('port', process.env.PORT || 1111);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('5TOCyfH3HuszKGzFZntk'));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'pAgGxo8Hzg7PFlv1HpO8Eg0Y6xtP7zYx',
    cookie: {
        path: '/',
        httpOnly: true,
        maxAge: 900000
    },
    store: store
}));

// serving static content
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views', 'themes')));

// Make stuff accessible to our router
app.use((req, res, next) => {
    req.handlebars = handlebars;
    next();
});

// update config when modified
app.use((req, res, next) => {
    if(res.configDirty){
        config = common.getConfig();
        app.config = config;
    }
    next();
});

// Ran on all routes
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store');
    next();
});

// setup the routes
app.use('/', index);
app.use('/', customer);
app.use('/', product);
app.use('/', order);
app.use('/', user);
app.use('/', admin);
app.use('/paypal', paypal);
app.use('/stripe', stripe);
app.use('/authorizenet', authorizenet);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if(app.get('env') === 'development'){
    app.use((err, req, res, next) => {
        console.error(colors.red(err.stack));
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            helpers: handlebars.helpers
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
    console.error(colors.red(err.stack));
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        helpers: handlebars.helpers
    });
});

// Nodejs version check
const nodeVersionMajor = parseInt(process.version.split('.')[0].replace('v', ''));
if(nodeVersionMajor < 7){
    console.log(colors.red(`Please use Node.js version 7.x or above. Current version: ${nodeVersionMajor}`));
    process.exit(2);
}

app.on('uncaughtException', (err) => {
    console.error(colors.red(err.stack));
    process.exit(2);
});

initDb(config.databaseConnectionString, async (err, db) => {
    // On connection error we display then exit
    if(err){
        console.log(colors.red('Error connecting to MongoDB: ' + err));
        process.exit(2);
    }

    // add db to app for routes
    app.db = db;
    app.config = config;
    app.port = app.get('port');

    // Fire up the cron job to clear temp held stock
    cron.schedule('*/1 * * * *', async () => {
        const validSessions = await db.sessions.find({}).toArray();
        const validSessionIds = [];
        _.forEach(validSessions, (value) => {
            validSessionIds.push(value._id);
        });

        // Remove any invalid cart holds
        await db.cart.remove({
            sessionId: { $nin: validSessionIds }
        });
    });

    // Set trackStock for testing
    if(process.env.NODE_ENV === 'test'){
        config.trackStock = true;
    }

    // Process schemas
    await addSchemas();

    // We index when not in test env
    if(process.env.NODE_ENV !== 'test'){
        try{
            await runIndexing(app);
        }catch(ex){
            console.error(colors.red('Error setting up indexes:' + err));
        }
    }

    // Start the app
    try{
        await app.listen(app.get('port'));
        app.emit('appStarted');
        console.log(colors.green('expressCart running on host: http://localhost:' + app.get('port')));
    }catch(ex){
        console.error(colors.red('Error starting expressCart app:' + err));
        process.exit(2);
    }
});

module.exports = app;
