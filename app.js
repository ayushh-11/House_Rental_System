const express = require('express');
const app = express();
const dotenv = require("dotenv");
const mysql = require("mysql");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const hbs = require('hbs');
const session = require('express-session');
const bcrypt = require("bcrypt");
const fileUpload = require('express-fileupload');

app.use(fileUpload());
app.use(session({
    secret: 'keyboard',
    cookie: { maxAge : 3600*1000 },
    resave: false,
    saveUninitialized: false
  }))

//Configure environment variables
dotenv.config({ path: './.env' });

//Parsing middleware / Parse application
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Serving static file
app.use(express.static('public'));
app.use(express.static('image'));

// Register Handlebars as the view engine
app.engine('.hbs', exphbs.engine({
    defaultLayout: '', extname: '.hbs',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
}));
app.set('view engine', '.hbs');
hbs.registerPartials(__dirname + '/views/partials');

//Setting database connection
const db = mysql.createConnection({
    host: process.env.db_host,
    user: process.env.db_user,
    password: process.env.db_password,
    database: process.env.db_name
});
//connect to database
db.connect((error) => {
    if (error) console.log(error);
    else console.log("Database connected");
});

app.get("/", (req, res) => {
    if (req.session.mode === "admin")
        res.redirect("/dashboard");
    else if (req.session.mode === "tenant")
        res.redirect("/index");
    else
        res.render("Main");
});

/////////////////////////////////////////////////////////tenant login and register/////////////////////////////////////////////////

app.get("/tenant_login",(req,res)=>{
    if (req.session.mode === "tenant")
        res.render("index");
    else if(req.session.mode === "admin")
        res.render("dashboard");
    else
        res.render("tenant_login");
})
app.post("/tenant_login",(req,res)=>{
    const {lemail, lpassword} = req.body;
    sql = " SELECT * FROM tenant WHERE tenant_email = ?";
    db.query(sql,[lemail], (err, result)=>{
        if (err) throw err;
        if(result.length == 0){
            message = "Credential do not match !"
            res.render("admin_login",{ message });
        }
        else{
            hash = result[0].password;
            bcrypt.compare(lpassword, hash, function(err, bcryptResult) {
                if (bcryptResult) {
                    req.session.user = result[0].tenant_id;
                    req.session.mode = "tenant";
                    req.session.name = result[0].tenant_name;
                    console.log("Login mode : " + req.session.mode);
                    res.redirect("/index");
                }
                else{
                    message = "Credential do not match !"
                    res.render("tenant_login",{ message });
                }
            });
            
        }
    })
})

app.post("/tenant_register",(req,res)=>{
    var {username, email, password} = req.body;
    tsql = " SELECT * FROM tenant WHERE tenant_email = ?";
    db.query(tsql, [email], (error, result)=>{
        if(error) throw error;
        if(result.length == 0){
            bcrypt.hash(password, 10, function(err, hash) {
                if (err) throw err;
                sql = "INSERT INTO tenant (tenant_name, tenant_email, password) VALUES (?,?,?)"
                db.query(sql, [username, email, hash], (err, result)=>{
                    if (err) throw err;
                    script = `<script> alert('Successfully Created'); window.location.href = '/tenant_login'; </script>`;
                    res.send(script);
                })
            });
        }else{
            emailMessage = "Email already taken";
            res.render("tenant_login",{emailMessage});
        }
    })
})


/////////////////////////////////////////////////////admin login and register/////////////////////////////////////////////////
app.get("/admin_login",(req,res)=>{
    console.log(req.session.mode);
    if (req.session.mode === "admin")
        res.redirect("dashboard");
    else
        res.render("admin_login");
})

app.post("/admin_login",(req,res)=>{
    const {lemail, lpassword} = req.body;
    sql = " SELECT * FROM admin WHERE admin_email = ?";
    db.query(sql,[lemail], (err, result)=>{
        if (err) throw err;
        if(result.length == 0){
            message = "Credential do not match !"
            res.render("admin_login",{ message });
        }
        else{
            hash = result[0].password;
            bcrypt.compare(lpassword, hash, function(err, bcryptResult) {
                if (bcryptResult) {
                    req.session.user = result[0].admin_id;
                    req.session.mode = "admin";
                    req.session.name = result[0].admin_name;
                    res.redirect("/dashboard");
                }
                else{
                    message = "Credential do not match !"
                    res.render("admin_login",{ message });
                }
            });
            
        }
    })
})

