module.exports = function(app) {
  var path = require("path")
  var appwd = path.resolve()+"/"
  var moment = require("moment")
  var https = require("https")
  util = require("util")
  bodyParser = require("body-parser")
  app.use(bodyParser.urlencoded({
    extended: true
  }))

  app.use(bodyParser.json())

  // left padding s with c to a total of n chars
  function leftpad(s, c, n) {
    if (! s || ! c || s.length >= n) {
      return s;
    }
    var max = (n - s.length)/c.length;
    for (var i = 0; i < max; i++) {
      s = c + s;
    }
    return s;
  }

  // right padding s with c to a total of n chars
  function rightpad(s, c, n) {
    if (! s || ! c || s.length >= n) {
      return s;
    }
    var max = (n - s.length)/c.length;
    for (var i = 0; i < max; i++) {
      s += c;
    }
    return s;
  }

  var express = require("express")
  var expressValidator = require("express-validator")
  // implement route for 'GET /bol/'
  //
  app.get('/bol', function (req, res) {
    res.render("./pages/pushdata.ejs");
    console.log("served /bol/");
  });

  // helper function assembles email from form payload and posts via xmlrpc to middleware.systems
  // for delivery

  function postemail(body) {
    var fromaddr
    var toaddr
    var subj
    var msgtxt
    var truckno

    fromaddr = body.email
    toaddr = body.opscenter
    subj = "Bill of Lading - "+moment().subtract(7,'hours').format().replace('T',' ').replace('+02:00', '')
    msgtxt = "<pre>Sent By: "+fromaddr+
             "\nForm Type: "+body.destination+
             "\nFor Ops Center: "+toaddr+
             "\n \nCustomer Name: "+body.custname+
             "\nJob Location: "+body.location+
             "\nCarrier: "+body.carrier+
             "\nTruck No: "+body.truckno1+" of "+body.truckno2+
             "\nExchange: "+(body.exchange ? "Yes" : "No")+
             "\n \n "+
             "\nEquipment              ID                         Qty      Hrs      Fuel   Rerent Vendor"+
             "\n \n "

    var padchar = ' ';
    for (var i = 0; i < 10; i++) {
      var equip = leftpad(body.equip[i],padchar,20);
      var idnum = leftpad(body.idnum[i],padchar,20);
      var qty   = rightpad(body.qty[i],padchar,6);
      var hrs   = rightpad(body.hrs[i],padchar,6);
      var fuel  = rightpad(body.fuel[i],padchar,8);
      var rerent = leftpad(body.rerent[i],padchar,20);

      msgtxt = msgtxt + "\n"+equip+"   "+idnum+"   "+qty+"   "+hrs+"   "+fuel+"   "+rerent
    }
    msgtxt = msgtxt+"\n "

    console.log(fromaddr+"\n"+toaddr+"\n"+subj+"\n"+msgtxt)

    console.log("making xmlrpc request");

    var msgbody = encodeURI("/postmsg/"+body.apikey+"/"+fromaddr+"/"+toaddr+"/"+subj+"/"+msgtxt)
    // var msgbody = encodeURI("/postmsg/")

    var postreq = https.request({ host: "middleware.systems",
                    port: 443,
                    path: msgbody,
                    method: "POST"
                  }, function(postres) {
                       console.log("status code: ",postres.statusCode);
                       console.log("headers: ", postres.headers);
                       postres.on('data', function(d) {
                         process.stdout.write(d);
                       });
                     });
    postreq.end();

    console.log("xmlrpc request completed");

    postreq.on('error', function(e) {
      console.error(e);
    });

    return
  }

  // form submission handler
  // body arrives via POST with 'credentials' consisting of email address and API key in
  // conjunction with the data payload.
  // handler first looks up email address and if the email is not found, the browser is
  // directed to a bare cryptic message that can be used to identify the failing
  // otherwise, the API key is vetted; again, a redirect with noise is delivered in the event of
  // a failure to match the API key of record (per settings.js).
  // given that there is a valid API key presented with the payload, the payload will then be
  // processed into an email for delivery to the designated ops center and a final presentation
  // of the payload as an rendered html document suitable for printing. finally, a copy of the
  // print-formatted HTML document will be emailed to the form submitter.

  app.post("/bol/xformreflect", function(request, result) {
    if(request.body.apikey !== apikey){
      result.end("network transaction error");
      return;
    }

    for(var key in emails) {
      console.log(emails[key])
      console.log(request.body.opscenter)
      if(request.body.opscenter == undefined) {
        result.end("Check Ops Center");
        return;
      }

      if(emails[key] === request.body.email) {
        console.log("firing email api")
        timestamp = moment().subtract(5, 'hours')
        for (var i = 0; i < request.body.idnum.length; i++) {
          request.body.equip[i] = rightpad(request.body.equip[i],' ',20)
          request.body.idnum[i] = rightpad(request.body.idnum[i],' ',20)
          request.body.qty[i]   = leftpad(request.body.qty[i],' ',6)
          request.body.hrs[i]   = leftpad(request.body.hrs[i],' ',6)
          request.body.fuel[i]  = leftpad(request.body.fuel[i],' ',8)
          request.body.rerent[i] =rightpad(request.body.rerent[i],' ',20)
          var msgtxt = msgtxt + "\n"+request.body.equip+" "+request.body.idnum+" "+request.body.qty+" "+request.body.hrs+" "+request.body.fuel+"   "+request.body.rerent
        }
        postemail(request.body)
        result.render("./pages/printready.ejs", { body: request.body })
        return
      }
    }
    result.end("Check Email")
  })
}
