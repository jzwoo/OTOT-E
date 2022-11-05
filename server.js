const express = require('express');
const axios = require('axios');
const redis = require('redis');
const mongoose = require('mongoose')
require('dotenv').config();
const Contact = require('./model/contactModel')


const app = express();
const port = process.env.PORT || 3000;

let redisClient;

(async () => {
    redisClient = redis.createClient();

    redisClient.on('error', (error) => console.error(`Error : ${error}`));

    await redisClient.connect();
})();

// async function fetchApiData(acadYear) {
//   //https://api.nusmods.com/v2/${acadYear}/moduleList.json
//   const apiResponse = await axios.get(
//     `https://api.nusmods.com/v2/${acadYear}/moduleList.json`
//   );
//   console.log("Request sent to the API");
//   return apiResponse.data;
// }

async function cacheData(req, res, next) {
    let results;
    try {
        const cacheResults = await redisClient.get('contacts');
        if (cacheResults) {
            results = JSON.parse(cacheResults);
            res.send({
                fromCache: true,
                data: results,
            });
        } else {
            next();
        }
    } catch (error) {
        console.error(error);
        res.status(404);
    }
}

async function getAllContacts(req, res) {
    let contacts;
    try {
        contacts = await Contact.find({});
        if (!contacts || contacts.length === 0) {
            throw 'DB returned an empty array';
        }
        await redisClient.set('contacts', JSON.stringify(contacts), {
            EX: 180,
            NX: true,
        });

        res.send({
            fromCache: false,
            data: contacts,
        });
    } catch (error) {
        console.error(error);
        res.status(404).send('Data unavailable');
    }
}

app.get('/contacts', cacheData, getAllContacts);

// connect to db
mongoose.connect(process.env.MONGO_URI).then(() => {
    app.listen(port, () => {
        console.log(`App listening on port ${port}`);
    });
}).catch((err) => {
    console.log(err)
})

