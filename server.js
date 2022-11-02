const express = require("express");
const axios = require("axios");
const redis = require("redis");

const app = express();
const port = process.env.PORT || 3000;

let redisClient;

(async () => {
  redisClient = redis.createClient();

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();

async function fetchApiData(acadYear) {
  //https://api.nusmods.com/v2/${acadYear}/moduleList.json
  const apiResponse = await axios.get(
    `https://api.nusmods.com/v2/${acadYear}/moduleList.json`
  );
  console.log("Request sent to the API");
  return apiResponse.data;
}

async function cacheData(req, res, next) {
  const { acadYear } = req.params;
  console.log(req.params)
  let results;
  try {
    const cacheResults = await redisClient.get(acadYear);
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
// https://api.nusmods.com/v2/2018-2019/moduleList.json
async function getModules(req, res) {
  const { acadYear } = req.params;
  let results;

  try {
    results = await fetchApiData(acadYear);
    if (results.length === 0) {
      throw "API returned an empty array";
    }
    await redisClient.set(acadYear, JSON.stringify(results), {
      EX: 180,
      NX: true,
    });

    res.send({
      fromCache: false,
      data: results,
    });
  } catch (error) {
    console.error(error);
    res.status(404).send("Data unavailable");
  }
}

app.get("/years/:acadYear", cacheData, getModules);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
