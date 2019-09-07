var express = require("express"),
	router = express.Router({mergeParams: true}),
	Campground = require("../models/campgrounds"),
	Comment = require("../models/comments"),
	User = require("../models/users"),
	middleware = require("../middleware/index"),
	NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

router.get("/",function(req,res){

	var noMatch = null;
	if(req.query.search)
	{
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Campground.find({name: regex}, function(err, campground){
			if(err)
			{
				console.log(err);
			}
			else
			{	
				if(campground.length < 1)
				{
					noMatch = "No campgrounds match that query, please try again.";
				}
				res.render("Campgrounds/campgrs",{camps:campground, page:'campgrounds', noMatch: noMatch});
			}
		});
	}
	else
	{
		Campground.find({}, function(err, campground){
			if(err)
			{
				console.log(err);
			}
			else
			{
				res.render("Campgrounds/campgrs",{camps:campground, page:'campgrounds', noMatch: noMatch});
			}
	});
	}
});

router.get("/new", middleware.isLoggedIn, function(req,res){
	res.render("Campgrounds/new");
});

router.post("/", middleware.isLoggedIn, function(req,res){

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

router.get("/:id",function(req, res){
	
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

router.get("/:id/edit", middleware.ownership, function(req, res){
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

router.put("/:id", middleware.ownership, function(req, res){
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

router.delete("/:id", middleware.ownership, function(req, res){
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

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;