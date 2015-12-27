/**
 * Created by Cezar on 10/12/2015.
 */

var express = require('express');
var app = express();

var handlebars = require('express-handlebars').create({
	defaultLayout: 'main',

	// This is a protocol required by Handlebars helpers to 
	// enable this special technique. I don't quite understand
	// what it accomplishes, but if you want to put everything together
	// look at layout in main.handlebars how we put the sections,
	// and then at home page how we define the sections.
	helpers: {
		section: function (name, options) {
			if (!this._sections) this._sections = {};
			this._sections[name] = options.fn(this);
			return null;
		}
	}
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

var weather = require('./lib/weather.js');
app.use(function (req, res, next) {
	if (!res.locals.partials) {
		res.locals.partials = {};
	}
	res.locals.partials.weatherContext = weather.getWeather();
	next();
});

//-- Connect
var connext = require('connect');


// route for about

var fortune = require('./lib/fortune.js');
var bodyParser = require('body-parser').urlencoded({ extended: true });

// form parser
var formidable = require('formidable');

app.use(bodyParser);

// Utils
var utils = require('./lib/utils.js');

// Credentials
var credentials = require('./credentials.js');
utils.objectDump ( credentials, "== Credentials: ");

// Cookie parser
app.use(require('cookie-parser')(credentials.cookieSecret));

// Session parser
app.use(require('express-session')({
	resave: false,
	saveUninitialized: false,
	secret: credentials.cookieSecret,
}));

var forwardFlash = function(req, res, next) {
	res.locals.flash = req.session.flash;
	delete req.session.flash;
	next();
};
app.use(forwardFlash);



//***************************************************
// HOME
//***************************************************
app.get('/', function(req, res){
    res.render('home');
});

//***************************************************
// WEATHER
//***************************************************
app.get('/weather', function(req, res){
    res.render('weather');
});


//***************************************************
// NEWSLETTER
//***************************************************
app.get('/newsletter', function(req, res){
	// We will learn CSRF later. For now use dummy value
	console.log(req.query);	
	console.log(req.query.ajax);
	if ( req.query.ajax === undefined ) {
		res.render('newsletter', { csrf: "CSRF token goes here" });
	}
	else {
		res.render('newsletter-ajax', { csrf: "CSRF token goes here" });
	}
});

app.get('/thank-you', function(req, res){
	res.set('Content-Type', 'text/html');

	var thanksTo = '';
	if ( req.cookies.thanksTo ) thanksTo = ' ' + req.cookies.thanksTo.name + ' for ' + req.cookies.thanksTo.thing;
	res.send('<h3>Thank you' + thanksTo + '!</h3>');
});

app.post('/process', function(req, res){
	
	// Here we use body-parser to get body information from the post.

	console.log('Form (from querystring): ' + req.query.form);
	console.log('CSRF token (from hidden field): ' + req.body._csrf);
	console.log('Name: ' + req.body.name);
	console.log('Email: ' + req.body.email);

	if(req.xhr || req.accepts('json,html')==='json') {
		console.log('received json');
		// Sends the data object to the ajax callback
		res.send({success: true, name: req.body.name});
	}
	else {
		console.log("Received Post");
		res.redirect(303, '/thank-you');
		}
});


app.get('/about', function(req, res){
	var monster = req.cookies.monster;
	console.log("Cookie monster: " + monster);
	console.dir(req.query);
	var params = [];
    var ul = "<ul>";
    for (var key in req.query) {
        var value = req.query[key];
        ul += "<li>" + key + " : " + value + "</li>";
        console.log("growing ul: " + ul);
        params.push({key: key, value: value});
        console.log("growing params: ");
        console.dir(params);
    }
    ul += "</ul>";
    console.log("Rendering...");
    res.render('about', {fortune: fortune.getFortune(), htmlParams: ul, params:params});
});

app.get('/headers', function (req, res) {
	res.set('Content-Type', 'text/plain');
	var s = '';
	for (var name in req.headers) {
		s += name + ' : ' + req.headers[name] + '\n';
	}
	res.send(s);
});

app.get('/jquery-test', function (req, res) {
	res.render('jquery-test');
});

app.get('/nursery-rhyme', function (req, res) {
	res.render('nursery-rhyme');
});

app.get('/data/nursery-rhyme', function(req, res) { 
	res.json({ 
		animal: 'squirrel', 
		bodyPart: 'tail', 
		adjective: 'bushy', 
		noun: 'heck', 
	}); 
});

//=========================================================
// COOKIES
//=========================================================
app.get('/get-cookie', function(req, res){
	res.set('Content-Type', 'text/html');

	if ( req.cookies.myCookie ) {
		res.send ( "<h3>Cookie '" + req.cookies.myCookie.name + "' = '" + req.cookies.myCookie.text + "'</h3>" );
	}
	else {
		res.send('<h3>Cookie is not set</h3>');
	}
});

app.get('/set-cookie', function(req, res){
	res.render('set-cookie');
});

app.post('/set-cookie', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields){
		if(err) return res.redirect(303, '/error');
		console.log('received fields:');
		console.log(fields);

		// set cookie
		res.cookie('myCookie', { name: fields.cookieName, text: fields.cookieText });
		res.redirect(303, '/get-cookie');
	});
});

