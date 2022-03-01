const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const express = require('express');
const cors = require('cors');
const multer = require("multer");
const fileSchema = require("./schemas/fileSchema");
const { default: mongoose } = require('mongoose');
const fileModel = new mongoose.model("file", fileSchema);
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

       const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "./uploads")
    },
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        callback(null, file.originalname);
    }

})
           const uploads = multer({ storage: storage })
            




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o0i8x.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// console.log(uri);
mongoose.connect(uri, {
    useNewUrlParser: true, useUnifiedTopology: true,
    dbName: "orange-toolz"
}).then(() => console.log('connection successful'))
    .catch((err) => console.log(err))


async function run() {
    try {
        await client.connect();
        const database = client.db('orange-toolz');
        const usersCollection = database.collection('users');
        const eventsCollection = database.collection('events');
        const donorsCollection = database.collection('donors');


        // save user api worked
        app.post('/users', async (req, res) => {
            const user = req.body;
            user["status"] = "Active";
            user["role"] = "member";
            const result = await usersCollection.insertOne(user);
            console.log('new user data saved');
            res.json(result);
        })
        //delete user  WORKED
        app.delete('/users/:id', async (req, res) => {

            const query = { _id: ObjectId(req.params.id) }
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })



        // update user api
        app.put('/users', async (req, res) => {
            const user = req.body;
            const isOldUser = await usersCollection.findOne({ email: user.email });

            if (isOldUser) {
                const filter = { email: user.email };
                const options = { upsert: true };
                const updateDoc = { $set: user };
                const result = await usersCollection.updateOne(filter, updateDoc, options);

                console.log('old user data updated');
                res.json(result);
            }

            else {
                user["status"] = "Active";
                user["role"] = "member";
                const result = await usersCollection.insertOne(user);
                console.log('users data save with role');
                res.json(result);
            }
        })

        // get user api WORKED
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            console.log('Users found');
            res.send(users);
        })

        // change user role      WORKED   
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            if (user.status === 'Active') {
                const filter = { email: user.email };
                const updateDoc = { $set: { status: 'Blocked' } };
                const result = await usersCollection.updateOne(filter, updateDoc);

                console.log('user role set to admin');

                const data = { result, role: 'admin' }
                res.json(data);
            }
            // console.log(user)
            else {
                const filter = { email: user.email };
                const updateDoc = { $set: { status: 'Active' } };
                const result = await usersCollection.updateOne(filter, updateDoc);
                console.log('user status set to blocked');
                const data = { result, role: 'member' }
                res.json(data);
            }
        })

        // check user role admin or not  WORKED
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            console.log('admin : ', isAdmin);
            res.json({ user, isAdmin });
        })


        // get events api
        app.get('/events', async (req, res) => {
            const cursor = eventsCollection.find({});
            const events = await cursor.toArray();
            console.log('events generated');
            res.send(events);
        })

        // get target event api
        app.get('/events/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const event = await eventsCollection.findOne(query);
            console.log("target event found");
            res.json(event);
        })

        // add event api
        app.post('/events', async (req, res) => {
            const data = req.body;
            const result = await eventsCollection.insertOne(data);
            console.log('Event added');
            res.json(result);
        })


        // save donor details api
        app.post('/donors', async (req, res) => {
            const data = req.body;
            const result = await donorsCollection.insertOne(data);
            console.log('donor details added');
            res.json(result);
        })

        // get donor details api
        app.get('/donors', async (req, res) => {
            const cursor = donorsCollection.find({});
            const events = await cursor.toArray();
            console.log('events generated');
            res.send(events);
        })

        // file uploads
        app.post('/uploads', uploads.single("fileName"), async (req, res) => {
    console.log(req.file)
            const newFile = new fileModel({
                name: req.body.name,
                time:req.body.time,
                fileName: req.file.filename
            })
            
         const result=await   newFile.save()
                // .then(() => res.json("new file posted"))
                // .catch((err) => res.status.json('server error'))
                res.send(result);

        })
        app.get('/uploads',async(req,res)=>{
        const result= await fileModel.find({});
        res.send(result)
        })
        console.log('database connected');
    }
    finally {
        // await client.close();

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('It is a team project!')
})

app.listen(port, () => {
    console.log(`Port :${port}`)
})