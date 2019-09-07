var express = require("express"),
	router = express.Router(),
	Campground = require("../models/campgrounds"),
	Comment = require("../models/comments"),
	User = require("../models/users"),
	passport = require("passport"),
	localStrategy = require("passport-local"),
	expressSession = require("express-session"),
	methodOverride = require("method-override"),
	flash = require("connect-flash");

router.get("/",function(req,res){
	res.render("landing");
});

router.get("/register", function(req, res){
	res.render("register", {page:'register'});
});

router.post("/register", function(req, res){
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

router.get("/login", function(req, res){
	res.render("login", {page:'login'});
});

router.post("/login", passport.authenticate("local", {
	successRedirect: "/campgrounds",
	failureredirect: "/login"
}), function(req, res){
});

router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Successfully logged out.")
	res.redirect("/campgrounds");
});

module.exports = router;

