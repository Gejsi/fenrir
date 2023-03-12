const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;
mongoose.connect('DB_URL', { dbName: 'todo' }, (err) => {
    if (!err) {
        console.log('Connected to database');
    }
    else {
        console.log(err);
    }
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
const ToDoSchema = new mongoose.Schema({
    title: String,
    description: String,
    createdBy: String,
    createAt: { type: Date, default: Date.now() }
});
const toDo = mongoose.model('ToDo', ToDoSchema);
//Create To-Do
app.post('/', (req, res) => {
    const { title, description, createdBy } = req.body;
    var toDoAdd = new toDo({
        title: title,
        description: description,
        createdBy: createdBy
    });
    toDoAdd.save((err, todo) => {
        if (err) {
            res.status(500).json({
                err
            });
        }
        else {
            res.status(201).json({
                message: 'To-Do has been created',
                todo
            });
        }
    });
});
//View Single To-Do
app.get('todos/:todo_id', (req, res) => {
    const { todo_id } = req.params;
    toDo.findById(todo_id, (err, toDo) => {
        if (err) {
            res.status(500).json({
                err
            });
        }
        else {
            res.status(200).json({
                message: 'To-Do',
                toDo
            });
        }
    });
});
//Update Single To-Do
app.patch('todos/:todo_id', (req, res) => {
    const { todo_id } = req.params;
    const { title, description, createdBy } = req.body;
    toDo.findByIdAndUpdate(todo_id, {
        title: title,
        description: description,
        createdBy: createdBy
    }, (err, toDo) => {
        if (err) {
            res.status(500).json({
                err
            });
        }
        else {
            res.status(200).json({
                message: 'To-Do updated',
                toDo
            });
        }
    });
});
//Remove Single To-Do
app.delete('todos/:todo_id', (req, res) => {
    const { todo_id } = req.params;
    toDo.findByIdAndDelete(todo_id, (err, toDo) => {
        if (err) {
            res.status(500).json({
                err
            });
        }
        else {
            res.status(200).json({
                message: 'To-Do has been removed',
                toDo
            });
        }
    });
});
