const Follow = require('../models/Follow')

exports.addFollow = async function(req, res) {
    try {
        let follow = new Follow(req.params.username, req.visitorId)
        await follow.create()
        req.flash('success', `Successfully followed ${req.params.username}`)
        req.session.save(() => res.redirect(`/profile/${req.params.username}`))
    } catch(errors) {
        // If the user is trying to follow some weird o malicious
        errors.forEach(error => req.flash('errors', error))
        // we do not want to redirect the user to that weird profile
        req.session.save(() => res.redirect('/'))
    }
}

exports.removeFollow = async function(req, res) {
    try {
        let follow = new Follow(req.params.username, req.visitorId)
        await follow.delete()
        req.flash('success', `Successfully stopped following ${req.params.username}`)
        req.session.save(() => res.redirect(`/profile/${req.params.username}`))
    } catch(errors) {
        // If the user is trying to follow some weird o malicious
        errors.forEach(error => req.flash('errors', error))
        // we do not want to redirect the user to that weird profile
        req.session.save(() => res.redirect('/'))
    }
}