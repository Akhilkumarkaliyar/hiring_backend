var express = require('express');
var mysql = require('mysql');
var app = express();
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var { check, validationResult } = require('express-validator/check');
var session = require('express-session');
var mailer = require('express-mailer');

var request = require('request');
var isset = require('isset');
var qs = require('querystring');
var checksum_lib = require('./checksum/checksum.js');
var Nexmo = require('nexmo');
var https = require('https');
var nexmo = new Nexmo({
  apiKey: '022e9d62',
  apiSecret: 'co9vf5xn6c2gKxTz',
});

var today = new Date();

app.use(express.static('public'));
app.listen(5000, function () {
	console.log("Server is running on port " + 5000);
});
mailer.extend(app, {
	from: 'no-reply@galdermamiddleast.com',
	host: 'in-v3.mailjet.com', // hostname
	secureConnection: false, // use SSL
	port: 587, // port for secure SMTP
	transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
	auth: {
		user: '5cf69fab2a134d73fd33e9b1d25708b7',
		pass: 'db308f5ace974b5d4a2d009700aaf1f7'
	}
});
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: { maxAge: 60000 }
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
	if (req.headers.origin) {
		res.header('Access-Control-Allow-Origin', '*')
		res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization')
		res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE')
		if (req.method === 'OPTIONS') return res.send(200)
	}
	next()
});
var multer = require('multer');
var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'public/images');
	},
	filename: (req, file, cb) => {
		console.log(file);
		var filetype = '';
		if (file.mimetype === 'image/gif') {
			filetype = 'gif';
		}
		if (file.mimetype === 'image/png') {
			filetype = 'png';
		}
		if (file.mimetype === 'image/jpeg') {
			filetype = 'jpg';
		}
		cb(null, 'image-' + Date.now() + '.' + filetype);
	}
});
var upload = multer({ storage: storage });
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
//********Database Parameter************//
var connection = mysql.createConnection({
	//properties
	host: 'localhost',
	user: 'artist',
	password: 'root@2019',
	database: 'artist',
	port: '3306'
});
//********Database Parameter************//
//********Database Connection************//
connection.connect(function (error) {
	if (!!error) {
		console.log('errorss');
	} else {
		console.log('connected');
	}
});
connection.on('error', function (err) {
	console.log('db error', err);
	if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
		//handleDisconnect();                         // lost due to either server restart, or a
	} else {                                      // connnection idle timeout (the wait_timeout
		throw err;                                  // server variable configures this)
	}
});
app.get('/sendmail', function (req, res, next) {
	app.mailer.send('email', {
		to: 'akhil.kaliyar1992@gmail.com', // REQUIRED. This can be a comma delimited string just like a normal email to field. 
		subject: 'Set Your Password', // REQUIRED.
		otherProperty: 'Link to forgot your password http://localhost:4200/appuser', // All additional properties are also passed to the template as local variables.
	}, function (err) {
		if (err) {
			// handle error
			console.log(err);
			res.send('There was an error sending the email');
			return;
		}
		res.send('Email Sent');
	});
});
//************forgot password**************//
app.post('/forgot', function (req, res) {
	var email = req.body.email;
	connection.query("select * from h_users where email = ?", [email], function (error, result, fields) {
		if (!!error) {
			console.log('error in query ');
			res.send({
				"status": '2',
				"message": "Error in Query"
			});
		} else {
			numRows = result.length;
			userid = result[0].id;
			//console.log(userid);return;
			if (numRows > 0) {
				app.mailer.send('email', {
					//to: 'akhil.kaliyar1992@gmail.com', // REQUIRED. This can be a comma delimited string just like a normal email to field. 
					to: email, // REQUIRED. This can be a comma delimited string just like a normal email to field. 
					subject: 'Forgot Password', // REQUIRED.
					otherProperty: "Link to forgot your password http://localhost:4200/forgot/" + userid // All additional properties are also passed to the template as local variables.
				}, function (err) {
					if (err) {
						// handle error
						console.log(err);
						res.send({
							"message": "There was an error sending the email",
							"status": '2',
						});
						return;
					}
					res.send({
						"message": "email send sucuessfully on register email",
						"status": '1',
					});
				});

			} else {
				res.send({
					"message": "user doesn't exit in our record",
					"status": '3',
				});
			}
		}
	});
});
//************forgot password**************//

