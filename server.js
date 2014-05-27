//server.js

var express 	= require('express');
var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);
var mongoose 	= require('mongoose');
var passport	= require('passport')
  , LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var ObjectId = require('mongoose').Types.ObjectId; 

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (user.password != password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// Conexión con la base de datos
//mongoose.connect('mongodb://localhost:27017/angular-todo');
mongoose.connect('mongodb://eduardobenito10:1234@ds061938.mongolab.com:61938/angular-todo');

// Definición de modelos
var Todo = mongoose.model('Todo', {
	text: String,
	author: String,
	priority: String,
	color: String,
	order: Number,
	completed: Boolean
});

var User = mongoose.model('User', {
	username: String,
	password: String
});

// Configuración
app.configure(function() {
	app.use(express.static(__dirname + '/public'));		// Localización de los ficheros estáticos
	app.use(express.logger('dev'));						// Muestra un log de todos los request en la consola
	app.use(express.bodyParser());						// Permite cambiar el HTML con el método POST
	app.use(express.methodOverride());					// Simula DELETE y PUT
	app.use( express.cookieParser() );
	app.use(express.session({secret:'thisismysupersecret'}));
	// Initialize Passport!  Also use passport.session() middleware, to support
	// persistent login sessions (recommended).
	app.use(flash());
	app.use(passport.initialize());
	app.use(passport.session());
	app.use('/node_modules', 
		express.static(__dirname  + '/node_modules'));
});

// Autenticacion con Passport
app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
								   failureFlash: true })
);

// Rutas de nuestro API
app.get('/api/todos', function(req, res) {				// GET de todos los TODOs
	Todo.find({},{},{sort:{
        order: 1 //Sort by order
    }},function(err, todos) {
		if(err) {
			res.send(err);
		}
		res.json(todos);
	});
});

app.post('/api/todos', function(req, res) {				// POST que crea un TODO y devuelve todos tras la creación
	Todo.count({}, function( err, count){
		Todo.create({
			text: req.body.text,
			color: req.body.color,
			order: count,
			priority: req.body.priority,
			completed: false
		}, function(err, todo){
			if(err) {
				res.send(err);
			}
			Todo.find({},{},{sort:{
				order: 1 //Sort by order
			}},function(err, todos) {
				if(err){
					res.send(err);
				}
				res.json(todos);
			});
		});
	});
});

app.put('/api/todos/:todo', function(req, res) {		// EDITA un TODO específico.
		Todo.update({_id: new ObjectId(req.params.todo)}, req.body, {'multi':true}, function(err, todo) {
        if(err){
            res.send(err);
        }

		Todo.find({},{},{sort:{
            order: 1 //Sort by order
        }},function(err, todos) {
			if(err){
				res.send(err);
			}
			res.json(todos);
		});

	})
});

app.delete('/api/todos/:todo', function(req, res) {		// DELETE un TODO específico y devuelve todos tras borrarlo.
	Todo.remove({
		_id: req.params.todo
	}, function(err, todo) {
		if(err){
			res.send(err);
		}

		Todo.find({},{},{sort:{
            order: 1 //Sort by order
        }},function(err, todos) {
			if(err){
				res.send(err);
			}
			res.json(todos);
		});

	})
});

app.get('/', function(req, res) {						// Carga una vista HTML simple donde irá nuesta Single App Page
	res.sendFile('./public/index.html', { user: req.user });				// Angular Manejará el Frontend
});

//app.get('/', function(req, res){
  //res.render('index', { user: req.user });
//});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/name', function(req, res){
  res.json({
    name: 'Bob'
  });
});

// Socket.io Communication
var conectados = 0;
io.sockets.on('connection', function (socket) {
  conectados++;
  socket.emit('hello', { 'conectados': conectados });
  socket.on('nuevo', function (data) {
	io.sockets.emit('message', data.message );
  });

});

// Escucha y corre el server
server.listen(3000, function() {
	console.log('App listening on port 3000');
})
