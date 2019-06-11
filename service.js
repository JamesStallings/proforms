// ---------------------------------------------------------------------------------
//  This code implements Middleware Sytems' solution for Energy Rental Solutions'
//  requirement to move equipment return data workflow on-line from paper.
//
//  it accomplishes this with straightforward means using an html data entry
//  form coupled with email delivery to the operations center endpoint
//
//   (c) 2017 James G. Stallings/Active Network Services, all rights reserved.
//
//             This source code is proprietary and confidential.
//
//  --------------------------------------------------------------------------------
//
var url = require("url"),
    express = require("express"),
    session = require("express-session"),
    bodyParser = require("body-parser"),
    _ = require("underscore");
var fs = require('fs'),
    http = require("http"),
    https = require("https"),
    sslCreds = {
      key: fs.readFileSync('/etc/letsencrypt/live/proforms.middleware.systems/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/proforms.middleware.systems/fullchain.pem')
    }

var path = require("path");
var appwd = path.resolve()+"/";

var app = express(),
    port = process.argv[2] || 80

app.use(express.static(appwd+"assets"));

var settings = require(appwd+"settings.js");

require(appwd+"route_controller.js")(app);

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position){
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}

// var passport = require('passport'),
//     LocalStrategy = require('passport-local').Strategy,
//     knex = require('knex')({
//       client:     'mariasql',
//       connection: {
//         host:       '127.0.0.1',
//         user:       'sqluser',
//         password:   'w411yg470r',
//         database:   'erscatops'
//       }
//     });
//
// passport.use(new LocalStrategy(
//   function(username, password, done) {
//     User.findOne({ username: username }, function(err, user) {
//       if(err) { return done(err); }
//       if(!user) { return done(null, false, { message: 'Incorrect Username'}); }
//       if(!user.validPassword(password)) { return done(null, false, { message: 'Incorrect Password'}); }
//       return done(null, user);
//     });
//   }
// ));

var FileStore = require('session-file-store')(session);

app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: "PLOK7)(__)*&&%*+)*()(JMNYBHNJKOI<PVVC^)C%&%G*(P<KMBD%VCIRTIHL<::>:L}_)(^&)R&ICGH^TKUVLB<H>NJ(U*HYB&G(^^F))",
  saveUninitialized: true,
  resave: true,
  ttl: 691200000,
  store: new FileStore({
    secret: "PLOK7)(__)*&&%*+)*()(JMNYBHNJKOI<PVVC^)C%&%G*(P<KMBD%VCIRTIHL<::>:L}_)(^&)R&ICGH^TKUVLB<H>NJ(U*HYB&G(^^F))",
    ttl: 691200000
  })
}))

// start the service
//
//var server = app.listen(port, function () {

//  var host = server.address().address
//  var port = server.address().port

//  server.on('request',function(request,response) {
//    console.log("Request: "+Date()+" Requested URL: "+request.url);
//    console.log(request.method);
//  })
//  console.log("listening at http://%s:%s", host, port)
//})


var httpServer = http.createServer(app);
  var httpsServer = https.createServer(sslCreds, app);

  httpServer.listen(80);
  httpsServer.listen(443);

  httpServer.on('request',function(request,response) {
    console.log("Request: "+Date());
    // console.log(request.method);
    // console.log(request.headers);
    console.log(request.url);
    console.log("Redirecting to https");
    return response.redirect("https://" + request.headers["host"] + request.url);
  })

  httpsServer.on('request',function(request,response) {
    console.log("Request: "+Date()+" From: "+request.connection.remoteAddress);
    console.log(request.method);
    console.log(request.headers);
    console.log(request.url);
  })