//********Database Connection************//
app.post('/upload', upload.single('file'), function (req, res, next) {
	console.log(req.file);
	if (!req.file) {
		res.status(500);
		return next(err);
	}
	res.json({ fileUrl: req.file.path });
})
//********All User List************//
app.get('/alldata' ,function(req, res){
	
	connection.query("select * from h_users where id !=?",1,function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				});
        } else {
			var info ={};
			info['userinfo']=result;
			res.send({
				  "message":"User List",
				  "status":'1',
				  "data":info
				});
        } 
    });
});
//********All User List************//
//********All User Detail************//
app.post('/alldatabyuser' ,function(req, res){
	var id= req.body.id;
    connection.query("select * from h_users where id = ?" ,[id] ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "status":'2',
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				var userinfobyid={};
				userinfobyid['userinfo']=result[0];
				res.send({
				  "message":"User Detail",
				  "status":'1',
				  "data":userinfobyid
				});
			}else{
				res.send({
				  "message":"User Detail",
				  "status":'2',
				});
			}
		} 
    });
});
//********All User Detail************//
//********User Register ************//
app.post('/register', function(req, res){
	var today = new Date();
	var saltRounds = 10;
	var email=req.body.email;
	var usertype=req.body.usertype;
	var mobile=req.body.mobile;
	var otp=req.body.otp;
	var sql ="select * from h_users where mobile='"+mobile+"' ";
	connection.query(sql,function(error, result , fields){
		if(!!error){
			res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				});
		} else {
			var numRows =result.length;
			if(numRows < 0){
			var sql ="select * from h_user_otp where otp ='"+otp+"' and mobile='"+mobile+"' ";
			connection.query(sql,function(error, result , fields){
				if(!!error){
					res.send({
						  "message":"Something Went wrong!",
						  "status":'2',
						});
				} else {
						var numRows =result.length;
						if(numRows > 0){
								bcrypt.hash(req.body.password, saltRounds, function (err,hash) {
									if(usertype==2){
											var users={
											"user_name":req.body.user_name,
											"token":req.body.token,
											"email":email,
											"password":hash,
											"usertype":usertype,
											"is_complete":0,
											"location":req.body.location,
											"mobile":mobile,
											"description":req.body.description,
											"otp":otp,
											"created_date":today,
											"modified_date":today,
										}
									}else{
											var users={
											"user_name":req.body.user_name,
											"token":req.body.token,
											"email":email,
											"otp":otp,
											"mobile":mobile,
											"password":hash,
											"usertype":usertype,
											"is_complete":1,
											"location":'',
											"description":'',
											"created_date":today,
											"modified_date":today,
										}
									}
									
									connection.query("select * from h_users where email = ?" ,[email], function (error, result, fields) 
									{
										if (error) 
										{
											res.send({
											  "status":'3',
											  "failed":"Something went wrong!!!"
											})
										}else
										{
											numRows = result.length;
											if(numRows > 0)
											{
												res.send({
												  "status":'4',
												  "message":"User already Exit"
												});	
											}else 
											{
												connection.query('INSERT INTO h_users SET ?',users, function (error, result, fields) 
												{
													if (error) {
														res.send({
														  "status":'3',
														  "failed":"Something went wrong!!!"
														})
													}else{
														numRows = result.affectedRows;
														if(numRows > 0)
														{
															
															connection.query("select * from h_users where email = ?" ,[email] ,function(error, results , fields){
																if(!!error){
																	console.log('error in query ');
																	res.send({
																		  "status":'3',
																		  "message":"Error in Query"
																		});
																} else {
																	userid = results[0].id;
																	var inforeg={};
																	inforeg['userinfo']=results[0];
																	res.send({
																	  "status":"1",
																	  "message":"User Register Sucessfully",
																	  "data":inforeg
																	});
																}
															});
														}else{
															res.send({
															  "status":'2',
															  "message":"User not added sucessfully"
															});
														}
													}
												});
											}
										}
									});
								});
							}else{
								res.send({
								  "message":"Unverified user",
								  "status":'2',
								});
							}
							
						} 
					});
			} else{
				res.send({
				  "message":"This number is already registered with us, please log in",
				  "status":'2',
				});
			}
		}
	});
});
app.post('/changeusertype', function(req, res){
	var today = new Date();
	var id =req.body.userid;
	var users={
			"usertype":2,
			"is_complete":0
	}
	connection.query("update h_users set where id = ?" ,[users],[id], function (error, result, fields) 
	{
		if (error) 
		{
			res.send({
			  "status":'3',
			  "failed":"Something went wrong!!!"
			})
		}else
		{
			numRows = result.length;
			if(numRows > 0)
			{
				connection.query('INSERT INTO h_users SET ?',users, function (error, result, fields) 
				{
					if (error) {
						res.send({
						  "status":'3',
						  "failed":"Something went wrong!!!"
						})
					}else{
						numRows = result.affectedRows;
						if(numRows > 0)
						{
							
							connection.query("select * from h_users where id = ?" ,[id] ,function(error, results , fields){
								if(!!error){
									console.log('error in query ');
									res.send({
										  "status":'3',
										  "message":"Error in Query"
										});
								} else {
									var email = results[0].email;
									app.mailer.send('email', {
										//to: 'akhil.kaliyar1992@gmail.com', // REQUIRED. This can be a comma delimited string just like a normal email to field. 
										to: email, // REQUIRED. This can be a comma delimited string just like a normal email to field. 
										subject: 'Forgot Password', // REQUIRED.
										otherProperty: "Link to forgot your password http://localhost:4200/forgot/"+userid // All additional properties are also passed to the template as local variables.
									}, function (err) {
										if (err) {
										  // handle error
										  console.log(err);
										  res.send({
											  "message":"There was an error sending the email",
											  "status":'2',
											});
											return;
										}
										var changeinfo={};
										changeinfo['userinfo']=results;
										res.send({
										  "status":"1",
										  "message":"Usertype updated Sucessfully",
										  "data":changeinfo
										});
									});
								}
							});
						}else{
							res.send({
							  "status":'2',
							  "message":"Usertype not updated sucessfully"
							});
						}
					}
				});	
			}else 
			{
				res.send({
				  "status":'2',
				  "message":"Usertype not updated sucessfully"
				});
			}
		}
	});
});
app.post('/login', function(req, res){
	var ranstr = Math.random().toString(36).replace('0.', '') ;
	var email= req.body.email;
	var token= req.body.token;
	var password = req.body.password;
	connection.query('SELECT * FROM h_users WHERE email = ? ',[email], function (error, results, fields)
	{
		if (error) 
		{
			res.send({
				"status":'3',
				"failed":"error ocurred"
			})
		}else
		{
			if(results.length >0)
			{
				bcrypt.compare(password, results[0].password, function (err, result) 
				{
					connection.query('update h_users set token =? WHERE email = ?',[token,email], function (error, result, fields)
					{
						var sess = req.session;  //initialize session variable
						req.session.userId = results[0].id; //set user id
						req.session.email = results[0].email;//set user name
						ssn = req.session;
					});
					if(result == true){
						connection.query('SELECT * FROM h_users WHERE email = ?',[email], function (error, resu, fields)
						{
							if (error) 
							{
								res.send({
									"status":'3',
									"failed":"error ocurred"
								})
							}else
							{
								userinfo={};
								userinfo['userdata']=resu[0];
								res.send({
									"status":'1',
									"message":"login sucessful",
									"data":userinfo
								});
							}
						});
					}
					else{
						res.send({
							"status":'0',
							"message":"Email or password does not match"
						});
					}
				});
			}
			else{
				res.send({
					"status":'0',
					"message":"Email does not exits"
				});
			}
		}
	});
});
//********Edit Register ************//
app.post('/updateprofile',upload.single('image'),function(req, res, next){ 
	var today = new Date();
	var id = req.body.id;
	if(req.file ==undefined){
		var users={
			"user_name":req.body.user_name,
			"description":req.body.description,
			"modified_date":today
		}
	}else{
		var users={
			"user_name":req.body.user_name,
			"description":req.body.description,
			"image":req.file.filename,
			"img_path":req.file.path,
			"modified_date":today,
		}
	}
	connection.query('update h_users SET ? where id = ?',[users,id],function (error, result, fields) {
		if (error) {
			res.send({
			  "status":'2',
			  "failed":"error ocurred"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				var sql="select * from h_users where id ='"+id+"'";
				connection.query(sql,function (error, results, fields) {
					if (error) {
						res.send({
						  "status":'2',
						  "failed":"error ocurred"
						})
					}else{
						numRows = result.length;
						if(numRows > 0)
						{
							res.send({
							  "status":'1',
							  "message":"User added sucessfully",
							  "data":results,
							});
						}
					}
				});
					
			}else{
				res.send({
				  "status":'2',
				  "message":"User not added sucessfully"
				});
			}
				
		}
	});
});
//********Edit Register************//
//////*************************Category***************/////////////////
app.get('/category' ,function(req, res){
	connection.query("select * from h_category where is_deleted = ?",0,function(error, result , fields){
		if(!!error){
			res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				});
		} else {
			var catinfo={};
			catinfo['category']=result;
			res.send({
				  "message":"Category List",
				  "status":'1',
				  "data":catinfo,
				});
		} 
	});
});
app.post('/categoryid' ,function(req, res){
	var id= req.body.id;
    connection.query("select * from h_category where id = ?" ,[id] ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "status":'2',
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				var catinfoid={};
				catinfoid['category']=result;
				res.send({
				  "message":"Category Detail",
				  "status":'1',
				  "data":catinfoid
				});
			}else{
				res.send({
				  "message":"No Category Detail Found!!",
				  "status":'2',
				});
			}
		} 
    });
});
app.post('/createcategory',upload.single('image'),function(req, res, next){ 
	//console.log(req.file);return;
	var category={
			"name":req.body.name,
			"popular":req.body.popular,
			"image":req.file.filename,
			"img_path":req.file.path,
			"created_date":today,
			"modified_date":today,
			"status":1,
		}
		connection.query('INSERT INTO h_category SET ?',category, function (error, result, fields) {
		console.log(error);
		if (error) {
			res.send({
			  "status":'2',
			  "failed":"error ocurred"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":'1',
				  "message":"Category added sucessfully"
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"Category not added sucessfully"
				});
			}
			
		}
	});
});
app.post('/updatecategory',upload.single('image'),function(req, res, next){ 
	//console.log(req.file);return;
	if(req.file ==undefined){
		var category={
			"name":req.body.name,
			"popular":req.body.popular,
			"modified_date":today
		}
	}else{
		var category={
			"name":req.body.name,
			"popular":req.body.popular,
			"image":req.file.filename,
			"img_path":req.file.path,
			"modified_date":today
		}
	}
	
		var id = req.body.id;
		connection.query('Update h_category  SET ? where id =?',[category,id], function (error, result, fields) {
		console.log(error);
		if (error) {
			res.send({
			  "status":'3',
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":'1',
				  "message":"Category updated sucessfully"
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"Category not updated sucessfully"
				});
			}
			
		}
	});
});
app.post('/deletecategory', function(req, res){ 
		
		var id = req.body.id;
		connection.query("Update h_category  SET 	is_deleted='1' where id =?",[id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":'3',
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				connection.query("select * from h_category where is_deleted = ?",0,function(error, result , fields){
					if(!!error){
						res.send({
							  "message":"Something Went wrong!",
							  "status":'3',
							  "data":result
							});
					} else {
						var dinfo={};
						dinfo['category']=result;
						res.send({
							  "message":"Category List updated Sucessfully",
							  "status":'1',
							  "data":dinfo
							});
					} 
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"Category not deleted sucessfully"
				});
			}
			
		}
	});
});
//////*************************Category***************/////////////////
//////*************************Post***************/////////////////
app.get('/post' ,function(req, res){
    var sql ="SELECT p.*,c.name as catname,u.user_name as username FROM  h_post as p JOIN h_users as u ON u.id= p.userid JOIN h_category as c ON p.category= c.id where p.is_deleted = 0";
	connection.query(sql,function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				  "data":result
				});
        } else {
			var postinfo = {};
			postinfo['postinfo']=result;
            res.send({
				  "message":"Post List",
				  "status":'1',
				  "data":postinfo
				});
        } 
    });
});
app.post('/postid' ,function(req, res){
	var id= req.body.id;
    connection.query("select * from h_post where id = ?" ,[id] ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "status":'2',
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				var postinfoid = {};
				postinfoid['postinfoid']=result;
				res.send({
				  "message":"Post Detail",
				  "status":'1',
				  "data":postinfoid
				});
			}else{
				res.send({
				  "message":"Post Detail",
				  "status":'2',
				});
			}
		} 
    });
});
app.post('/createpost',upload.single('image'),function(req, res, next){ 
	//console.log(req.file);return;
	var userid = req.body.userid;
	var blog={
		"userid":userid,
		"title":req.body.title,
		"budget":req.body.budget,
		"team":req.body.team,
		"url":req.body.url,
		"category":req.body.category,
		"description":req.body.description,
		"duration":req.body.duration,
		"slot":req.body.slot,
		"created_date":today,
		"modified_date":today,
		"status":1,
	}
	var user ={
		"is_complete":1,
	}
		connection.query('INSERT INTO h_post SET ?',blog, function (error, result, fields) {
		if (error) {
			res.send({
			  "status":'2',
			  "failed":"error ocurred"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				connection.query('Update h_users  SET ? where id =?',[user,userid], function (error, result, fields) {
					if (error) {
						res.send({
						  "status":'3',
						  "failed":"Something went wrong!!"
						})
					}else{
						res.send({
						  "status":'1',
						  "message":"Post added sucessfully"
						});
					}
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"Post not added sucessfully"
				});
			}
			
		}
	});
});
app.post('/updatepost',upload.single('image'),function(req, res, next){ 
	//console.log(req.file);return;
	var blog={
			"title":req.body.title,
			"budget":req.body.budget,
			"team":req.body.team,
			"url":req.body.url,
			"category":req.body.category,
			"description":req.body.description,
			"duration":req.body.duration,
			"slot":req.body.slot,
			"modified_date":today,
			"status":1,
		}
	
	
		//console.log(slug);return;
		var id = req.body.postid;
		connection.query('Update h_post  SET ? where id =?',[blog,id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":'3',
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":'1',
				  "message":"Post updated sucessfully"
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"Post not updated sucessfully"
				});
			}
			
		}
	});
});
app.post('/postvideo' ,function(req, res){
	var post_id= req.body.request_id;
	var sql ="SELECT * FROM h_video_id where requestid ='"+post_id+"'";
    connection.query(sql,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "status":'2',
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "message":"Post video Detail",
				  "status":'1',
				  "data":result
				});
			}else{
				res.send({
				  "message":"No post video Detail",
				  "status":'2',
				});
			}
		} 
    });
});

