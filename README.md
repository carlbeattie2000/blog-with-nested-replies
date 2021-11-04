# anonymous-blog with replies an nested replies

[![N|Solid](https://global.download.synology.com/download/Package/img/Node.js_v12/12.20.1-0021/thumb_256.png)](https://nodesource.com/products/nsolid)

A simple blog page, inspired a little by the likes of 4chan. Nothing impressive just an idea i wanted to create.

- Nodejs
- Express
- SQLite
- Pug

## Features

- Post without having to login and remain anonymous
- Add images, videos and edit your text when creating a new post
- Post's by default are deleted after 24 Hours.(added)
- Reply to posts anonymously
- Nested replies
- Simple profanity filter with two categories, soft | hard. (soft is flagged for manual review, hard is instantly deleted)
- Pagination

## Installation

4head-anonymous-blog requires [Node.js](https://nodejs.org/) v10+ to run.

Install the dependencies and devDependencies and start the server.

```sh
npm i
npm start || npm run dev
```

## Plugins

4head-anonymous-blog is currently extended with the following plugins.
Instructions on how to use them in your own application are linked below.

| Plugin | README |
| ------ | ------ |
| Summernote | https://summernote.org/getting-started/ |
| Express | https://expressjs.com/en/starter/installing.html |
| SQLite | https://www.npmjs.com/package/sqlite3 |
| Crypto | https://nodejs.org/api/crypto.html |
| Pug | https://pugjs.org/api/getting-started.html |

## License

MIT
