const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler');
const { post } = require('./admin');
var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('./db/blogs.db');

const scheduler = new ToadScheduler();

const hasDeletionTimeExpired = new Task('delete post timer', () => {
    var query = "SELECT * FROM main_posts";

    db.all(query, [], (err, rows) => {
        rows.forEach((row) => {
            if (row.timeSincePosted > row.deletion_date) {
                // delete the post
                db.run(`DELETE FROM main_posts WHERE post_id="${row.post_id}"`, (err) => {
                    if (err) throw error
                    db.run(`DELETE FROM posts_replys WHERE post_id="${row.post_id}"`, (err) => {if (err) throw error})
                });
            } else {
                // update the time since posted db field
                var row_update_value = row.timeSincePosted + 1;
                db.run(`UPDATE main_posts SET timeSincePosted="${row_update_value}" WHERE post_id="${row.post_id}"`, (err) => {if(err) throw error});
            }
        })
    })
});

const updatedStatsDatabase = new Task('update stats database', () => {
    var querys = [
        "SELECT * FROM main_posts",
        "SELECT * FROM posts_replys",
        "SELECT * FROM replys_responses"
    ];

    db.all(querys[0], [], (err, results) => {
        if (err) throw error;
        const posts_count = results.length
        db.all(querys[1], [], (err, results) => {
            if (err) throw error;
            const posts_replies = results.length
            db.all(querys[2], [], (err, results) => {
                var total_replies = posts_replies + results.length
                var query = `UPDATE website_stats SET posts_count="${posts_count}", replies_count="${total_replies}"`
                db.all(query, (err) => {if (err) throw error})
            })
        })
    })
})

const job = new SimpleIntervalJob({hours: 1}, hasDeletionTimeExpired);
const updateWebsiteStats = new SimpleIntervalJob({minutes: 2}, updatedStatsDatabase);


scheduler.addSimpleIntervalJob(job);
scheduler.addSimpleIntervalJob(updateWebsiteStats);

process.on('SIGINT', function() {
    server.close(function() {
        scheduler.stop()
        process.exit(0);
    });
});
