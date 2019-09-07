var express = require("express"),
	router = express.Router({mergeParams: true}),
	Campground = require("../models/campgrounds"),
	Comment = require("../models/comments"),
	middleware = require("../middleware/index"),
	User = require("../models/users");

router.get("/new", middleware.isLoggedIn, function(req, res){

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

router.post("/", middleware.isLoggedIn, function(req, res){

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

router.get("/:comment_id/edit", middleware.commentOwnership, function(req, res){
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

router.put("/:comment_id", middleware.commentOwnership, function(req, res){
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

router.delete("/:comment_id", middleware.commentOwnership, function(req, res){
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

module.exports = router;