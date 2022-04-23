const bcrypt = require('bcryptjs')
const usersCollection = require('../db').db().collection('users')
const validator = require('validator')
const md5 = require('md5')

let User = class {
    constructor(data, getAvatar) {
        this.data = data
        this.errors = []
        if(getAvatar == undefined) getAvatar = false
        if(getAvatar == true) this.getAvatar
    }
}

User.prototype.cleanUp = function() {
    //When a user types a object, array, etc, asign empty to that input due the validate function
    if(typeof(this.data.username) != 'string') this.data.username = ''
    if(typeof(this.data.email) != 'string') this.data.email = ''
    if(typeof(this.data.password) != 'string') this.data.password = ''

    //get rid of any bogus properties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        if(this.data.username == '') this.errors.push('You must provide a username')
        if(this.data.username != '' && !validator.isAlphanumeric(this.data.username)) this.errors.push('Username can only contain numbers and letters')
        if(!validator.isEmail(this.data.email)) this.errors.push('You must provide a valid email adress')
        if(this.data.password == '') this.errors.push('You must provide a password')
        if(this.data.password.length > 0 && this.data.password.length < 12) this.errors.push('Password must be at least 12 characters')
        if(this.data.password.length > 50) this.errors.push('Password cannot exceed 100 characters.')
        if(this.data.username.length > 0 && this.data.username.length < 3) this.errors.push('Username must be at least 12 characters')
        if(this.data.username.length > 15) this.errors.push('Username cannot exceed 100 characters.')
    
        //Only if username is valid then check to see it it's already taken
        if(this.data.username.length > 2 && this.data.username.length <31 && validator.isAlphanumeric(this.data.username)) {
            let usernameExists = await usersCollection.findOne({username: this.data.username})
            //if mongoDB found the username
            if(usernameExists) this.errors.push('That username is already taken.')
        }
    
        //Only if email is valid then check to see it it's already taken
        if(validator.isEmail(this.data.email)) {
            let emailExists = await usersCollection.findOne({email: this.data.email})
            //if mongoDB found the username
            if(emailExists) this.errors.push('That email is already being used.')
        }
        resolve()
    })
}

User.prototype.login = function() {
    //Use arrow function because does not manipulate the this keyword
    return new Promise((resolve,reject) => {
        // Check if the values are strings of text
        this.cleanUp()
        usersCollection.findOne({username: this.data.username}).then(attemptedUser => {
            //Check if the attemptedUser exists
            if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)){
                this.data = attemptedUser
                this.getAvatar()
                resolve('Congrats!')
            }else{
                reject('Invalid username / password')
            }
        }).catch(() => {
            reject('Please try it again later.')
        })
    })
}

User.prototype.register = function() {
    return new Promise(async (resolve,reject) => {
        //Setp #1: Validate user data
        this.cleanUp()
        await this.validate()
    
        /*Step #2: Only if there are no validation errors then
        save the user data into a database*/
    
        //If there are no validation errors
        if(!this.errors.length){
            //Hash user password
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            //Inserting the currect data object to the db
            usersCollection.insertOne(this.data)
            this.getAvatar()
            resolve()
        } else{
            reject(this.errors)
        }
    })
}

User.prototype.getAvatar = function() {
    //Create the avatar property to the currect user object
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

// Find the username to load the profile page
User.findByUsername = function(username) {
    return new Promise(async function(resolve, reject) {
        if(typeof(username) != "string"){
            reject()
            return
        }
        try {
            let userDoc = await usersCollection.findOne({username: username})
            // If the user was found
            if(userDoc) {
                // create an object with the User found
                userDoc = new User(userDoc, true)
                // delete unnecesary properties such as password and email
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.data.avatar
                }
                resolve(userDoc)
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

module.exports = User