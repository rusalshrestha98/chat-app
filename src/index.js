// load in the core node modules
const path = require('path')
const http = require('http')
// load in npm packages
const express = require ('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
// load in modules
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// create the express app and store it in a variable
const app = express()

// create a new web server using an http method and passing in the express app 
const server = http.createServer(app)

// create a new instance of socketio and pass in http server
// we had to use the http core module since socketio requires it
const io = socketio(server)

// create port variable to start the app on 
const port = process.env.PORT || 3000

// store the public path directory
const publicDirectoryPath = path.join(__dirname, '../public')

// serve up the public directory
app.use(express.static(publicDirectoryPath))

// function to run for each client connection lifecycle
io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    // listener that sends event to remaining clients if a new client connects
    socket.on('join', (options, callback) => {
        // add the user to the room
        const { error, user } = addUser({ id: socket.id, ...options })

        // if error when adding user to a room, return error to the client
        if (error) {
            return callback(error)
        }

        // if no error when adding user to a room
        // socket.join() allows us to join a given chat room
        socket.join(user.room)

        // send message to client that just joined
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
    
        // send message to all clients IN THIS ROOM except newly joined client
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        
        // send all the clients in a room a list of all the users in their room
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        // callback without error lets client know that everything was successful
        callback()
    })
    
    // receive message event from a client and send it back out to all clients
    socket.on('sendMessage', (message, callback) => {
        // get the user object for the client that is currently joined
        const user = getUser(socket.id)

        // filter for profanity in the message from the client
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback('Delivered from server!')
    })

    // receive location event from a client and send it back out to all other clients
    socket.on('sendLocation', (coords, callback) => {
        // get the user object for the client that is currently joined
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    // listener that sends event to remaining clients if a client gets disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            // tell remaining users in the room if a user has left
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            // send the room the updated list of users in the room
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

// start the app on a port using server.listen(), not app.listen()
server.listen(port, () => {
    console.log(`Server is up an running on ${port}!`)
})