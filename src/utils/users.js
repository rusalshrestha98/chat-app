const users = []

const addUser = ({ id, username, room }) => {
    // clean the data - remove spaces and make lowercase
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // validate the data to ensure they exist
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    // check for existing user in the users array
    const existingUser = users.find((user) => {
        // return true if the user already exists
        // return false if the user does not exist
        return user.room === room && user.username === username
    })

    // validate username
    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    // store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    // returns -1 if match is found; returns 0 or greater if a match isn't found
    const index = users.findIndex((user) => user.id === id)

    // remove the user at the index if a match is ound
    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}