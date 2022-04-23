const Post = require('../models/Post')

exports.viewCreateScreen = function(req, res){
    res.render('create-post', {title: 'Create post'})
}

exports.create = async function(req, res) {
    try {
        let post = new Post(req.body, req.session.user._id)
        let newId = await post.create()
        req.flash('success', 'New post succesfully created.')
        req.session.save(() => res.redirect(`/post/${newId}`))
    } catch(errors) {
        errors.forEach(error => req.flash('errors', error))
        req.session.save(() => res.redirect('/create-post'))
    }
}

// view the post
exports.viewSingle = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render('single-post-screen', {post: post, title: post.title})
    } catch {
        res.render('404')
    }
}

exports.viewEditScreen = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        if (post.isVisitorOwner) {
            res.render("edit-post", {post: post, title: 'Edit post'})
        } else {
            req.flash("errors", "You do not have permission to perform that action.")
            req.session.save(() => res.redirect("/"))
        }
    } catch {
        res.render("404")
    }
}
  
exports.edit = async function(req, res) {
    try {
        let post = new Post(req.body, req.visitorId, req.params.id)
        result = await post.update()
        // the post was succesfully updated in the database
        if(result == 'success') {
            // post was updated in db
            req.flash('success', 'Post succesfully updated.')
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}`)
            })
        // user did have permission, but there were validation errors
        } else {
            post.errors.forEach(function(error){
                req.flash('errors', error)
            })
            req.session.save(function() {
                res.redirect(`post/${req.params.id}/edit`)
            })
        }
    } catch {
        // a post with the requested id does not exist
        // or if the current visitor is not the owner of the requested post
        req.flash('errors', 'You do not have permission to perform that action.')
        req.session.save(function() {
            res.redirect('/')
        })
    }
}

exports.delete = async function(req, res) {
    try{
        await Post.delete(req.params.id, req.visitorId)
        req.flash('success', 'Post successfully deleted.')
        req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
    } catch {
        req.flash('errors', 'You do not have permission to perform that action.')
        req.session.save(() => res.redirect('/'))
    }
}

exports.search = async function(req, res) {
    // searchTerm was defined in the search.js file
    try {
        let posts = await Post.search((req.body.searchTerm))
        res.json(posts)
    } catch {
        // if there are no posts matching the search, send an empty array
        res.json([])
    }
}