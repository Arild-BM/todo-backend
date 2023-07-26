const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    id: String,
})

const userListSchema = new mongoose.Schema({
    userList: [userSchema]
})

module.exports = mongoose.model("User", userListSchema)