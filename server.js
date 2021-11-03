const express = require('express'),
      path = require('path'),
      bodyParser = require('body-parser'),
      PORT = process.env.PORT || 3000;
      app = express();

var sqlite3 = require('sqlite3').verbose(),
    crypto = require("crypto"),
    session = require('express-session'),
    scheduler = require('./tasks_on_timer')
    report = require('./reports')

// App config
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
db.run("CREATE TABLE IF NOT EXISTS main_posts (post_id TEXT, title TEXT, content TEXT, important INTEGER, upvotes INTEGER, replys_count INTEGER, time_posted TEXT, timeSincePosted INTEGER, deletion_date INTEGER)", (err) => {
    if (err) throw (error)
});
db.run("CREATE TABLE IF NOT EXISTS posts_replys (post_id TEXT, comment TEXT, upvotes INTEGER, time_posted TEXT)", (err) => {
    if (err) throw (error)
});
db.run("CREATE TABLE IF NOT EXISTS replies_responses (post_id TEXT, reply_id TEXT, response_id comment TEXT, upvotes INTEGER, time_posted TEXT)", (err) => {
    if (err) throw (error)
});
db.run("CREATE TABLE IF NOT EXISTS admins (account_id TEXT, username TEXT, password TEXT)", (err) => {
        if (err) throw (error);
});
db.run("CREATE TABLE IF NOT EXISTS reported_posts (post_id TEXT, reason TEXT)", (err) => {
    if (err) throw (error);
});
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
        // delete post after 48 hours if it is marked important
        var deletion_time = 48
    } else {
        post_important = false;
        // delete post after 24 hours if not important
        var deletion_time = 24
    }

    if (post_title && post_content) {
        db.run("INSERT INTO main_posts(post_id, title, content, important, upvotes, replys_count, time_posted, deletion_date) VALUES (?,?,?,?,?,?,?,?)", [post_id, post_title, post_content, post_important, 0, 0, date_added, deletion_time], function(err) {
            if (err) {
                return console.log(err.message);
            }
            res.redirect("/");
        });
    } else {
        res.redirect("/")
    }
})

app.get("/posts/:post_id", (req, res, next) => {
    var post_id = req.params.post_id;
    var replys = [];
    var posts = []
    var replys_replys = [];
        // get the post and store it in a dict
    db.all(`SELECT * FROM main_posts WHERE post_id="${post_id}"`, [], (err, rows) => { // Query and get the post and it's content if it exists
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

        db.all(`SELECT * FROM posts_replys WHERE post_id="${post_id}"`, [], (err, rows) => { // Query and get the replys to the post
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

            db.all(`SELECT * FROM replys_responses WHERE post_id="${post_id}"`, [], (err, rows) => { // Now get the replys to the replys
                rows.forEach((row) => {
                    var reply = {
                        post_id: row.post_id,
                        reply_id: row.reply_id,
                        reply_comment: row.comment,
                        time_posted: row.time_posted
                    }

                    replys_replys.push(reply);
                })

                res.render("view_post", { postlist: posts, replylist: replys, reply_to_replyList: replys_replys })
            })
        });
    });
})

app.post("/reply/send", (req, res) => {
    const post_id = req.body.post_id
    const comment = req.body.reply_content
    var reply_id = crypto.randomBytes(20).toString('hex');
    var date = new Date();
    var date_added = String(date.getDate()) + "/" + String(date.getMonth() + 1) + "/" + String(date.getFullYear()) + " " + String(date.getHours()) + ":" + String(date.getMinutes());
    if (post_id && comment) {
        db.run("INSERT INTO posts_replys(post_id, comment, upvotes, time_posted, reply_id) VALUES (?, ?, ?, ?, ?)", [post_id, comment, 0, date_added, reply_id], (err) => {
            if (err) throw error;
            db.all(`SELECT * FROM main_posts WHERE post_id="${post_id}"`, [], (err, rows) => {
                rows.forEach((row) => {
                    var reply_count = row.replys_count;
                    var new_reply_count = reply_count + 1;
                    db.all(`UPDATE main_posts SET replys_count=${new_reply_count} WHERE post_id="${post_id}"`)
                });
            })
            res.redirect("back")
        })
    }
})

app.post("/reply/reply/send", (req, res) => {
    const post_id = req.body.reply_post_id;
    const reply_id = req.body.reply_id;
    const reply_content = req.body.reply_to_reply;
    const response_id = crypto.randomBytes(20).toString("hex");

    var date = new Date();
    var date_added = String(date.getDate()) + "/" + String(date.getMonth() + 1) + "/" + String(date.getFullYear()) + " " + String(date.getHours()) + ":" + String(date.getMinutes());

    if (post_id && reply_id && reply_content) {
        db.run("INSERT INTO replys_responses(post_id, reply_id, response_id, comment, time_posted) VALUES (?, ?, ?, ?, ?)", [post_id, reply_id, response_id, reply_content, date_added], (err) => {
            if (err) throw error;
            db.all(`SELECT * FROM main_posts WHERE post_id="${post_id}"`, [], (err, rows) => {
                rows.forEach((row) => {
                    var reply_count = row.replys_count;
                    var new_reply_count = reply_count + 1;
                    db.all(`UPDATE main_posts SET replys_count=${new_reply_count} WHERE post_id="${post_id}"`)
                });
            })
            res.redirect("back")
        })
    } else {
        res.send("error");
    }

})


app.get("/posts/report/:post_id", (req, res, next) => {
    var post_id = req.params.post_id;
    db.all(`SELECT * FROM reported_posts WHERE post_id="${post_id}"`, (err, rows) => {
        if (rows.length == 0) {
            db.all(`INSERT INTO reported_posts(post_id, reason) VALUES (?, ?)`, [post_id, "user reported post"])
        }
    })
    res.redirect("back")
})

app.listen(PORT, () => {
    console.log(`Listing on port ${PORT}`);
});