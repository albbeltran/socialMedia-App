const postsCollection = require('../db').db().collection('posts')
const folowsCollection = require('../db').db().collection('follows')
const ObjectId = require('mongodb').ObjectId
const User = require('./User')
const sanitizeHTML = require('sanitize-html')

let Post = class {
    constructor(data, userId, requestedPostId) {
        this.data = data
        this.userId = userId
        this.errors = []
        this.requestedPostId = requestedPostId
    }

    cleanUp() {
        if(typeof(this.data.title) != "string") this.data.title = ''
        if(typeof(this.data.body) != "string") this.data.title = ''
    
        // get rid of any bogus properties
        this.data = {
            title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
            body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
            // save the time the post was created
            createdDate: new Date(),
            author: ObjectId(this.userId)
        }
    }

    validate() {
        if(this.data.title == '') this.errors.push('You must provide a title.')
        if(this.data.body == '') this.errors.push('You must provide post content.')
    }

    create() {
        return new Promise(async (resolve, reject) => {
            this.cleanUp()
            this.validate()
            // if errors array is empty
            if(!this.errors.length) {
                // save post into database
                try {
                    let info = await postsCollection.insertOne(this.data)
                    resolve(info.insertedId)
                } catch {
                    this.errors.push('Please try again later.')
                    reject()
                }
            } else {
                reject(this.errors)
            }
        })
    }

    update() {
        return new Promise(async (resolve, reject) => {
            try {
                let post = await Post.findSingleById(this.requestedPostId, this.userId)
                // if the visitor is the owner of the post they are triyng to edit
                if(post.isVisitorOwner) {
                    // the result with return "success" or "failure"
                    let result = await this.actuallyUpdate()
                    resolve(result)
                } else {
                    // if the visitor is not the owner of the post
                    reject(result)
                }
            } catch {
                // if the id is not valid or if does not exist the post in the db
                reject()
            }
        })
    }

    actuallyUpdate() {
        return new Promise(async (resolve, reject) => {
            this.cleanUp()
            this.validate()
            if(!this.errors.length) {
                await postsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}}) 
                resolve("success")
            } else {
                resolve("failure")
            }
        })
    }
}

Post.delete = function(postIdToDelete, currentUserId) {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(postIdToDelete, currentUserId)
            if(post.isVisitorOwner) {
                await postsCollection.deleteOne({_id: new ObjectId(postIdToDelete)})
                resolve()
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

Post.reusablePostQuery = function(uniqueOperations, visitorId, finalOperations = []) {
    return new Promise(async function(resolve, reject) {
        let aggOperations = uniqueOperations.concat([
            // operation Lookup - Allows to lookup documentos from another collection
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            // use the project operation to select the properties we are interested in finding
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                // assign the author field (which is the user id) to the authorId property before overriding the author
                authorId: "$author", 
                // use the arrayElemAt operation to convert the array we are interested in to a object and then we asign it to author property
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ]).concat(finalOperations)

        // we want to wait until MongoDB finishes the CRUD operation before continue, so we use await
        // Aggregate method allows to run multiple operations
        let posts = await postsCollection.aggregate(aggOperations).toArray()

        // clean up author property in each post project
        posts = posts.map(function(post) {
            // return true if is the owner and false otherwise
            post.isVisitorOwner = post.authorId.equals(visitorId)
            
            // since we no longer need authorId, we get rid of it
            post.authorId = undefined

            // we override the author object to delete the password and email field
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })
        resolve(posts)
    })
}

// find the author of the post to render it in the post description
Post.findSingleById = function(id, visitorId) {
    return new Promise(async function(resolve, reject) {
        // 1. check if the id is not a js injection || 2. check if the ID is a valid MongoDB ID
        if(typeof(id) != "string" || !ObjectId.isValid(id)) {
            reject()
            // we return to stop the execution of the function
            return
        }
        
        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectId(id)}}
        ], visitorId)

        // if the post was found
        if(posts.length) {
            resolve(posts[0])
        } else {
            reject()
        }

    })
}

// find the autor's posts to render them
Post.findByAuthorId = function(authorId) {
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}}
    ])
}

Post.search = function(searchTerm) {
    return new Promise(async (resolve, reject) => {
        if(typeof(searchTerm == 'string')) {
            let posts = await Post.reusablePostQuery([
                // TEXT operation - find in the DB the search term without a perfect match
                {$match: {$text: {$search: searchTerm}}}
            ], 
            undefined,
            // sort by the relevancy score
            {$sort: {score: {$meta: "textScore"}}})
            resolve(posts)
        } else {
            reject()
        }
    })
}

Post.countPostsByAuthor = function(id) {
    return new Promise(async (resolve, reject) => {
        let postCount = await postsCollection.countDocuments({author: id})
        resolve(postCount)
    })
}

Post.getFeed = async function(id) {
    // create an array of the user id's the current user follows
    let followedUsers = await folowsCollection.find({authorId: new ObjectId(id)}).toArray()
    followedUsers = followedUsers.map(function(followDoc) {
        return followDoc.followedId
    })

    // look for posts where the author is in the above array of followed users
    return Post.reusablePostQuery([
        // in Operation - instead of looking a single value, we can look in an array.
        {$match: {author: {$in: followedUsers}}},
        {$sort: {createdDate: -1}}
    ])
}

module.exports = Post