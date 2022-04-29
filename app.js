const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')
const CSRF = require('csurf')
const app = express()

app.use(express.urlencoded({extended:false}))
app.use(express.json())

// set up a separate route for the API requests
// we declare it before all the other data because we do not need that data to test our APIs
app.use('/api', require('./router-api'))

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

app.use(express.static('public'))
app.set('view engine','ejs')
// app.set('views','views')

// enable a csrf token to the requests
app.use(CSRF())

// set a middleware to use the csrf token 
app.use(function(req, res, next){
    // set a csrf token for all views through the csrf() token method
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use('/', router)

app.use(function(err, req, res, next) {
    if(err) {
        if(err.code == 'EBADCSRFTOKEN') {
            req.flash('errors', 'Cross site request forgery detected.')
            req.session.save(() => res.redirect('/'))
        } else {
            res.render('404')
        }
    }
})

// Create a server with the app as it handler to leverage the sockets
const server = require('http').createServer(app)
const io = require('socket.io')(server)

// Make our express session data available from within the context of socket
io.use(function(socket, next) {
    sessionOptions(socket.request, socket.request.res, next)
})

io.on('connection', function(socket) {
    // only if the user is logged in
    if(socket.request.session.user) {
        let user = socket.request.session.user

        // send the principal user data when the connection is established
        socket.emit('welcome', {username: user.username, avatar: user.avatar})

        socket.on('chatMessageFromBrowser', function(data) {
            // Emit an event to all connected users except the socket connection that sent the data
            socket.broadcast.emit('chatMessageFromServer', {
                message: sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: {}}),
                username: user.username,
                avatar: user.avatar
            })
        })
    }
})

//Exporting the server
module.exports = server