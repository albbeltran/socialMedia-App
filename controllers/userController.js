const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')

function mustBeLoggedIn(req, res, next){
    // If the user session exists
    if(req.session.user) {
        next()
    // If the user session does not exist
    } else {
        req.flash('errors', 'You must be logged in to perform that action.')
        req.session.save(function() {
            res.redirect('/')
        })
    }
}

async function login(req,res){
    try{
        let user = new User(req.body)
        await user.login()
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
        // Until the session data is saved, redirect to homepage
        req.session.save(() => res.redirect('/'))
    } catch(error){
        // req.session.flash.errors = [error]
        req.flash('errors', error)
        // Redirect to show the flash messages
        req.session.save(() => res.redirect('/'))
    }
}

async function logout(req,res){
    // When logout, destroy the session and redirect to homepage
    await req.session.destroy()
    res.redirect('/')
}

register = async (req, res) => {
    let user = new User(req.body);
    try {
        await user.register()
        req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id};
        req.session.save(function(){
            res.redirect('/');
        })
    } catch(regErrors) {
        regErrors.forEach(function(error) {
            req.flash('regErrors', error);
        })
        req.session.save(function() {
            res.redirect('/');
        })
    }
};

async function home(req,res) {
    if(req.session.user) {
        // fetch feed of posts for current user
        let posts = await Post.getFeed(req.session.user._id)
        res.render('home-dashboard', {posts: posts})
    } else {
        res.render('home-guest', {regErrors: req.flash('regErrors')})
    }
}

// check if the user required in the url exists
async function ifUserExists(req, res, next) {
    try {
        let userDocument = await User.findByUsername(req.params.username)
        // create a req property to save the userDocument and use it in the profilePostsScreen function 
        req.profileUser = userDocument
        next()
    } catch {
        res.render('404')
    }
}

// show the user profile posts
async function profilePostsScreen(req, res) {
    // ask our post model for posts by a certain author id
    try {
        let posts = await Post.findByAuthorId(req.profileUser._id)

        res.render('profile', {
            currentPage: "posts",
            posts: posts,
            followers: req.followerCount,
            following: req.followingCount,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isVisitorsProfile: req.isVisitorsProfile,
            isFollowing: req.isFollowing,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    } catch {
        res.render('404')
    }
}

// show the user profile followers
async function profileFollowersScreen(req, res) {
    try {
        let followers = await Follow.getFollowersById(req.profileUser._id)

        res.render('profile-followers', {
            currentPage: "followers",
            posts: req.postCount,
            followers: followers,
            following: req.followingCount,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isVisitorsProfile: req.isVisitorsProfile,
            isFollowing: req.isFollowing,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    } catch {
        res.render('404')
    }
}

// show the user profile following
async function profileFollowingScreen(req, res) {
    try {
        let following = await Follow.getFollowingById(req.profileUser._id)

        res.render('profile-following', {
            currentPage: "following",
            posts: req.postCount,
            followers: req.followerCount,
            following: following,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isVisitorsProfile: req.isVisitorsProfile,
            isFollowing: req.isFollowing,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    } catch {
        res.render('404')
    }
}


async function sharedProfileData(req, res, next) {
    let isVisitorsProfile = false
    let isFollowing = false
    if(req.session.user) {
        // check if the visitor id is the same as the visitor profile
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
        // req.profileUser._id is the current profile id
        // req.visitorId is the current visitor id 
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
    }   
    
    req.isVisitorsProfile = isVisitorsProfile
    req.isFollowing = isFollowing

    // retrieve post, follower and following counts
    let postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
    let followerCountPromise = Follow.countFollowersById(req.profileUser._id)
    let followingCountPromise = Follow.countFollowingById(req.profileUser._id)

    // we use promise.all as there is no need to wait for each promise individually, because they are not related to each other
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])

    req.postCount = postCount
    req.followerCount = followerCount
    req.followingCount = followingCount

    next()
}

exports.mustBeLoggedIn = mustBeLoggedIn
exports.login = login
exports.logout = logout
exports.register = register
exports.home = home
exports.ifUserExists = ifUserExists
exports.profilePostsScreen = profilePostsScreen
exports.profileFollowersScreen = profileFollowersScreen
exports.profileFollowingScreen = profileFollowingScreen
exports.sharedProfileData = sharedProfileData