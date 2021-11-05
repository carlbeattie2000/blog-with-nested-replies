var express = require('express'),
    router = express.Router(),
    sqlite3 = require('sqlite3').verbose(),
    session = require('express-session'),
    db = new sqlite3.Database('./db/blogs.db');

router.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: true,
    })
);

router.get("/login", (req, res) => {
    res.render("admin-login")
})

router.post("/login/auth", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (email && password) {
        var query = `SELECT * FROM admins WHERE username="${email}"`
        db.all(query, [], (error, rows) => {
            if (rows.length > 0) {
                req.session.loggedin = true;
                res.redirect("/admin-dashboard")
            } else {
                res.redirect("/login")
            }
            res.end();
        })
    } else {
        res.redirect("/login")
    }
})

router.get("/admin-dashboard", (req, res) => {
    if (req.session.loggedin) {
        var stats = [];
        
        var query = "SELECT * FROM website_stats"
        db.all(query, [], (err, results) => {
            if (err) throw error;
            results.forEach((row) => {
                var stat_object = {
                    posts: row.posts_count,
                    replies: row.replies_count
                }

                stats.push(stat_object)
            })
            res.render("admin_dashboard", {main_stats: stats})
        })
    } else {
        res.redirect("/")
    }
})

// Give the admin the ability to close replies to a post
router.get("/admin/close-replies/:post_id", (req, res, next) => {
    const post_id = req.params.post_id;
    const query = `UPDATE main_posts SET areRepliesClosed=1 WHERE post_id="${post_id}"`
    db.all(query, (err) => {
        res.redirect("back");
    })
})

// Give the admin the ability to delete a post that they think breaks tos/rules
router.get("/admin/delete-post/:post_id", (req, res, next) => {
    const post_id = req.params.post_id;
    const query = `DELETE FROM main_posts WHERE post_id="${post_id}"`;
    db.all(query, (err) => {
        const query = `DELETE FROM posts_replys WHERE post_id="${post_id}"`;
        db.all(query, (err) => {
            const query = `DELETE FROM replys_responses WHERE post_id="${post_id}"`;
            db.all(query, (err) => {
                res.redirect("back")
            })
        })
    })
})


module.exports = router