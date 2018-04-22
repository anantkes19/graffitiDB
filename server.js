'use strict';

const mongodb = require('mongodb');
const http = require('http');
const nconf = require('nconf');

// Read in keys and secrets. Using nconf use can set secrets via
// environment variables, command-line arguments, or a keys.json file.
nconf.argv().env().file('keys.json');

// Connect to a MongoDB server provisioned over at
// MongoLab.  See the README for more info.

const user = nconf.get('mongoUser');
const pass = nconf.get('mongoPass');
const host = nconf.get('mongoHost');
const port = nconf.get('mongoPort');

let uri = `mongodb://${user}:${pass}@${host}:${port}`;
if (nconf.get('mongoDatabase')) {
  uri = `${uri}/${nconf.get('mongoDatabase')}`;
}
console.log(uri);

mongodb.MongoClient.connect(uri, (err, client) => {
  if (err) {
    throw err;
  }
  const db = client.db(nconf.get('mongoDatabase'));
  // Create a simple little server.
  http.createServer((req, res) => {

    const collection = db.collection('IPs');
    const tags = db.collection('tags');

    if (req.url ==='/_tagit/sendGraffiti') {

      req.on('data', function (body) {
        const graffiti = {coords: [44.565503, -69.661869], points: body}
        tags.insert(graffiti);
      });

      res.end();

    }

    if (req.url ==='/_tagit/getGraffiti') {
      console.log("Peer connected");
      let tagList = '';
      tags.find().toArray((err, data) => {
        if (err) {
          throw err;
        }


        /*res.writeHead(200, {
          'Content-Type': 'text/plain'
        });*/

        data.forEach((tag) => {
          res.write(`${tag.points};\n`);

        });
        res.end();
      });
    }
    if (req.url === '/_ah/health') {
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      });
      res.write('OK');
      res.end();
      return;
    }
    // Track every IP that has visited this site

  }).listen(process.env.PORT || 8080, () => {
    console.log('started web process');
  });
});
