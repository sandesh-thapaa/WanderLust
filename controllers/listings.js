const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// const fetch = require("node-fetch");
const { Listing, categories } = require("../models/listing.js");

module.exports.index = async (req, res) => {
  let { q, category } = req.query;

  let query = {};
  let allListings;

  if (q) {
    allListings = [];
    category = undefined;
  } else if (category) {
    query.category = category;
    allListings = await Listing.find(query);
    q = undefined;
  } else {
    allListings = await Listing.find({});
    q = undefined;
    category = undefined;
  }
  res.render("listings/index.ejs", {
    allListings,
    q: q,
    category: category,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs", { categories });
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

module.exports.searchListing = async (req, res) => {
  let { q } = req.query;

  if (!q || q.trim() === "") {
    req.flash("error", "Please enter a destination to search.");
    return res.redirect("/");
  }
  const searchTerm = new RegExp(q.trim(), "i");
  let listings = await Listing.find({
    $or: [
      { title: { $regex: searchTerm } },
      { location: { $regex: searchTerm } },
      { country: { $regex: searchTerm } },
    ],
  });
  if (listings.length === 0) {
    req.flash("error", `No listings found matching "${q}".`);
    // return res.redirect(`/?q=${encodeURIComponent(q)}`);
    res.redirect("/")
  } else {
    res.render("listings/index.ejs", {
      allListings: listings,
      q,
      category: undefined,
      pageTitle: `Search Results for "${q}"`,
    });
  }
};

module.exports.filterByCategory = async (req, res) => {
  let { category } = req.query;

  if (!category) {
    req.flash("error", "Invalid category selected.");
    return res.redirect("/");
  }
  const listings = await Listing.find({ category: category });

  if (listings.length === 0) {
    req.flash("error", `No listings found in the "${category}" category.`);
    return res.redirect(`/?category=${encodeURIComponent(category)}`);
  } else {
    res.render("listings/index.ejs", {
      allListings: listings,
      q: undefined,
      category,
    });
  }
};
