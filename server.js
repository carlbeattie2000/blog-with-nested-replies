const express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    PORT = process.env.PORT || 3000;
var sqlite3 = require('sqlite3').verbose(),
    crypto = require("crypto"),
    session = require('express-session')

// App 
const app = express();
app.set('view engine', 'pug')
app.use(bodyParser.urlencoded({ extended: false }))
app.set('trust proxy', 1) // trust first proxy
app.use(bodyParser.json());
// Session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }))

// DB init
var db = new sqlite3.Database('./db/blogs.db');

// CREATE DATABASE TABLES
db.run("CREATE TABLE IF NOT EXISTS main_posts (post_id TEXT, title TEXT, content TEXT, important INTEGER, upvotes INTEGER, replys_count INTEGER, time_posted TEXT, deletion_date TEXT)", (err) => {
    if (err) throw (error)
});
db.run("CREATE TABLE IF NOT EXISTS posts_replys (post_id TEXT, comment TEXT, upvotes INTEGER, time_posted TEXT)", (err) => {
    if (err) throw (error)
});
db.run("CREATE TABLE IF NOT EXISTS admins (account_id TEXT, username TEXT, password TEXT)", (err) => {
        if (err) throw (error);
    })
// END CREATE DATABASE TABLES

app.get("/", (req, res) => { // Main home page, where all recent posts are displayed
    var posts_list = []; // Store all the posts inside here

    db.all("SELECT * FROM main_posts", [], (err, rows) => {
        rows.forEach((row) => {
            var post = {
                post_id: row.post_id,
                title: row.title,
                content: row.content,
                important: row.important,
                upvotes: row.upvotes,
                replys_count: row.replys_count,
                time_posted: row.time_posted,
                deletion_data: row.deletion_date
            }

            posts_list.push(post)
        })

        res.render("index", { postlist: posts_list })
    })
})

app.get("/create_post", (req, res) => {
    res.render("new_post");
})

app.post("/create_post/send", (req, res) => {
    const post_title = req.body.postTitle;
    const post_content = req.body.post_content;
    var post_id = crypto.randomBytes(20).toString('hex');
    var post_important = req.body.importantCheck;
    var date = new Date();
    var date_added = String(date.getDate()) + "/" + String(date.getMonth() + 1) + "/" + String(date.getFullYear()) + " " + String(date.getHours()) + ":" + String(date.getMinutes());

    if (post_important == "1") {
        post_important = true;
        var deletion_time = String(date.getDate() + 4) + String(date.getMonth() + 1) + String(date.getHours()) + String(date.getMinutes());
    } else {
        post_important = false;
        var deletion_time = String(date.getDate() + 1) + String(date.getMonth() + 1) + String(date.getHours()) + String(date.getMinutes());
    }

    if (post_title && post_content) {
        db.run("INSERT INTO main_posts(post_id, title, content, important, upvotes, replys_count, time_posted, deletion_date) VALUES (?,?,?,?,?,?,?,?)", [post_id, post_title, post_content, post_important, 0, 0, date_added, deletion_time], function(err) {
            if (err) {
                return console.log(err.message);
            }
            res.redirect("/");
        });
    } else {
        console.log("error fields are empty");
        res.redirect("/")
    }
})

app.post("/view_post", (req, res) => {
    const post_id = req.body.post_id;
    var replys = [];
    var posts = []
        // get the post and store it in a dict
    db.all(`SELECT * FROM main_posts WHERE post_id="${post_id}"`, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            var post = {
                post_id: row.post_id,
                title: row.title,
                content: row.content,
                important: row.important,
                upvotes: row.upvotes,
                replys_count: row.replys_count,
                time_posted: row.time_posted,
                deletion_data: row.deletion_date
            }

            posts.push(post)
        });

        db.all(`SELECT * FROM posts_replys WHERE post_id="${post_id}"`, [], (err, rows) => {
            if (err) {
                throw err;
            }
            rows.forEach((row) => {
                var reply = {
                    post_id: row.post_id,
                    comment: row.comment,
                    upvotes: row.upvotes,
                    time_posted: row.time_posted,
                    reply_id: row.reply_id
                }

                replys.push(reply);
            });

            res.render("view_post", { postlist: posts, replylist: replys })
        });
    });
})

app.post("/reply/send", (req, res) => {
    const post_id = req.body.post_id
    const comment = req.body.reply_content
    var reply_id = crypto.randomBytes(20).toString('hex');
    var date = new Date();
    var replys = [];
    var posts = [];
    var date_added = String(date.getDate()) + "/" + String(date.getMonth() + 1) + "/" + String(date.getFullYear()) + " " + String(date.getHours()) + ":" + String(date.getMinutes());
    if (post_id && comment) {
        db.run("INSERT INTO posts_replys(post_id, comment, upvotes, time_posted, reply_id) VALUES (?, ?, ?, ?, ?)", [post_id, comment, 0, date_added, reply_id], (err) => {
            if (err) throw error;
            db.all(`SELECT * FROM main_posts WHERE post_id="${post_id}"`, [], (err, rows) => {
                if (err) {
                    throw err;
                }
                rows.forEach((row) => {
                    var post = {
                        post_id: row.post_id,
                        title: row.title,
                        content: row.content,
                        important: row.important,
                        upvotes: row.upvotes,
                        replys_count: row.replys_count,
                        time_posted: row.time_posted,
                        deletion_data: row.deletion_date
                    }

                    posts.push(post)
                    var new_reply_count = post.replys_count + 1;
                    db.all(`UPDATE main_posts SET replys_count=${new_reply_count} WHERE post_id="${post.post_id}"`)
                });

                db.all(`SELECT * FROM posts_replys WHERE post_id="${post_id}"`, [], (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    rows.forEach((row) => {
                        var reply = {
                            post_id: row.post_id,
                            comment: row.comment,
                            upvotes: row.upvotes,
                            time_posted: row.time_posted,
                            reply_id: row.reply_id
                        }

                        replys.push(reply);
                    });

                    res.render("view_post", { postlist: posts, replylist: replys })
                });
            });
        })
    }
})

app.listen(PORT, () => {
    console.log(`Listing on port ${PORT}`);
});