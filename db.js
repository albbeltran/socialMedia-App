const dotenv = require('dotenv')
dotenv.config()
const {MongoClient} = require('mongodb')

const client = new MongoClient(process.env.CONNECTIONSTRING)

//When the await finishes, run the app
async function start(){
    await client.connect()
    //Exports the db client
    module.exports = client
    //Importing the app
    const app = require('./app')
    app.listen(process.env.PORT)
}

start()