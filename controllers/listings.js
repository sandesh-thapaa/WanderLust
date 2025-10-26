const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// const fetch = require("node-fetch");
const Listing = require("../models/listing.js");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing not found!");
    res.redirect("/");
  } else {
    res.render("listings/show.ejs", { listing });
  }
};

module.exports.createListing = async (req, res) => {
  const { location } = req.body.listing;

  try {
    // Use Geoapify API for geocoding
    const geoRes = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        location
      )}&apiKey=${process.env.GEO_API_KEY}`
    );

    // Check if Geoapify responded correctly
    const contentType = geoRes.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("❌ Geoapify did not return JSON");
      req.flash(
        "error",
        "Geocoding service unavailable. Please try again later."
      );
      return res.redirect("/new");
    }

    const geoData = await geoRes.json();

    // Validate response data
    if (!geoData.features || geoData.features.length === 0) {
      req.flash("error", "Address not found!");
      return res.redirect("/new");
    }

    // Extract coordinates
    const lat = geoData.features[0].geometry.coordinates[1];
    const lon = geoData.features[0].geometry.coordinates[0];

    // Handle image upload
    let url = req.file ? req.file.path : "";
    let filename = req.file ? req.file.filename : "";

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    if (url && filename) {
      newListing.image = { url, filename };
    }

    newListing.geometry = { type: "Point", coordinates: [lon, lat] };

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect(`/${newListing._id}`);
  } catch (err) {
    console.error("❌ Error creating listing:", err);
    req.flash(
      "error",
      "An error occurred while creating the listing. Please try again."
    );
    res.redirect("/new");
  }
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    res.redirect("/");
  } else {
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
  }
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  // await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/");
};
