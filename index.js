//AQUI SE TIENE TODA LA CONFIGURACION DE LA APLICACION

//importar la db
const mongoose = require('mongoose');
require('./config/db');

//importaciones
const express = require('express');
const handlebars = require('handlebars');
const exphbs= require('express-handlebars');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const path = require('path');
const router = require('./routes');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const passport = require('./config/passport');

const app = express();

//env para las variables de entorno
require('dotenv').config({path: 'variables.env'});

//habilitar bodyparser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//habilitar handlebar como view
app.engine('handlebars',
    exphbs ({
        handlebars: allowInsecurePrototypeAccess(handlebars),
        defaultLayout: 'layout',
        helpers: require('./helpers/handlebars')
    })
);
app.set('view engine', 'handlebars');

//static files
app.use(express.static(path.join(__dirname, 'public')));

//sesiones
app.use(cookieParser());
app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection: mongoose.connection})
}));

//inicializar passport
app.use(passport.initialize());
app.use(passport.session());

//alertar y flash messages
app.use(flash());

//crear nuestro middleware
app.use((req, res, next) =>{
    res.locals.mensajes = req.flash();
    next();
});

//aqui se lee el routing
app.use('/', router());

//puerto donde se muestra la app
app.listen(process.env.PUERTO);