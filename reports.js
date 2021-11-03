// This will handle the reporting of posts and deletion of posts that break tos
const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler');

var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('./db/blogs.db');

var banned_words = ["kill", 
                    "motherfucker", 
                    "wanker", 
                    "cunt",
                    "assfuck",
                    "asslicker",
                    "twat"]

var sensitive_words = ["mong",
                       "retard",
                       "spastic",
                       "poof",
                       "Queer",
                       "fagget",
                       "faggot"]

// Setup the scheduler
const scheduler = new ToadScheduler();

// Search through every post and reply and auto report those that get flagged, and if they contain and word in the very sensitive category then it is a auto delete.
const profanityPostCheck = new Task("check for bad words", () => {
    // Query the posts
    const query = "SELECT * FROM main_posts"
    db.all(query, [], (err, rows) => {
        rows.forEach((row) => {
            const post_content = row.content.toLowerCase();
            const post_title = row.title.toLowerCase();

            for (word in sensitive_words) {
                if (post_content.includes(sensitive_words[word]) || post_title.includes(sensitive_words[word])) {
                    db.all(`DELETE FROM main_posts WHERE post_id="${row.post_id}"`)
                }
            }

            for (word in banned_words) {
                if (post_content.includes(banned_words[word]) || post_title.includes(banned_words[word])) {
                    db.all(`SELECT * FROM reported_posts WHERE post_id="${row.post_id}"`, (err, rows) => {
                        if (row.length == 0) {
                            db.all(`INSERT INTO reported_posts(post_id, reason)`, [row.post_id, "bad word usage"])
                        }
                    })
                }
            }
        })
    })
})

// Search through every reply and nested reply and auto report those that get flagged, and if they contain an word in the very sensitive category then it is a auto delete.
// UPDATE THIS SO THE REPLIES HAVE THERE OWN TABLE

const profanityRepliesCheck = new Task("check for bad words in replys", () => {
    const querys = [
        "SELECT * FROM posts_replys",
        "SELECT * FROM replys_responses"
    ];

    // Post main replies
    db.all(querys[0], [], (err, rows) => {
        rows.forEach((row) => {
            const reply_comment = row.comment.toLowerCase();
            for (word in sensitive_words) {
                if (reply_comment.includes(sensitive_words[word])) {
                    db.all(`DELETE FROM posts_replys WHERE comment="${reply_comment}"`)
                }
            }
    
            for (word in banned_words) {
                if (reply_comment.includes(banned_words[word])) {
                    db.all(`SELECT * FROM reported_posts WHERE post_id="${row.post_id}"`, (err, rows) => {
                        if (row.length == 0) {
                            db.all(`INSERT INTO reported_posts(post_id, reason)`, [row.post_id, "bad word usage in reply"])
                        }
                    })
                }
            }
        })
    })

    // Nested replies
    db.all(querys[1], [], (err, rows) => {
        rows.forEach((row) => {
            const reply_comment = row.comment.toLowerCase();
            for (word in sensitive_words) {
                if (reply_comment.includes(sensitive_words[word])) {
                    db.all(`DELETE FROM replys_responses WHERE comment="${reply_comment}"`)
                }
            }
    
            for (word in banned_words) {
                if (reply_comment.includes(banned_words[word])) {
                    db.all(`SELECT * FROM reported_posts WHERE post_id="${row.post_id}"`, (err, rows) => {
                        if (row.length == 0) {
                            db.all(`INSERT INTO reported_posts(post_id, reason)`, [row.post_id, "bad word usage in reply"])
                        }
                    })
                }
            }
        })
    })
})


// Run the tasks every minute
const runProfanityCheck = new SimpleIntervalJob({minutes: 1}, profanityPostCheck);
const runRepliesProfanityCheck = new SimpleIntervalJob({minutes: 1}, profanityRepliesCheck);


scheduler.addSimpleIntervalJob(runProfanityCheck);
scheduler.addSimpleIntervalJob(runRepliesProfanityCheck);