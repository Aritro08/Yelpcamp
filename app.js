var express = require("express"),
	app = express(),
	bodyParser= require("body-parser"),
	mongoose = require("mongoose"),
	seedDB = require("./seed"),
	passport = require("passport"),
	localStrategy = require("passport-local"),
	expressSession = require("express-session"),
	methodOverride = require("method-override"),
	flash = require("connect-flash"),
	Campground = require("./models/campgrounds"),
	Comment = require("./models/comments"),
	User = require("./models/users");


// seedDB();
mongoose.connect("mongodb://localhost:27017/yelpCamp", {useNewUrlParser:true});
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(expressSession({
	secret: "qwerty",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
	next();
});

var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

app.get("/",function(req,res){
	res.render("landing");
});

app.get("/campgrounds",function(req,res){

	Campground.find({}, function(err, campground)
	{
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("Campgrounds/campgrs",{camps:campground, page:'campgrounds'});
		}
	});
});

app.get("/campgrounds/new", isLoggedIn, function(req,res){
	res.render("Campgrounds/new");
});

app.post("/campgrounds", isLoggedIn, function(req,res){

	var name = req.body.Name;
	var image = req.body.Img;
	var price = req.body.price;
	var description = req.body.desc;
	var author = {
		id: req.user._id,
		username: req.user.username
	}
	geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', err.message);
      return res.redirect('back');
    };
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
	var newcamp = {
		name: name,
		price: price,
		image: image,
		description: description,
		author: author,
		location: location,
		lat: lat,
		lng: lng
	}
	Campground.create(newcamp, function(err,campground){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.redirect("/campgrounds");
		}
	})});
});

app.get("/campgrounds/:id",function(req, res){
	
	var id = req.params.id;
	Campground.findById(id).populate("comments").exec( function(err, campground){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("Campgrounds/show",{campground:campground});
		}
	});
});

app.get("/campgrounds/:id/comments/new", isLoggedIn, function(req, res){

	Campground.findById(req.params.id, function(err, campground){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("Comments/new", {campground:campground});
		}
	});
});

app.post("/campgrounds/:id/comments", isLoggedIn, function(req, res){

	Campground.findById(req.params.id, function(err, campground){
		if(err)
		{
			console.log(err);
		}
		else
		{
			Comment.create(req.body.comment, function(err, comment){
				if(err)
				{
					console.log(err);
				}
				else
				{
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					comment.save();
					campground.comments.push(comment);
					campground.save();
					res.redirect("/campgrounds/" + campground._id);
				}
			});
		}
	});
});

app.get("/campgrounds/:id/comments/:comment_id/edit", commentOwnership, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err)
		{
			console.log(err);
		}
		else
		{
			Comment.findById(req.params.comment_id, function(err, comment){
				if(err)
				{
					console.log(err);
				}
				else
				{
					res.render("Comments/edit", {campground: campground, comment: comment});
				}
			});
		}
	});
});

app.put("/campgrounds/:id/comments/:comment_id", commentOwnership, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, comment){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

app.delete("/campgrounds/:id/comments/:comment_id", commentOwnership, function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

app.get("/register", function(req, res){
	res.render("register", {page:'register'});
});

app.post("/register", function(req, res){
	var newUser = new User({username : req.body.username});
	User.register(newUser, req.body.password, function(err, user){
		if(err)
		{
			console.log(err);
			res.render("register", {error: err.message});
		}
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome to YelpCamp " + user.username + " !");
			res.redirect("/campgrounds");
		})
	});
});

app.get("/login", function(req, res){
	res.render("login", {page:'login'});
});

app.post("/login", passport.authenticate("local", {
	successRedirect: "/campgrounds",
	failureredirect: "/login"
}), function(req, res){
});

app.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Successfully logged out.")
	res.redirect("/campgrounds");
});

app.get("/campgrounds/:id/edit", ownership, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("Campgrounds/edit", { campground: campground});
		}
	});
});

app.put("/campgrounds/:id", ownership, function(req, res){
	geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err,campground){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.redirect("/campgrounds/" + campground._id);
		}
	});
	});
});

app.delete("/campgrounds/:id", ownership, function(req, res){
	Campground.findByIdAndRemove(req.params.id, function(err){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.redirect("/campgrounds");
		}
	});
});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated())
	{
		return next();
	}
	req.flash("error", "You must be logged in to do that.")
	res.redirect("/login");
}

function ownership(req, res, next){
	if(req.isAuthenticated())
	{
		Campground.findById(req.params.id, function(err, campground){
			if(err)
			{
				console.log(err)
			}
			else
			{
				if(campground.author.id.equals(req.user._id))
				{
					next();
				}
				else
				{
					res.redirect("back");
				}
			}
		});
	}
}

function commentOwnership(req, res, next){
	if(req.isAuthenticated())
	{
		Comment.findById(req.params.comment_id, function(err, comment){
			if(err)
			{
				console.log(err)
			}
			else
			{
				if(comment.author.id.equals(req.user._id))
				{
					next();
				}
				else
				{
					res.redirect("back");
				}
			}
		});
	}
}

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});

