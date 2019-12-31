const express = require('express');
const app = express();
const http = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(http);

const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 5000;

const Message = require('./Message');
const mongoose = require('mongoose');

mongoose.connect(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

io.on('connection', socket => {
  // get the last 10 messages from the database.
  Message.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .exec((err, messages) => {
      if (err) return console.error(err);

      // send the latest messages to the user
      socket.emit('init', messages);
    });

  socket.on('message', msg => {
    // create a mesage with the content and the name of the user
    const message = new Message({
      content: msg.content,
      name: msg.name
    });

    // save the message to the database
    message.save(err => {
      if (err) return console.error(err);
    });

    // NOtify all other users about a new message
    socket.broadcast.emit('push', msg);
  });
});

http.listen(port, () => {
  console.log('listening on *:' + port);
});