//=========================================================
// SESSION
//=========================================================
app.get('/get-session', function(req, res){
	res.set('Content-Type', 'text/html');

	if ( req.session ) {
		var list = "<ul>";
		for(x in req.session) {
			list += "<li>'" + x + "' = '" + req.session[x] + "'</li>";
		}
		list += "</ul>";
		res.send ( list );
	}
	else {
		res.send('<h3>Session is not set</h3>');
	}
});

app.get('/set-session', function(req, res){
	res.render('set-session');
});

app.post('/set-session', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields){
		if(err) return res.redirect(303, '/error');
		console.log('received fields:');
		console.log(fields);

		// set session
		req.session[fields.variableName] = fields.variableValue;
		res.redirect(303, '/get-session');
	});
});

//=========================================================
// /CONTEST/VACATION-PHOTO: file system and file upload
//=========================================================

var fs = require('fs');
var dataDir = __dirname + "/data";
var vacationPhotoDir = dataDir + "/vacation-photo";

// Make sure the photo collection directory exists
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

//--------------------------------
function saveContestPhoto(contestName, email, year, month, photoPath) {

}

//--------------------------------
function gotoVacationPhoto(res, flashObject) {
	var now = new Date();
	var renderParm = {year:now.getFullYear(), month:now.getMonth()+1 };
	if ( flashObject ) renderParm.flash = flashObject;
	res.render('vacation-photo', renderParm);
}

//--------------------------------
function copyFile(sourcePath, targetPath, move) {
	//-- The book had the code:
	// fs.renameSync(sourcePhotoPath, targetPhotoPath);
	// that didn't work.

	// Here is code that is supposed to work
	console.log ("Copying/moving file [" + sourcePath + "] to [" + targetPath + "]");

	var readStream=fs.createReadStream(sourcePath);
	var writeStream=fs.createWriteStream(targetPath);
	readStream.pipe(writeStream);
	readStream.on('end',function(){
		if(move) {
			fs.unlinkSync(sourcePath);
		}
	});
}

function moveFile(sourcePath, targetPath) {
	copyFile(sourcePath, targetPath, true);
}

app.get('/contest/vacation-photo', function(req, res){
	gotoVacationPhoto(res);
});

app.post('/contest/vacation-photo/:year/:month', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		if(err) {
			res.session.flash = {
				type: 'danger',
				intro: 'Oops!',
				message: "There was an error processing your submission. Please try again",
			};
			return res.redirect(303, '/contest/vacation-photo');
		}

		console.log('received fields:');
		console.log(fields);
		console.log('received files:');
		console.log(files);
		console.log("params:");
		console.log(req.params);

		var photoData = files.photo;
		var dir = vacationPhotoDir + '/' + Date.now();
		fs.existsSync(dir) || fs.mkdirSync(dir);

		var uploadPhotoPath = photoData.path;
		var targetPhotoPath = dir + '/' + photoData.name;
		moveFile(uploadPhotoPath, targetPhotoPath);

		saveContestPhoto('vacation-photo', fields.email, req.params.year, req.param.month, targetPhotoPath);


		return gotoVacationPhoto(res, {
				type: 'success',
				intro: 'Good luck!',
				message: 'You have entered into the contest for ' + req.params.year + '/' + req.params.month,
			});

	});
});

