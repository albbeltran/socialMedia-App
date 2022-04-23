const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')

const app = express()

let sessionOptions = session({
    secret: process.env.SESSIONSECRET,
    //store session data in mongodb
    store: MongoStore.create({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    //Set 24 hour cookie duration
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})

app.use(sessionOptions)
app.use(flash())

// create a middleware to pass the session data
app.use(function(req, res, next) {
    // make out mardown function available from within ejs templates
    res.locals.filterUserHTML = function(content) {
        return sanitizeHTML(markdown.parse(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {}})
    }

    // make all error and success flash messages available from within view templates
    res.locals.errors = req.flash('errors')
    res.locals.success = req.flash('success')

    // make current user id available on the req object
    if(req.session.user) req.visitorId = req.session.user._id
    else req.visitorId = 0

    // make user session data available from within view templates
    res.locals.user = req.session.user
    next()
})

const router = require('./router')

app.use(express.urlencoded({extended:false}))
app.use(express.json())

app.use(express.static('public'))
app.set('view engine','ejs')
// app.set('views','views')

app.use('/', router)

//Exporting the app
module.exports = app