const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')
let db = null

const InitializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Is Starting At https://localhost:3000')
    })
  } catch (error) {
    console.log(`DB Error ${error.message}`)
  }
}
InitializeDbAndServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = `select * from user where username=${username}`
  const userData = await db.get(user)
  if (userData === undefined) {
    let postNewQuery = `insert into user(username,name,password,gender,location) values("${username}","${name}","${hashedPassword}","${gender}","${location}")`
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      let newUserDetails = await db.run(postNewQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const q = `select * from user where username=${username}`
  const dbUser = await db.get(q)
  if (dbUser === undefined) {
    request.status(400)
    request.send('Invalid user')
  } else {
    const checkPassword = await bcrypt.compare(password, dbUser.password)
    if (checkPassword === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const q = `select * from user where username=${username}`
  const dbUser = await db.get(q)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const comparePassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (comparePassword === true) {
      const lengthOfPass = newPassword.length
      if (lengthOfPass < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const encryptedPass = await bcrypt.hash(newPassword, 10)
        const updateQ = `update user set password=${encryptedPass} where username=${username}`
        await db.run(updateQ)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
