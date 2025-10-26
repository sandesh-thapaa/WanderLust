if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}


const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const dbUrl = process.env.ATLASDB_URL;
main()
  .then(() => {
    console.log("Connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
  await initDB();
}

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "68fdbeb57682c27063dd83a1",
  }));
  await Listing.insertMany(initData.data);
  console.log("Data was initialized");
};
