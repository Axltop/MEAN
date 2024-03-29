var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var auth = jwt({
	secret : 'SECRET',
	userProperty : 'payload'
})

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var passport = require('passport');
var User = mongoose.model('User');


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
/* GET home page. */
router.get('/posts', function(req,res,next){
	Post.find(function(err,posts){
		if(err){return next(err)}

		res.json(posts);
	})
})
router.post('/posts', auth, function(req,res,next){
	var post = new Post(req.body);
	post.author = req.payload.username;

	post.save(function(err,post){
		if(err){return next(err)};
		res.json(post);
	})
})
router.param('post',function(req,res,next,id){
	var query = Post.findById(id);
	query.exec(function(err,post){
		if(err){return next(err)};
		if(!post){return next(new Error('Cant find post'));};
		req.post=post;
		return next();
	})
})
router.get('/posts/:post', function(req,res){
	req.post.populate('comments',function(err,post){
		if (err) { return next(err);}
		res.json.post;
	})
})

router.put('/posts/:post/upvote', auth, function(req,res,next){
	req.post.upvote(function(err,post){
		if (err) {return next(err)};
		res.json(post);
	})
})

router.post('/posts/:post/comments', auth, function(req,res,next){
	var comment = new Comment(req.body);
	comment.post = req.post;
	comment.author = req.payload.username;

	comment.save(function(err,comment){
		if (err) {
			return next(err);
		}
		req.post.comments.push(comment);
		req.post.save(function(err,post){
			if (err) {return next(err);}
			res.json(comment);
		})
	})
})
router.param('comment',function(req, res, next, id){
	var query = Comment.findById(id);
	query.exec(function(err,comment){
		if(err){return next(err)};
		if(!comment){return next(new Error('Cant find comment'));};
		req.post.comments=comment;
		return next();
	})
})

router.put('/post/:post/comments/:comment/upvote', auth, function(req,res,next){
	req.post.comment.upvote(function(err,comment){
		if (err) {return next(err)};
		res.json(comment);
	})
})

router.post("/register", function(req, res, next){
	if (!req.body.username || !req.body.password) {
		return res.status(400).json({messge : 'Please fill the required fields'});
	}
	var user = new User();

	user.username = req.body.username;
	user.setPassword (req.body.password);

	user.save(function(err){
		if (!err) { return next(err);};
		return res.json({token : user.generateJWT})
	})
})

router.post('/login',function(req, res, next){
	if (!req.body.username || !req.body.password) {
		res.status(400).json({message : 'Please fill the required inputs'});
	}

	passport.authenticate('local', function(err,user,info){
		if (!err) { return next(err);};

		if (user) {
			return res.json({token : user.generateJWT})
		} else {
			res.status(401).json(info);	
		}

	})(res,res, next);
})


module.exports = router;