app.post('/deletepost', function (req, res) {

	var id = req.body.id;
	connection.query("Update h_post  SET 	is_deleted='1' where id =?", [id], function (error, result, fields) {
		if (error) {
			res.send({
				"status": '3',
				"failed": "Something went wrong!!"
			})
		} else {
			numRows = result.affectedRows;
			if (numRows > 0) {
				connection.query("select * from h_post where is_deleted = ?", 0, function (error, result, fields) {
					if (!!error) {
						var postinfo = {};
						postinfo['postinfo'] = result;
						res.send({
							"message": "Something Went wrong!",
							"status": '3',
							"data": postinfo
						});
					} else {
						res.send({
							"message": "Post List updated Sucessfully",
							"status": '1',
						});
					}
				});
			} else {
				res.send({
					"status": '2',
					"message": "Post not deleted sucessfully"
				});
			}

		}
	});
});
//////*************************Post***************/////////////////
//////*************************Social Post***************/////////////////
app.get('/socialpost' ,function(req, res){
    var sql ="SELECT p.*,u.user_name as username FROM  h_user_post as p JOIN h_users as u ON u.id= p.user_id";
	connection.query(sql,function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				  "data":result
				});
        } else {
			var socialpostinfo = {};
			socialpostinfo['socialpostinfo']=result;
            res.send({
				  "message":"Post List",
				  "status":'1',
				  "data":socialpostinfo
				});
        } 
    });
});
app.post('/socialpostid' ,function(req, res){
	var id= req.body.id;
    connection.query("select * from h_post where id = ?" ,[id] ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "status":'2',
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				var postinfoid = {};
				postinfoid['postinfoid']=result;
				res.send({
				  "message":"Post Detail",
				  "status":'1',
				  "data":postinfoid
				});
			}else{
				res.send({
				  "message":"Post Detail",
				  "status":'2',
				});
			}
		} 
    });
});
app.post('/createsocialpost',upload.single('image'),function(req, res, next){ 
	//console.log(req.file);return;
	var userid = req.body.userid;
	var blog={
		"userid":userid,
		"title":req.body.title,
		"budget":req.body.budget,
		"team":req.body.team,
		"url":req.body.url,
		"category":req.body.category,
		"description":req.body.description,
		"duration":req.body.duration,
		"created_date":today,
		"modified_date":today,
		"status":1,
	}
	var user ={
		"is_complete":1,
	}
		connection.query('INSERT INTO h_post SET ?',blog, function (error, result, fields) {
		if (error) {
			res.send({
			  "status":'2',
			  "failed":"error ocurred"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				connection.query('Update h_users  SET ? where id =?',[user,userid], function (error, result, fields) {
					if (error) {
						res.send({
						  "status":'3',
						  "failed":"Something went wrong!!"
						})
					}else{
						res.send({
						  "status":'1',
						  "message":"Post added sucessfully"
						});
					}
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"Post not added sucessfully"
				});
			}
			
		}
	});
});
app.post('/updatesocialpost',upload.single('image'),function(req, res, next){ 
	//console.log(req.file);return;
	var blog={
			"title":req.body.title,
			"budget":req.body.budget,
			"team":req.body.team,
			"url":req.body.url,
			"category":req.body.category,
			"description":req.body.description,
			"duration":req.body.duration,
			"modified_date":today,
			"status":1,
		}
	
	
		//console.log(slug);return;
		var id = req.body.postid;
		connection.query('Update h_post  SET ? where id =?',[blog,id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":'3',
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":'1',
				  "message":"Post updated sucessfully"
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"Post not updated sucessfully"
				});
			}
			
		}
	});
});
//////*************************Social Post***************/////////////////
//////*************************Booking***************/////////////////
app.post('/booking' ,function(req, res){
	var userid = req.body.userid;
	var sql ="SELECT b.*,u.user_name as ufname,a.token,a.user_name as afname FROM  h_booking as b JOIN h_users as u ON u.id= b.userid JOIN h_users as a ON a.id= b.artistid where b.artistid='"+userid+"' || b.userid='"+userid+"'";
	connection.query(sql,function(error, result , fields){
		if(!!error){
			
			res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				});
		} else {
			var bookinginfo = {};
			bookinginfo['bookinginfo']=result;
			res.send({
				  "message":"Booking List",
				  "status":'1',
				   "data":bookinginfo
				});
		} 
	});
});
app.get('/allbooking' ,function(req, res){
	var sql ="SELECT b.*,u.user_name as ufname,a.user_name as afname FROM  h_booking as b JOIN h_users as u ON u.id= b.userid JOIN h_users as a ON a.id= b.artistid";
	connection.query(sql,function(error, result , fields){
		if(!!error){
			
			res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				});
		} else {
			var bookinginfo = {};
			bookinginfo['bookinginfo']=result;
			res.send({
				  "message":"Booking List",
				  "status":'1',
				   "data":bookinginfo
				});
		} 
	});
});
app.get('/follow' ,function(req, res){
	var sql ="SELECT b.*,u.user_name as ufname,a.user_name as afname FROM  h_follow as b JOIN h_users as u ON u.id= b.user_id JOIN h_users as a ON a.id= b.artist_id";
	connection.query(sql,function(error, result , fields){
		if(!!error){
			
			res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				});
		} else {
			var followinfo = {};
			followinfo['followinfo']=result;
			res.send({
				  "message":"Booking List",
				  "status":'1',
				   "data":followinfo
				});
		} 
	});
});
app.get('/payment' ,function(req, res){
	var sql ="SELECT b.*,u.user_name as ufname,a.user_name as afname FROM  h_booking as b JOIN h_users as u ON u.id= b.userid JOIN h_users as a ON a.id= b.artistid";
	connection.query(sql,function(error, result , fields){
		if(!!error){
			
			res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				});
		} else {
			var bookinginfo = {};
			bookinginfo['bookinginfo']=result;
			res.send({
				  "message":"Booking List",
				  "status":'1',
				   "data":bookinginfo
				});
		} 
	});
});
app.post('/createbooking',function(req, res){ 
		
		var postid =req.body.postid;
		connection.query('select * from h_post where id = ?',postid, function (error, result, fields) {
		if (error) {
			res.send({
			  "status":'2',
			  "failed":"error ocurred"
			})
		}else{
				var artistid= result[0].userid
				var booking={
					"postid":postid,
					"userid":req.body.userid,
					"city":req.body.city,
					"artistid":artistid,
					"date":req.body.date,
					"slot":req.body.slot,
					"venue":req.body.venue,
					"price":result[0].budget,
					"categoryid":result[0].category,
					"created_date":today,
					"is_done":0,
					"status":4,
				}
				connection.query('INSERT INTO h_booking SET ?',booking, function (error, result, fields) {
				//console.log(error);return false;
				if (error) {
					res.send({
					  "status":'2',
					  "failed":"error ocurred"
					})
				}else{
					numRows = result.affectedRows;
					if(numRows > 0)
					{
						var sql1 ="SELECT token FROM h_users where id='"+artistid+"'";
						connection.query(sql1, function (error, resultss, fields) {
						//console.log(error);return false;
						if (error) {
							res.send({
							  "status":'2',
							  "failed":"error ocurred"
							})
						}else{
							numRows = resultss.length;
							if(numRows > 0)
							{
								var dtoken  = resultss[0].token;
								var FCM = require('fcm-node');
								
								var serverKey = 'AAAAAjLQIm0:APA91bENSUgiZ1IXRCgigOcdnQYwsHTtsHOz5XYXYTcgvOQBiAmIqN86Dzq1PGkpdxLd0yESbwFlIpI6qjHf0ZSMKJpNaI1lzv5IbLlWcSOhDUsY3VthAbfNsTP_dtlMVgQGAngTJoKs'; //put the generated private key path here    
								
								var fcm = new FCM(serverKey);
							 
								var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
									to: dtoken, 
									collapse_key: 'AIzaSyACA2Afyc-UvojV5La_Kct8RU9QpDBrJIw',
									
									notification: {
										title: 'Title of your push notification artist', 
										body: 'You have a new booking request, kindly respond by going to "Booking Request" section on the left menu.' 
									},
									
									data: {  //you can send only notification or only data(or include both)
										my_key: 'my value',
										my_another_key: 'my another value'
									}
								}
								
								fcm.send(message, function(err, response){
									if (err) {
										console.log("Something has gone wrong!")
									} else {
										console.log("Successfully sent with response: ", response)
									}
								});
							}
							res.send({
								  "status":'1',
								  "message":"Booking done sucessfully"
								});
						}
					});		
					}else{
						res.send({
						  "status":'2',
						  "message":"Booking not done sucessfully"
						});
					}
					
				}
			});
		}
	});
});
app.post('/statuschange' ,function(req, res){
	var book_id= req.body.book_id;
	var user_id= req.body.user_id;
	var statu = req.body.status;
	var book={
			"status":statu,
	}
	connection.query('Update h_booking  SET ? where id =?',[book,book_id], function (error, result, fields) {
		if(!!error){
            res.send({
				  "status":'2',
				  "message":"Error in Query"
				});
        } else {
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				var sql1 ="SELECT user_name,token FROM h_users where id='"+user_id+"'";
					connection.query(sql1, function (error, resultss, fields) {
					//console.log(error);return false;
					if (error) {
						res.send({
						  "status":'2',
						  "failed":"error ocurred"
						})
					}else{
						numRows = resultss.length;
						var name =resultss[0].user_name;
						//console.log(numRows);
						if(numRows > 0)
						{
							if(statu = '1')
							{
								var title = 'Request confirm';
								var body ='';
							}else if(statu = '2'){
								var title = 'Request accept';
								var body ='"+name+"has accepted your booking request, kindly confirm the booking before someone else do.Accept Notification';
							}else if(statu = '3'){
								var title = 'Request cancel';
								var body ='"+name+"has rejected your booking request, explore more artists.Reject Notification';
							}else{
								var title = 'Request pending';
								var body ='';
							}
							var dtoken  = resultss[0].token;
							var FCM = require('fcm-node');
							
							var serverKey = 'AAAAAjLQIm0:APA91bENSUgiZ1IXRCgigOcdnQYwsHTtsHOz5XYXYTcgvOQBiAmIqN86Dzq1PGkpdxLd0yESbwFlIpI6qjHf0ZSMKJpNaI1lzv5IbLlWcSOhDUsY3VthAbfNsTP_dtlMVgQGAngTJoKs'; //put the generated private key path here    
							
							var fcm = new FCM(serverKey);
						 
							var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
								to: dtoken, 
								collapse_key: 'AIzaSyACA2Afyc-UvojV5La_Kct8RU9QpDBrJIw',
								
								notification: {
									title: title, 
									body: body 
								},
								
								data: {  //you can send only notification or only data(or include both)
									my_key: 'my value',
									my_another_key: 'my another value'
								}
							}
							
							fcm.send(message, function(err, response){
								if (err) {
									console.log("Something has gone wrong!")
								} else {
									console.log("Successfully sent with response: ", response)
								}
							});
						}
						res.send({
							  "status":'1',
							  "message":"Booking done sucessfully"
							});
					}
				});	
			}else{
				res.send({
				  "message":"Post Detail",
				  "status":'2',
				  "data":result
				});
			}
		} 
    });
});
app.post('/postcatid' ,function(req, res){
	var cat_id= req.body.cat_id;
	var sql ="SELECT p.*,c.name as catname,u.user_name as username FROM  h_post as p JOIN h_users as u ON u.id= p.userid JOIN h_category as c ON p.category= c.id where p.category ='"+cat_id+"' and p.is_deleted=0";
    connection.query(sql,function(error, result , fields){
        if(!!error){
            console.log(error);
			res.send({
				  "status":'2',
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "message":"Post Detail",
				  "status":'1',
				  "data":result
				});
			}else{
				res.send({
				  "message":"Post Detail",
				  "status":'2',
				  "data":result
				});
			}
		} 
    });
});
app.post('/bookbypost' ,function(req, res){
	var postid= req.body.postid;
	var sql ="SELECT userid,artistid,date,slot FROM  h_booking where postid ='"+postid+"'";
    connection.query(sql,function(error, result , fields){
        if(!!error){
            console.log(error);
			res.send({
				  "status":'2',
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "message":"Booking Detail by post",
				  "status":'1',
				  "data":result
				});
			}else{
				res.send({
				  "message":"Booking Detail by post",
				  "status":'1',
				  "data":result
				});
			}
		}
	});	
});
app.post('/postuserid' ,function(req, res){
	var user_id= req.body.user_id;
	var sql ="SELECT * from h_users where id ='"+user_id+"'";
	connection.query(sql,function(error, results , fields){
		if(!!error){
			res.send({
				  "status":'2',
				  "message":"Error in Query"
				});
		} else {
			numRows = results.length;
			if(numRows > 0)
			{
				var sql ="SELECT p.*,c.name as catname,u.user_name as username FROM  h_post as p JOIN h_users as u ON u.id= p.userid JOIN h_category as c ON p.category= c.id where p.is_deleted=0 and p.userid ='"+user_id+"'";
				connection.query(sql,function(error, result , fields){
					if(!!error){
						res.send({
							  "status":'2',
							  "message":"Error in Query"
							});
					} else {
						var sql ="SELECT * from h_user_post where user_id ='"+user_id+"'";
						connection.query(sql,function(error, post , fields){
							if(!!error){
								res.send({
									  "status":'2',
									  "message":"Error in Query"
									});
							} else {
								var sql ="SELECT artist_id from h_follow where user_id ='"+user_id+"'";
								connection.query(sql,function(error, follow , fields){
									if(!!error){
										res.send({
											  "status":'2',
											  "message":"Error in Query"
											});
									} else {
										
										
										var info ={};
										var arr ={};
										arr = results[0];
										arr.postinfo= result;
										info['userinfo']=arr;
										info['post']=post;
										info['followings']=follow;
										res.send({
										  "message":"Post Detail",
										  "status":'1',
										  "data":info
										});
									}
								});
								
							}
						});
					}
				});
			}
		}
	});
});
app.post('/updateimage',upload.single('image'),function(req, res, next){ 
	//console.log(req.file);return;
	var blog={
			"post_id":req.body.postid,
			"filetype":'image',
			"image":req.file.filename,
			"image_path":req.file.path,
			"created_date":today,
			"modified_date":today,
		}
	
	//console.log(blog);return false;
	connection.query('insert into h_post_file SET ?',blog, function (error, result, fields) {
		//console.log(error);return false;
		if (error) {
			res.send({
			  "status":'3',
			  "failed":error
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":'1',
				  "message":"Post updated sucessfully",
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"Post not updated sucessfully"
				});
			}
			
		}
	});
});
app.post('/postimagevideo' ,function(req, res){
    var postid=req.body.postid;
	var sql ="select * from h_post_file where post_id='"+postid+"'";
	connection.query(sql,function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				  "data":result
				});
        } else {
			var imagevideo = {};
			imagevideo['imagevideo']=result;
            res.send({
				  "message":"Post image and video List",
				  "status":'1',
				  "data":imagevideo
				});
        } 
    });
});
app.post('/deletevideoimage', function(req, res){ 
		
		var id = req.body.id;
		connection.query("delete from h_post_file where id =?",[id], function (error, result, fields) {
		//console.log(error);return false;
		if (error) {
			res.send({
			  "status":'3',
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "message":"Post List updated Sucessfully",
				  "status":'1',
				});
			}else{
				res.send({
				  "status":'2',
				  "message":"Post not deleted sucessfully"
				});
			}
			
		}
	});
});
app.get('/getaccess', function(req, res){ 
		
		var para={
			"grant_type":'password',
			"client_id":'efdb5f9bc932a427fd20',
			"client_secret":'a0175da405ad08b42034d2410ba574f36020e3e5',
			"username":'amangautam72@gmail.com',
			"password":'gautam@258',
			"scope":'manage_videos',
		}
		request.post('https://api.dailymotion.com/oauth/token',{form:para}, function (error, result, fields) {
		if(error) {
		  res.send({
			  "message":"access token",
			  "status":'2',
			});
		} else {
			var ress = JSON.parse(result.body);
			if(isset(ress.error_description ))
			{
				res.send({
				  "message":"access token",
				  "status":'3',
				  "result":ress
				});
			}else{
				res.send({
				  "message":"access token",
				  "status":'1',
				  "result":ress
				});
			}
			
		}
		
	});
});
app.post('/videoname',function(req, res){ 
	
	var video={
			"user_id":req.body.user_id,
			"video":req.body.video,
			"created_date":today,
		}
	
	//console.log(blog);return false;
	connection.query('insert into h_video SET ?',video, function (error, result, fields) {
		//console.log(error);return false;
		if (error) {
			res.send({
			  "status":'3',
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":'1',
				  "message":"Video updated sucessfully",
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"Video not updated sucessfully"
				});
			}
		}
	});
});
app.post('/getvideo' ,function(req, res){
    var user_id = req.body.user_id;
	connection.query("select * from h_video where user_id =?",[user_id],function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				  "data":result
				});
        } else {
			var videoinfo = {};
			videoinfo['videoinfo']=result;
            res.send({
				  "message":"Video List",
				  "status":'1',
				  "data":videoinfo
				});
        } 
    });
});
app.post('/publishvideo', function(req, res){ 
		var video_id = req.body.video_id;
		var acesstoken = req.body.accesstoken;
		var requestid = req.body.requestid;
		var para={
			"title":video_id,
			"tags":video_id,
			"published":true,
			"access_token":acesstoken,
			"channel":'creation',
		}
		var vid={
			"filetype":'video',
			"video":video_id,
			"post_id":requestid,
			"created_date":today,
			"modified_date":today,
		}
		request.post("https://api.dailymotion.com/video/"+video_id,{form:para}, function (error, result, fields) {
		if(error) {
		  res.send({
			  "message":"access token",
			  "status":'2',
			});
		} else {
			var ress = JSON.parse(result.body);
			if(isset(ress.error))
			{
				res.send({
				  "message":"access token",
				  "status":'3',
				  "result":ress
				});
			}else{
				connection.query('insert into h_post_file SET ?',vid, function (error, result, fields) {
					if (error) {
						res.send({
						  "status":'3',
						  "failed":"Something went wrong!!"
						})
					}else{
						numRows = result.affectedRows;
						if(numRows > 0)
						{
							res.send({
							  "message":"video upload Sucessfully",
							  "status":'1',
							  "result":ress
							});	
						}else{
							res.send({
							  "message":"video not upload Sucessfully",
							  "status":'2',
							});
						}
					}
				});
			}
			
		}
		
	});
});
app.post('/userfollow',function(req, res){ 
	var follow={
			"user_id":req.body.user_id,
			"artist_id":req.body.artist_id,
			"created_date":today,
		}
	
	//console.log(blog);return false;
	connection.query('insert into h_follow SET ?',follow, function (error, result, fields) {
		//console.log(error);return false;
		if (error) {
			res.send({
			  "status":'3',
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":'1',
				  "message":"User follow artist sucessfully",
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"User unable to follow artist"
				});
			}
		}
	});
});
app.post('/userunfollow',function(req, res){ 
	var user_id = req.body.user_id;
	var artist_id = req.body.artist_id;
	
	var sql="delete from h_follow where user_id='"+user_id+"' and artist_id='"+artist_id+"'";
	connection.query(sql, function (error, result, fields) {
		//console.log(error);return false;
		if (error) {
			res.send({
			  "status":'3',
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":'1',
				  "message":"User unfollow artist sucessfully",
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"User unable to unfollow artist"
				});
			}
		}
	});
});
app.post('/getpostbyuser',function(req, res){ 
	var user_id = req.body.user_id;
	//console.log(blog);return false;
	var sql ="select artist_id from h_follow where user_id='"+user_id+"'";
	connection.query(sql, function (error, result, fields) {
		//console.log(error);return false;
		if (error) {
			res.send({
			  "status":'3',
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.length;
			if(numRows > 0)
			{
				var allids = [];
				var artist_id =JSON.parse(JSON.stringify(result));
				artist_id.forEach(function(element) {
					allids.push(element.artist_id);
				});
				var sql="select p.*,u.user_name,u.image from h_user_post as p JOIN h_users as u ON u.id= p.user_id where user_id in (?) ORDER BY id";
				var queryData=[allids];
				connection.query(sql,queryData, function (error, results, fields) {
					if (error) {
						res.send({
						  "status":'3',
						  "failed":"Something went wrong!!"
						})
					}else{
						numRows = results.length;
						if(numRows > 0)
						{	
							res.send({
							  "status":'1',
							  "message":"User post",
							  "data":results,
							});
						}else{
							res.send({
							  "status":'2',
							  "message":"No post found"
							});
						}
					}
				});
			}else{
				res.send({
				  "status":'2',
				  "message":"User unable to follow artist"
				});
			}
		}
	});
});
app.post('/createuserpost',upload.single('image'),function(req, res){ 
	
	if(req.file ==undefined){
		var userpost={
			"user_id":req.body.user_id,
			"text":req.body.text,
			"created_date":today,
		}
	}else{
		var userpost={
			"user_id":req.body.user_id,
			"text":req.body.text,
			"created_date":today,
			"image":req.file.filename,
			"image_path":req.file.path,
		}
	}
	//console.log(blog);return false;
	connection.query('insert into h_user_post SET ?',userpost, function (error, result, fields) {
		//console.log(error);return false;
		if (error) {
			res.send({
			  "status":'3',
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":'1',
				  "message":"User post added sucessfully",
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"User unable to add post"
				});
			}
		}
	});
});
app.post('/followcheck',function(req, res){ 
	var user_id = req.body.user_id;
	var artist_id = req.body.artist_id;
	//console.log(blog);return false;
	var sql ="select * from h_follow where user_id='"+user_id+"' and artist_id ='"+artist_id+"'";
	connection.query(sql, function (error, result, fields) {
		//console.log(error);return false;
		if (error) {
			res.send({
			  "status":'3',
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "status":'1',
				  "message":"User already followed",
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"User not followed"
				});
			}
		}
	});
});
//////*************************Booking***************/////////////////
app.get('/userout',function(req,res){ 
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    } else {
		res.send({
		  "message":"User Logout",
		  "status":'1',
		});
    }
  });
});
app.post('/notification',function(req,res){
	
	var dtoken  = req.body.dtoken;
	var FCM = require('fcm-node');
    
    var serverKey = 'AAAAAjLQIm0:APA91bENSUgiZ1IXRCgigOcdnQYwsHTtsHOz5XYXYTcgvOQBiAmIqN86Dzq1PGkpdxLd0yESbwFlIpI6qjHf0ZSMKJpNaI1lzv5IbLlWcSOhDUsY3VthAbfNsTP_dtlMVgQGAngTJoKs'; //put the generated private key path here    
    
    var fcm = new FCM(serverKey);
 
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: dtoken, 
        collapse_key: 'AIzaSyACA2Afyc-UvojV5La_Kct8RU9QpDBrJIw',
        
        notification: {
            title: 'Title of your push notification artist', 
            body: 'Body of your push notification artist' 
        },
        
        data: {  //you can send only notification or only data(or include both)
            my_key: 'my value',
            my_another_key: 'my another value'
        }
    }
    
    fcm.send(message, function(err, response){
        if (err) {
            console.log("Something has gone wrong!")
        } else {
            console.log("Successfully sent with response: ", response)
        }
    })
});
app.post('/upcomingevent',upload.single('image'),function(req, res, next){ 
	var today = new Date();
	var id = req.body.id;
	if(req.file ==undefined){
		var upevent={
			"title":req.body.title,
			"description":req.body.description,
			"event_date":req.body.eventdate,
			"created_date":today,
			"modified_date":today
		}
	}else{
		var upevent={
			"title":req.body.title,
			"description":req.body.description,
			"event_date":req.body.eventdate,
			"image":req.file.filename,
			"img_path":req.file.path,
			"created_date":today,
			"modified_date":today,
		}
	}
	connection.query('update h_upcomingevent SET ? where id = ?',[upevent,id],function (error, result, fields) {
		if (error) {
			res.send({
			  "status":'2',
			  "failed":"error ocurred"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":'1',
				  "message":"Event added sucessfully"
				});	
			}else{
				res.send({
				  "status":'2',
				  "message":"Event not added sucessfully"
				});
			}
				
		}
	});
});
app.get('/getevent' ,function(req, res){
	
	var sql ="select * from h_upcomingevent";
	connection.query(sql,function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				});
        } else {
			res.send({
				  "message":"Event List",
				  "status":'1',
				  "data":result
				});
        } 
    });
});
app.get('/gettopuser' ,function(req, res){
	
	var sql ="select * from h_users where usertype ='2'";
	connection.query(sql,function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				});
        } else {
			res.send({
				  "message":"Top user List",
				  "status":'1',
				  "data":result
				});
        } 
    });
});
app.post('/sendotp' ,function(req, res){

	var otps 	= Math.floor(1000 + Math.random() * 9000);
	var mobile 	= req.body.mobile;
	var to 	= '91'+ mobile;
	var text 	= otps;
	var from 	= 'Artist App';
	var upevent={
			"mobile":req.body.mobile,
			"otp":otps,
		}
	var otp ={
		"otp":otps
	}
	var sql ="select * from h_users where mobile='"+mobile+"' ";
	connection.query(sql,function(error, result , fields){
		if(!!error){
			res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				});
		} else {
			var numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "message":"This number is already registered with us, please log in",
				  "status":'2',
				});
			}else{
				var sql ="select * from h_user_otp where mobile='"+mobile+"'";
				connection.query(sql,function (error, result, fields) {
					if(!!error){
						res.send({
							  "message":"Something Went wrong!",
							  "status":'2',
							});
					} else {
						var numRows = result.length;
						if(numRows > 0)
						{
							connection.query('update h_user_otp SET ? where mobile = ?',[otp,mobile],function (error, result, fields) {
								if(!!error){
									res.send({
										  "message":"Something Went wrong!",
										  "status":'2',
										});
								} else {
									var numRows = result.affectedRows;
									if(numRows > 0)
									{
										nexmo.message.sendSms(from, to, text, (err, responseData) => {
											if (err) {
												console.log(err);
											} else {
												if(responseData.messages[0]['status'] === "0") {
													console.log("Message sent successfully.");
													res.send({
													  "message":"Otp Send Successfully",
													  "status":'1',
													});
												} else {
													console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
													res.send({
													  "message":"Otp Not Send Successfully",
													  "status":'2',
													});
												}
											}
										})
									}
								}
							});
						}else{
							connection.query('insert into h_user_otp SET ?',[upevent],function (error, result, fields) {
								if(!!error){
									res.send({
										  "message":"Something Went wrong!",
										  "status":'2',
										});
								} else {
									var numRows = result.affectedRows;
									if(numRows > 0)
									{
										nexmo.message.sendSms(from, to, text, (err, responseData) => {
											if (err) {
												console.log(err);
											} else {
												if(responseData.messages[0]['status'] === "0") {
													//console.log("Message sent successfully.");
													res.send({
													  "message":"Otp Send Successfully",
													  "status":'1',
													});
												} else {
													//console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
													res.send({
													  "message":"Otp Send Successfully",
													  "status":'2',
													});
												}
											}
										})
									}
								}
							});
						}
					}
				});	
			}
		}
	});
	
});
app.get('/getotp' ,function(req, res){

	var otps = Math.floor(1000 + Math.random() * 9000);
	var from 	= 'Artist App';
	var to 		= '918285859189';
	var text 	= otps;
	
	nexmo.message.sendSms(from, to, text, (err, responseData) => {
		if (err) {
			console.log(err);
		} else {
			if(responseData.messages[0]['status'] === "0") {
				//console.log("Message sent successfully.");
				res.send({
				  "message":"Message sent successfully.",
				  "status":'1',
				  "data":responseData
				});
			} else {
				//console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
				res.send({
				  "message":"Message not sent successfully.",
				  "status":'2',
				  "data":responseData
				});
			}
		}
	})
});
var PaytmConfig = {
	mid: "TrxJdb64619779807906",
	key: "%sWoaE5OE6CXudcL",
	website: "WEBSTAGING",
	Channel_ID:"WAP",
	INDUSTRY_TYPE_ID:"Retail"
}
app.post('/paytmss' ,function(req, res){ 
	//console.log(req.url);
	var user_id = req.body.user_id;
	var amount = req.body.amount;
	var sql ="select * from h_users where id='"+user_id+"'";
	connection.query(sql,function (error, result, fields) {
		if(!!error){
			res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				});
		} else {
			var numRows = result.length;
			if(numRows > 0)
			{
				switch(req.url){
					case "/paytmss":
						var oid 						= 'order_'  + new Date().getTime();
						var params 						= {};
						params['MID'] 					= PaytmConfig.mid;
						params['ORDER_ID']				= oid;
						params['CUST_ID'] 				= 'Cust_00'+ user_id;
						params['INDUSTRY_TYPE_ID']		= PaytmConfig.INDUSTRY_TYPE_ID;
						params['CHANNEL_ID']			= PaytmConfig.Channel_ID;
						params['TXN_AMOUNT']			= amount;
						params['WEBSITE']				= PaytmConfig.website;
						//params['CALLBACK_URL']			= 'http://192.168.1.29:'+8086+'/callback';
						params['CALLBACK_URL']			= 'https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID='+oid+'';
						params['EMAIL']					= result[0].email;
						params['MOBILE_NO']				= result[0].mobile;
						//console.log(params);
						checksum_lib.genchecksum(params, PaytmConfig.key, function (err, checksum) {

							var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
							// var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
							
							var form_fields = "";
							for(var x in params){
								form_fields += "<input type='hidden' name='"+x+"' value='"+params[x]+"' >";
							}
							form_fields += "<input type='hidden' name='CHECKSUMHASH' value='"+checksum+"' >";
							res.send({
							  "message":"Checksum sent successfully.",
							  "status":'1',
							  "Checksum":checksum,
							  "orderid":oid,
							  "website":PaytmConfig.website,
							  "channel_id":PaytmConfig.Channel_ID,
							  "mid":PaytmConfig.mid,
							  "INDUSTRY_TYPE_ID":params['INDUSTRY_TYPE_ID'],
							  "CALLBACK_URL":params['CALLBACK_URL'],
							  "mobile_no":result[0].mobile,
							  "email":result[0].email,
							  "custId":params['CUST_ID'],
							  "amount":params['TXN_AMOUNT'],
							  
							});
							//res.writeHead(200, {'Content-Type': 'text/html'});
							//res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="'+txn_url+'" name="f1">'+form_fields+'</form><script type="text/javascript">document.f1.submit();</script></body></html>');
							//res.end();
						});
					break;
				
					case "/callback":

						var body = '';
						
						req.on('data', function (data) {
							body += data;
						});

						req.on('end', function () {
							var html = "";
							var post_data = qs.parse(body);


							// received params in callback
							console.log('Callback Response: ', post_data, "\n");
							html += "<b>Callback Response</b><br>";
							for(var x in post_data){
								html += x + " => " + post_data[x] + "<br/>";
							}
							html += "<br/><br/>";


							// verify the checksum
							var checksumhash = post_data.CHECKSUMHASH;
							// delete post_data.CHECKSUMHASH;
							var result = checksum_lib.verifychecksum(post_data, PaytmConfig.key, checksumhash);
							console.log("Checksum Result => ", result, "\n");
							html += "<b>Checksum Result</b> => " + (result? "True" : "False");
							html += "<br/><br/>";



							// Send Server-to-Server request to verify Order Status
							var params = {"MID": PaytmConfig.mid, "ORDERID": post_data.ORDERID};

							checksum_lib.genchecksum(params, PaytmConfig.key, function (err, checksum) {

								params.CHECKSUMHASH = checksum;
								post_data = 'JsonData='+JSON.stringify(params);

								var options = {
									hostname: 'securegw-stage.paytm.in', // for staging
									// hostname: 'securegw.paytm.in', // for production
									port: 443,
									path: '/merchant-status/getTxnStatus',
									method: 'POST',
									headers: {
										'Content-Type': 'application/x-www-form-urlencoded',
										'Content-Length': post_data.length
									}
								};


								// Set up the request
								var response = "";
								var post_req = https.request(options, function(post_res) {
									post_res.on('data', function (chunk) {
										response += chunk;
									});

									post_res.on('end', function(){
										console.log('S2S Response: ', response, "\n");

										var _result = JSON.parse(response);
										html += "<b>Status Check Response</b><br>";
										for(var x in _result){
											html += x + " => " + _result[x] + "<br/>";
										}

										res.writeHead(200, {'Content-Type': 'text/html'});
										res.write(html);
										res.end();
									});
								});

								// post the data
								post_req.write(post_data);
								post_req.end();
							});
						});
						
					break;
				}
			}else{
				res.send({
				  "message":"No Such user found!!!!",
				  "status":'2',
				});
			}
		}
	});
});
app.post('/verifypayment' ,function(req, res){ 
	
	var order_id = req.body.order_id;
	var user_id = req.body.user_id;
	var booking_id = req.body.booking_id;
	
	var paytmParams = {};
	paytmParams["MID"] = "TrxJdb64619779807906";
	paytmParams["ORDERID"] = order_id;

	checksum_lib.genchecksum(paytmParams, "%sWoaE5OE6CXudcL", function(err, checksum){

	
		/* put generated checksum value here */
		paytmParams["CHECKSUMHASH"] = checksum;

		/* prepare JSON string for request */
		var post_data = JSON.stringify(paytmParams);

		var options = {

			/* for Staging */
			hostname: 'securegw-stage.paytm.in',

			/* for Production */
			// hostname: 'securegw.paytm.in',

			port: 443,
			path: '/order/status',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': post_data.length
			}
		};

		// Set up the request
		var response = "";
		var post_req = https.request(options, function(post_res) {
			post_res.on('data', function (chunk) {
				response += chunk;
			});

			post_res.on('end', function(){
				var responses =JSON.parse(response);
				if(responses.STATUS == 'TXN_SUCCESS'){
					var paytmdata = {
						TXNID: responses.TXNID,
						BANKTXNID: responses.BANKTXNID,
						ORDERID: responses.ORDERID,
						TXNAMOUNT:responses.TXNAMOUNT,
						TXNTYPE:responses.TXNTYPE,
						STATUS:responses.STATUS,
						GATEWAYNAME:responses.GATEWAYNAME,
						RESPCODE:responses.RESPCODE,
						RESPMSG:responses.RESPMSG,
						BANKNAME:responses.BANKNAME,
						PAYMENTMODE:responses.PAYMENTMODE,
						REFUNDAMT:responses.REFUNDAMT,
						TXNDATE:responses.TXNDATE,
						user_id:user_id,
						booking_id:booking_id,
					}
					connection.query('insert into h_user_payment SET ?',[paytmdata],function (error, result, fields) {
						if(!!error){
							res.send({
								  "message":"Something Went wrong!",
								  "status":'2',
								});
						} else {
							var numRows = result.affectedRows;
							if(numRows > 0)
							{
								connection.query("Update h_booking  SET status=1  where id ='"+booking_id+"' and userid='"+user_id+"' ", function (error, resulted, fields) {
									if(!!error){
										res.send({
											  "status":'2',
											  "message":"Error in Query"
											});
									} else {
										numRows = resulted.affectedRows;
										if(numRows > 0)
										{
											res.send({
											  "message":"Payment Verify.",
											  "status":'1',
											  "Checksum":responses,
											});
										}
									}
								});
								
							}else{
								res.send({
								  "message":"Payment Not Verify.",
								  "status":'2',
								  "Checksum":'',
								});
							}
						}
					});
					
				}else{
					res.send({
					  "message":"Payment Not Verify.",
					  "status":'2',
					  "Checksum":responses,
					});
				}
				
			});
		});

		// post the data
		post_req.write(post_data);
		post_req.end();
	});
});
app.get('/featurepost' ,function(req, res){
	
	var sql ="SELECT p.*,c.name as catname,u.user_name as username,u.img_path as userimage, ( select GROUP_CONCAT(hpf.filetype,'~',IFNULL(hpf.video,0),'~',IFNULL(hpf.image_path,0)) from h_post_file hpf  WHERE hpf.post_id=p.id) AS post_data FROM  h_post as p JOIN h_users as u ON u.id= p.userid JOIN h_category as c ON p.category= c.id where p.is_deleted=0 and p.is_featured='1'";
    connection.query(sql,function(error, postdata , fields){
        if(!!error){
            console.log(error);
			res.send({
				  "status":'2',
				  "message":"Error in Query"
				});
        } else {
			numRows = postdata.length;
			if(numRows > 0)
			{
				console.log(postdata)
				var i = 0;
				
				for(i in postdata)
				{
					if(postdata[i].post_data)
					{
						var j = 0;
						var post  = postdata[i]['post_data'].split(",");
						var post_data = [];
						for(j in post)
						{
							var postIn  = post[j].split("~");
							post_data.push({ "image_path": (postIn[2] !=0)? postIn[2]:null,"filetype": postIn[0],"video": (postIn[1] !=0)?postIn[1]:null });
							
						}
						
						postdata[i].post_data = post_data;
					}
					
				}
				
				res.send({
				  "message":"Feature Post Detail",
				  "status":'1',
				  "data":postdata
				});

			}else{
				
				res.send({
				  "message":"Feature Post Detail",
				  "status":'2',
				  "data":postdata
				});
			}

		} 
    });
});
// app.listen(5000);