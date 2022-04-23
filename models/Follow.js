const usersCollection = require('../db').db().collection('users')
const followsCollection = require('../db').db().collection('follows')
const { promiseImpl } = require('ejs')
const { ObjectId } = require('mongodb')
const User = require('./User')

let Follow = class {
    constructor(followedUsername, authorId) {
        this.followedUsername = followedUsername
        this.authorId = authorId
        this.errors = []
    }

    cleanUp() {
        if(typeof(this.followedUsername) != "string") this.followedUsername = ''
    }

    async validate(action) {
        // followedUsername must exists in database
        let followedAccount = await usersCollection.findOne({username: this.followedUsername})
        // if the followed user was found
        if(followedAccount) {
            this.followedId = followedAccount._id
        } else {
            this.errors.push('You cannot follow a user that does not exist.')
        }

        let doesFollowAlreadyExist = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
        // if you already follow the user and want to follow them again
        if(action == 'create') {
           if (doesFollowAlreadyExist) this.errors.push('You are already following this user.')
        }

        // if you do not follow the user and want to unfollow them
        if(action == 'delete') {
            if (!doesFollowAlreadyExist) this.errors.push('You cannot stop following someone you do not already follow.')
        }

        // should not be able to follow yourself
        if(this.followedId.equals(this.authorId)) {
            if (!doesFollowAlreadyExist) this.errors.push('You cannot follow yourself.')
        }
    }

    create() {
        return new Promise(async (resolve, reject) => {
            this.cleanUp()
            await this.validate('create')

            if(!this.errors.length) {
                await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
                resolve()
            } else {
                reject(this.errors)
            }
        })
    }

    delete() {
        return new Promise(async (resolve, reject) => {
            this.cleanUp()
            await this.validate('delete')

            if(!this.errors.length) {
                await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
                resolve()
            } else {
                reject(this.errors)
            }
        })
    }
}

Follow.isVisitorFollowing = async function(followedId, visitorId) {
    let followDoc = await followsCollection.findOne({followedId: followedId, authorId: ObjectId(visitorId)})
    if(followDoc) {
        return true
    } else {
        return false
    }
}

Follow.getFollowersById = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let followers = await followsCollection.aggregate([
                {$match: {followedId: id}},
                // operation Lookup - Allows to lookup documentos from another collection
                {$lookup: {from: 'users', localField: 'authorId', foreignField: '_id', as: 'userDoc'}},
                // use the project operation to select the properties we are interested in finding
                {$project: {
                    // use the arrayElemAt operation to convert the array we are interested in to an object
                    username: {$arrayElemAt: ['$userDoc.username', 0]},
                    email: {$arrayElemAt: ['$userDoc.email', 0]}
                }}
            ]).toArray()

            followers = followers.map(function(follower) {
                console.log(follower)
                // create a user to get the avatar with the email adress
                let user = new User(follower, true)
                return {
                    username: follower.username,
                    avatar: user.avatar
                }
            })

            resolve(followers)
        } catch {
            reject()
        }
    })
}

Follow.getFollowingById = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let following = await followsCollection.aggregate([
                {$match: {authorId: id}},
                // operation Lookup - Allows to lookup documentos from another collection
                {$lookup: {from: 'users', localField: 'followedId', foreignField: '_id', as: 'userDoc'}},
                // use the project operation to select the properties we are interested in finding
                {$project: {
                    // use the arrayElemAt operation to convert the array we are interested in to an object
                    username: {$arrayElemAt: ['$userDoc.username', 0]},
                    email: {$arrayElemAt: ['$userDoc.email', 0]}
                }}
            ]).toArray()

            following = following.map(function(follow) {
                console.log(follow)
                // create a user to get the avatar with the email adress
                let user = new User(follow, true)
                return {
                    username: follow.username,
                    avatar: user.avatar
                }
            })

            resolve(following)
        } catch {
            reject()
        }
    })
}

Follow.countFollowersById = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let followerCount = await followsCollection.countDocuments({followedId: id})
            resolve(followerCount)
        } catch {
            reject()
        }
    })
}

Follow.countFollowingById = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let followingCount = await followsCollection.countDocuments({authorId: id})
            resolve(followingCount)
        } catch {
            reject()
        }
    })
}

module.exports = Follow