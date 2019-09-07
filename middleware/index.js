var flash = require("connect-flash"),
	Campground = require("../models/campgrounds"),
	Comment = require("../models/comments");

var middleware = {};

middleware.isLoggedIn = function (req, res, next){
	if(req.isAuthenticated())
	{
		return next();
	}
	req.flash("error", "You must be logged in to do that.")
	res.redirect("/login");
}

middleware.ownership = function (req, res, next){
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

middleware.commentOwnership = function (req, res, next){
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

module.exports = middleware;