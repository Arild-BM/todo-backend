const mongoose = require("mongoose")

const todoSchema = new mongoose.Schema({
    todo: String,
    active: Boolean,
    completed: Boolean,
    id: String,
})

const todoListSchema = new mongoose.Schema({
    todolist: [todoSchema]
})

module.exports = mongoose.model("Todo", todoListSchema)