//=========================================================
// FLASH
//=========================================================
app.get('/flash-messages', function(req, res){
	res.render('flash-messages')
});

app.post('/flash-messages', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields){
		if(err) return res.redirect(303, '/error');
		console.log('received fields:');
		console.log(fields);

		var flashObject = { type: 'success', intro:fields.intro, message: fields.message };

		if(fields.sendOption == "render") {
			console.log("Sending flash by render");
			// set flash message by render

			//- this following line is equivalent to passing the paramater to render

			/*
			 -- These two lines:
			res.locals.flash = flashObject;
			res.render('flash-messages');
			-- are equivalent to the following line:
			res.render('flash-messages', { flash: flashObject });

			*/
			res.render('flash-messages', { flash: flashObject });
		} else {
			console.log("Sending flash by redirect");
			// If we want to send the flash message via redirect we cannot use res.locals.
			// To accomplish that we have to se the req.session.flash and then rely on function
			// forwardFlash in meadowlark.js
			req.session.flash = flashObject;
			res.redirect(303, '/flash-messages');
		}
	});
});

//=========================================================
// EMAIL
//=========================================================
var nodemailer = require('nodemailer');
var mailAuth = {
	user: credentials.gmail.user,
	pass: credentials.gmail.password,
};
console.log(mailAuth);
var mailTransport = nodemailer.createTransport({
	service: 'Yahoo',
	auth: mailAuth,
});

app.get('/send-email', function(req, res){
	res.render('send-email')
});

app.post('/send-email', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields){
		if(err) return res.redirect(303, '/error');
		console.log('received fields:');
		console.log(fields);

		//-- send email now
		console.log("Sending email...")
		mailTransport.sendMail({
			from: '"1stEquation Services" <mart_family@yahoo.com>',
			to: fields.email,
			subject: fields.subject,
			text: fields.message,
		}, function(err, info){
			if(err) {
				console.error('Unable to send email: ' + err);
				res.render('send-email', { flash: { type: 'danger', message: "Email failed to send: " + err } });
			}
			else if (info) {
				res.render('send-email', { flash: { type: 'success', message: "Email sent: " + info.response } });
			}
			else {
				res.render('send-email', { flash: { type: 'warning', message: "Email sent with no info."} });
			}
		});
	});
});



//=========================================================
// FOO
//=========================================================

var fooValue = "(Empty)";
app.get('/foo', function(req, res){
	res.render('foo', { flash: { type: 'success', message: fooValue } })
});

app.post('/foo', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields){
		if(err) return res.redirect(303, '/error');
		console.log('received fields:');
		console.log(fields);

		fooValue = fields.foo;
		res.render('foo', { flash: { type: 'success', message: fooValue } })
	});
});

//=========================================================
// Mongoose: cars
//=========================================================

var mongoose = require('mongoose');
var opts = {
	server: {
		socketOption: { keepAlive: 1 }
	}
};
var mongoConnect;
console.log("Connecting MongoDB....");
switch(app.get('env')) {
	case 'development':
		mongoConnect = mongoose.connect(credentials.mongo.development.connectionString, opts);
		break;
	case 'production':
		mongoConnect = mongoose.connect(credentials.mongo.production.connectionString, opts);
		break;
	default:
		throw new Error('Unknown execution environment: ' + app.get('env'));
};
console.log("MongoConnect = ");
console.log(mongoConnect);

var CarModel = require('./models/cars.js');

//=========================================================
// Mongoose: vacation
//=========================================================

var Vacation = require('./models/vacation.js');
var VacationInSeasonListener = require('./models/vacationInSeasonListener.js');

