const express = require('express');
const bcrypt = require('bcrypt');
const basicAuth = require('express-basic-auth');
const cookieParser = require('cookie-parser');  // Nødvendig for å kunne bruke cookies
const path = require('path');

let returnmessage = ""

require("dotenv").config();

const app = express();

app.use(require("cors")())
// cors = require("cors");
// app.use(cors())
app.use(require('body-parser').json()) //Parses the text as JSON and exposes the resulting object on req.body.
// https://stackoverflow.com/questions/38306569/what-does-body-parser-do-with-express

// Brukerkontoer er overført til mongoDB.
// const auth = basicAuth({
//   users: {
//     admin: '123',
//     user: '456',
//   },
// });

const auth = basicAuth({
  authorizer: myAuthorizer,                         // My own function for authorization
  authorizeAsync: true,                             // Accept async - needed for mongoDB
  unauthorizedResponse: getUnauthorizedResponse,    // Will run when cb(null, false) - line 43, 49 and 57
});

function getUnauthorizedResponse(req) {
  if (req.auth.password==="") {returnmessage = "Please fill inn password!"}
  if (req.auth.user==="") {returnmessage = "Please fill inn username!"}
  return returnmessage
}

async function myAuthorizer(username, password, cb) {
  const id = await User.exists()
  if (id === null) {
    returnmessage = "No users in database!"
    return cb(null, false)
  }
  const doc = await User.findById(id)
  const bruker = doc.userList.filter((item) => item.username === username)
  if (!bruker.length) {
    returnmessage = "User not in database!"
    return cb(null, false)
  }
  const userMatches = basicAuth.safeCompare(username, bruker[0].username)
  const passwordMatches = await bcrypt.compare(password, bruker[0].password)
  if (!passwordMatches) returnmessage = "Wrong password!"
  if (userMatches & passwordMatches)
    return cb(null, true)
  else
    return cb(null, false)
}

const PORT = process.env.PORT || 5000; // Bruk det som er satt i environment variable (fila .env) eller hvis det ikke er satt noe, bruk port 5000

app.use(cookieParser('82e4e438a0705fabf61f9854e3b575af'));

app
  .use(express.static(path.join(__dirname, '/client/build')))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

app.post('/register', async (req, res) => {
  // res.json({username: req.body.username})
  res.send(await saveNewUser(req.body))
})

app.patch('/changePw', async (req, res) => {
  res.send(await updateUser(req.body))
})

app.delete('/deleteUser', async (req, res) => {
  res.send(await deleteUser(req.body))
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/client/build/index.html'));
});

app.get('/authenticate', auth, (req, res) => {
  const options = {
    httpOnly: true,
    signed: true,
  };

  console.log("Logged in user: " + req.auth.user);
  res.cookie('name', req.auth.user, options).send({ screen: req.auth.user });
});

app.get('/read-cookie', (req, res) => {
  console.log(req.signedCookies.name)
  if (req.signedCookies.name === req.auth.user) {
    res.send({ screen: req.auth.user });
  } else {
    res.send({ screen: 'auth' });
  }
});

app.get('/clear-cookie', (req, res) => {
  res.clearCookie('name').end();
});

app.get('/get-data', async (req, res) => {
  if (req.signedCookies.name) {
    const id = await Todo.exists()
    console.log(id)
    console.log("hjghj")
    if (id) {
      let todos = await getData(id)
      res.send(todos);
    } else {
      res.send([]);
      res.end();
    }
  }
});

app.put('/put-data', async (req, res) => {
  if ((req.signedCookies.name === 'admin') || (req.signedCookies.name === 'user')) {
    let data = req.body
    res.send(data.todolist);
    const id = await Todo.exists()
  
    if (!id) {
      await saveTodo(data.todolist)
    } else {
      await updateTodo(id, data.todolist)
    }
  } else {
    res.end();
  }
});


const url = process.env.DATABASE_URI;