app.post("/admin_register",(req,res)=>{
    var {username, email, password} = req.body;
    tsql = " SELECT * FROM admin WHERE admin_email = ?";
    db.query(tsql, [email], (error, result)=>{
        if(error) throw error;
        if(result.length == 0){
            bcrypt.hash(password, 10, function(err, hash) {
                if (err) throw err;
                sql = "INSERT INTO admin (admin_name, admin_email, password) VALUES (?,?,?)"
                db.query(sql, [username, email, hash], (err, result)=>{
                    if (err) throw err;
                    script = `<script> alert('Successfully Created'); window.location.href = '/admin_login'; </script>`;
                    res.send(script);
                })
            });
        }else{
            emailMessage = "Email already taken";
            res.render("admin_login",{emailMessage});
        }
    })
})


///////////////////logout/////////////////////////////////////////////////////////////
app.get("/logout", (req, res) => {
    req.session.destroy((err)=>{
        if (err)
            console.log("Err")
        else
            res.render("Main");
    });
});


app.get("/index", (req, res) => {
    if (req.session.mode === "tenant"){
        sql = "SELECT * FROM property";
        db.query(sql, (err, rows) => {
            username = req.session.name; 
            res.render("index", { rows,username });
        })
    }
    else
        res.render("tenant_login");
});

app.get("/details/:id", (req, res) => {
    id = req.params.id;
    tname = req.session.name;
    sql = "SELECT * FROM property WHERE property_id = ?"
    console.log("tenant = "+tname);
    
    db.query(sql, [id], (err,rows) => {
        if(err) throw err;
        console.log("Booked by = "+rows[0].booked_by)
        if (rows[0].booked_by.toString() === tname.toString())
            tenant_auth = true;
        else
            tenant_auth = false;
        console.log(tenant_auth);
        rows = rows[0];
        res.render("details",{ rows, tenant_auth});
    })
});

app.get("/myBooking", (req, res) => {
    sql = "select * from property where booked_status = ? && booked_by = ?";
    db.query(sql, [ 1,req.session.name.toString() ],(err, rows) => {
        if (err) throw err;
        res.render("index", { rows } );
    })
})

/////////////Admin create a post/////////////////////////////////////////////////////////////////////////////////
app.get("/insert_data", (req, res) => {
    id = req.session.user;
    console.log("admin id= "+id);
    res.render("insert",{id});
});
app.post("/insert_data/:id",(req,res)=>{

    const {title, contact, address, description, category, price} = req.body;
    const{photo1, photo2, photo3} = req.files;
    
    console.log("admin id = "+req.params.id);
    
    uploadPath1 = __dirname + '/image/' + photo1.name;
    uploadPath2 = __dirname + '/image/' + photo2.name;
    uploadPath3 = __dirname + '/image/' + photo3.name;
    
    sql = "INSERT INTO property (title, contact, address, description, category, price, posted_by) VALUES (?,?,?,?,?,?,?)"
    db.query(sql, [title, contact, address, description, category, price, req.params.id],(err,result)=>{
        if (err) throw err;
        console.log("Data inserted");
        photo1.mv(uploadPath1, function (err) {
            if (err) throw err;
            db.query('UPDATE property SET photo1 = ? WHERE property_id = ?', [photo1.name, result.insertId], (err, rows) => {
                if (err) throw err;       
            });
        });
        photo2.mv(uploadPath2, function (err) {
            if (err) throw err;
            db.query('UPDATE property SET photo2 = ? WHERE property_id = ?', [photo2.name, result.insertId], (err, rows) => {
                if (err) throw err;       
            });
        });
        photo3.mv(uploadPath3, function (err) {
            if (err) throw err;
            db.query('UPDATE property SET photo3 = ? WHERE property_id = ?', [photo3.name, result.insertId], (err, rows) => {
                if (err) throw err;       
            });
        });
    }) 
    res.redirect("/dashboard");
})
////////////////////////////delete/////////////////////////////////////////////
app.get("/delete/:id",(req,res)=>{
    id = req.params.id;
    sql = "DELETE FROM property WHERE property_id = ?";
    db.query(sql, [ id ], (err, result) => {
        if (err) throw err;
        res.redirect("/dashboard");
    })

})
//////////////////////////update/////////////////////////////////////////////////
app.get("/update/:id", (req, res) => {
    id = req.params.id;
    res.render("update",{id});
});
app.post("/update/:id",(req, res ) => {
    id = req.params.id;
    const {title, contact, address, description, category, price} = req.body;
    const{photo1, photo2, photo3} = req.files;
    
    console.log("property id = "+id);
    console.log("admin id = "+req.session.user);
    
    uploadPath1 = __dirname + '/image/' + photo1.name;
    uploadPath2 = __dirname + '/image/' + photo2.name;
    uploadPath3 = __dirname + '/image/' + photo3.name;
    
    sql = "UPDATE property SET title = ?, contact = ?, address = ?, description = ?, category = ?, price = ?, posted_by = ? WHERE property_id = ?"
    db.query(sql, [title, contact, address, description, category, price, req.session.user, id],(err,result)=>{
        if (err) throw err;
        console.log("Data inserted");
        photo1.mv(uploadPath1, function (err) {
            if (err) throw err;
            db.query('UPDATE property SET photo1 = ? WHERE property_id = ?', [photo1.name, result.insertId], (err, rows) => {
                if (err) throw err;       
            });
        });
        photo2.mv(uploadPath2, function (err) {
            if (err) throw err;
            db.query('UPDATE property SET photo2 = ? WHERE property_id = ?', [photo2.name, result.insertId], (err, rows) => {
                if (err) throw err;       
            });
        });
        photo3.mv(uploadPath3, function (err) {
            if (err) throw err;
            db.query('UPDATE property SET photo3 = ? WHERE property_id = ?', [photo3.name, result.insertId], (err, rows) => {
                if (err) throw err;       
            });
        });
    }) 
    res.redirect("/dashboard");
})
app.get("/dashboard", (req, res) => {
    console.log("Mode = "+req.session.user);
    if(req.session.mode === "admin"){
        sql = "SELECT * FROM property WHERE posted_by = ?";
        db.query(sql, [req.session.user],(err,rows) => {
            if (err) throw err;
            username = req.session.name;
            username = req.session.name;
            res.render("dashboard", {rows,username});
        })   
    }else{
        res.redirect("/admin_login");
    }
});