app.get('/vacations', function (req, res) {
    Vacation.find({available: true}, function (err, vacations) {
        var context = {
            vacations: vacations.map(function (vacation) {
                return {
                    sku: vacation.sku,
                    name: vacation.name,
                    description: vacation.description,
                    price: vacation.getDisplayPrice(),
                    inSeason: vacation.inSeason,
                }
            })
        };
        res.render('vacations', context);
    });
});

app.get('/notify-me-when-in-season', function(req, res){
    res.render('notify-me-when-in-season', {sku: req.query.sku });
});

app.post('/notify-me-when-in-season', function(req, res) {
    VacationInSeasonListener.update(
        { email: req.body.email },
        { $push: { skus: req.body.sku }},
        { upsert: true },
        function(err) {
            if(err) {
                console.error(err.stack);
                req.session.flash = {
                    type: 'danger',
                    intro: 'Ooops',
                    message: 'There was an error processing your request.',
                };
                return res.redirect(303, '/vacations');
            }
            req.session.flash = {
                type: 'success',
                intro: 'Thank you',
                message: 'You will be notified when this vacation is in season.',
            };
            return res.redirect(303, '/vacations');
        }
    );
});

//=========================================================
// Random Routing
//=========================================================
function formatRandomOutput(req, prefix) {
	var output = '<h2>Random Output</h2>';
	output += '<h3>Keep pressing Refresh</h3>';
	output += '<p>' + prefix + ' route: ' + req.myRandom + '</p>';
	return output;
}
app.get('/random',
	function(req, res, next) {
		req.myRandom = Math.random();

		if(req.myRandom < 0.6666) {
			return next();
		}
		res.send(formatRandomOutput(req, 'large'));
	},
	function(req, res, next) {
		if(req.myRandom < 0.3333) {
			return next();
		}
		res.send(formatRandomOutput(req, 'middle'));
	},
	function(req, res) {
		res.send(formatRandomOutput(req, 'small'));
	}
);

//=========================================================
// Route parameters
//=========================================================
var employees =
{
	adam: { description: 'Lazy, but very skillful', fullName : 'Adam McJohn' },
	monica: { description: 'Body and brains', fullName : 'Monica Capelli' },
	natasha: { description: 'Stuck up snob', fullName : 'Natasha Davidenko' },
	mitch: { description: 'Very arrogant and obnoxious', fullName : 'Mitch Brown' },
	chris: { description: 'Hard working and disciplined', fullName : 'Christos Papadakis' },
};

function makeEmployeesParams() {
	var renderParams = { employees: [] };
	for(var employee in employees)
	{
		renderParams.employees.push({
			name: employee,
			fullName: employees[employee].fullName,
		});
	}
	return renderParams;
}

app.get('/staff', function (req, res) {
	var params = makeEmployeesParams();
	res.render('staff', params);
});

app.get('/staff/:name', function(req, res){
	var params = makeEmployeesParams();

	var employee = req.params.name;
	var employeeObject = req.params.name ? employees[employee] : null;
	if(employeeObject) {
		params.flash = {
			type: 'success',
			intro: employeeObject.fullName,
			message: employeeObject.description};
	}
	else {
		params.flash = { type: 'danger', message: 'No such employee'};
	}
	return res.render('staff', params);
});

//=========================================================
// Other stuff
//=========================================================
// custom 404 page
app.use(function(req,res, next){
    res.status(404);
    res.render('404');
});

// custom 500 page
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

//==========================================================
// Starting the server
//==========================================================
function startServer() {
	app.listen(app.get('port'), function () {
		console.log('Express started in ' + app.get('env') +
			' mode on http://localhost:' + app.get('port') + ';');
		console.log("_dirname: " + __dirname);
		console.log('press Ctrl-C to terminate.');
	});
}

if (require.main === module) {
	// Aplication is run directly. Starting the server.
	console.log('Aplication is run directly. Starting the server...');
	startServer();
}
else {
	// Application is imported via require, so the server will be run on demand from the host.
	// Export function to create server.
	console.log('Aplication is imported. Exporting startServer...');
	module.exports = startServer;
}