const mongoose = require('mongoose')
const Todo = require("./Todo")
const User = require("./User")

try {
  mongoose.connect(url, {
    useNewUrlParser: true,      //removes warning regarding old urlparser: https://mongoosejs.com/docs/5.x/docs/deprecations.html
    useUnifiedTopology: true,   //removes support for several connection options that are no longer relevant with the new topology engine
  });
  console.log(`MongoDB is running!`);
} catch (error) {
  console.error('Error connecting to MongoDB:', error);
}

async function saveTodo(task) {
  try {
    const todolist = await Todo.create({ todolist: task })
  } catch(e) {
    console.log(e.message)
  }
}

async function updateTodo(obId, task) {
  try {
    const todo = await Todo.findByIdAndUpdate(obId, { todolist: task })
  } catch(e) {
    console.log(e.message)
  }
}

async function getData(obId) {
  try {
    const data = await Todo.findById(obId)
    return data.todolist
  } catch (e) {
    console.log(e.message)
  }
}

async function saveNewUser(newUser) {
  newUser.password = await bcrypt.hash(newUser.password, 10)
  try {
    const id = await User.exists()
    if (!id) {
      const doc = await User.create({ userList: newUser })
      return 'User "'+ newUser.username + '" created!'
    } else {
      const doc = await User.findById(id)
      
      if (!doc.userList.filter((item) => item.username === newUser.username).length) {
        doc.userList.push(newUser)
        await doc.save()
        return 'User "'+ newUser.username + '" created!'
      } else {
        return 'User "'+ newUser.username + '" already exist!'
      }
    }
  } catch(e) {
    console.log(e.message)
  }
}

async function updateUser(newUserData) {
  newUserData.password = await bcrypt.hash(newUserData.password, 10)
  try {
    const id = await User.exists()
    const doc = await User.findById(id)
    doc.userList[doc.userList.findIndex(item => item.username === newUserData.username)].password = newUserData.password
    await doc.save()
    return 'Password updated!'
    } catch(e) {
    console.log(e.message)
  }
}

async function deleteUser(userData) {
  
  try {
    const id = await User.exists()                                                                  // Get id of the User database
    const doc = await User.findById(id)                                                             // Get the document (array) of users
    if (userData.username === "admin") {                                                            // Provide deleting the admin account
      return "You can't delete the admin account!"
    } else if (!(doc.userList.findIndex(item => item.username === userData.username) === -1)) {     // Check if user exist
      doc.userList.splice(doc.userList.findIndex(item => item.username === userData.username), 1)   // Delete user
      await doc.save()                                                                              // Save updated userarray
      return 'User ' + userData.username + ' deleted!'
    } else return 'User ' + userData.username + ' not found!'
    } catch(e) {
    console.log(e.message)
  }
}

// const Example = require("./Example")

// // run()
// async function run() {
//   try {
// 	  const example = await Example.create({ name: "Kyle", age: 26})
// 	  console.log(example)
//   } catch(e) {
//     console.log(e.message)
//   }
// }

// run()
// async function run() {
//   try {
//     // Kan velge å bruke user.save() eller User.create
//     // const user = new User({ name: "Arild3", age: 25 })
//     // await user.save()
//     const user = await User.create({ name: "Arild5", age: 28, email: "khkol@dss.com", })
//     const user2 = await User.create({
//       name: "Arild6",
//       age: 26,
//       email: "khkol@dss.com",
//       hobbies: ["Football", "Bowling"],
//       address1: {
//         street: "Main Street 1",
//       },
//       address2: {
//         street: "Main Street 2",
//       },
//     })
//     console.log(user2)
//   } catch(e) {
//     console.log(e.message)
//   }
// }

// // run3()
// async function run3() {
//   try {
//     todo = await Todo.find({ name: "Arild6" })
//     console.log(todo)
//     return todo
//   } catch (e) {
//     console.log(e.message)
//   }
// }