//////booked in dashboard
app.get("/booked", (req,res) => {
    if(req.session.mode === "admin"){
        sql = "SELECT * FROM property WHERE posted_by = ? && booked_status = true";
        db.query(sql, [req.session.user],(err,rows) => {
            if (err) throw err;
            username = req.session.name;
            username = req.session.name;
            res.render("dashboard", {rows,username});
        })   
    }else{
        res.render("/admin_login");
    }
})



app.post("/search",(req,res) => {
    const key = req.body.key;
    console.log(key)
    sql = "SELECT * FROM property where title LIKE ? OR description LIKE ? ";
    db.query(sql,[`%${key}%`, `%${key}%`], (err,rows) =>{
        if (err) throw err;
        console.log(rows);
        res.render("index",{rows});
    })
})
app.get("/category/:cat",(req,res)=>{
    cat = req.params.cat;
    console.log(cat);
    sql = "select * from property where category LIKE ?"
    db.query(sql,[`%${cat}%`],(err,rows) => {
        if (err) throw err;
        username = req.session.name;
        res.render("index",{rows,username});
    })
})
app.get("/book/:id", (req,res) => {
    id = req.params.id;
    tname = req.session.name;
    sql = "UPDATE property SET booked_status = TRUE, booked_by = ? WHERE property_id = ?"
    db.query(sql, [tname, id], (err,rows) => {
        if (err) throw error;
        script = `<script> alert('Successfully Booked'); window.location.href = '/details/${id}'; </script>`;
        res.send(script);
    })
})
//user cancel booking
app.get("/cancel_book/:id",(req,res) => {
    id = req.params.id;
    sql = "UPDATE property SET booked_status = False, booked_by = NULL WHERE property_id = ?"
    db.query(sql,[id],(err,rows) => {
        if (err) throw err;
        script = `<script> alert('Booking Canceled'); window.location.href = '/details/${id}'; </script>`;
        res.send(script);
    })
})
///admin booking cancel
app.get("/admin_book/:id",(req,res) => {
    id = req.params.id;
    sql = "UPDATE property SET booked_status = False, booked_by = NULL WHERE property_id = ?";
    db.query(sql,[id],(err,rows) => {
        if (err) throw err;
        script = `<script> alert('Booking Canceled'); window.location.href = '/dashboard'; </script>`;
        res.send(script);
    })
})

app.listen(5000, () => {
    console.log("Server started on port 5000");
});