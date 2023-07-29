const Cookies = require("js-cookie");
const express = require("express");
const Hashtag = require("../models/hashtag");
const SignleModule = require("../models/Signle");
const Post = require("../models/publication");
const path = require("path");
const fs = require("fs");
var imgModel = require("../models/Image");
var publicationModel = require("../models/publication");
const axios = require("axios");
const csrftoken = Cookies.get("csrftoken");
axios.defaults.headers.common["X-CSRFToken"] = csrftoken;
// Step 7 - the GET request handler that provides the HTML UI

exports.getImage = async (req, res) => {
  try {
    console.log(req.query.id);
    const image = await imgModel.findById(req.query.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }
    res.status(200).send(image);
  } catch (err) {
    console.error(err.message);
    res.status(404).send("Server error");
  }
};
exports.addreaction = async (req, res) => {
  try {
    const publication = await publicationModel.findById(req.body.publicationId);
    if (!publication) {
      throw new Error("Publication not found");
    }

    const idUser = req.body.UserId;
    const reactionIndex = publication.reaction.findIndex(
      (r) => r.idUser === idUser
    );
    if (reactionIndex > -1) {
      publication.reaction.splice(reactionIndex, 1);
    } else {
      publication.reaction.push({ idUser });
    }

    await publication.save();
    res.send({ msg: "ok !" });
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.addcomment = async (req, res) => {
  try {
    const publication = await publicationModel.findById(req.body.idPub);
    if (!publication) {
      throw new Error("Publication not found");
    }

    publication.commentaires.push({
      idUser: req.body.iduser,
      comment: req.body.comm,
      reaction: 0,
      comments: [],
    });

    await publication.save();
    res.json({ message: "ok" }); // send JSON response
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.commreaction = async (req, res) => {
  try {
    const publication = await publicationModel.findByIdAndUpdate(
      req.body.idPub,
      {
        $inc: {
          [`commentaires.${req.body.commindex}.reaction`]: 1,
        },
      }
    );

    if (!publication) {
      return res.status(404).send("Publication not found");
    }

    res.status(200).send("Comment reaction updated");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

exports.addcommentReply = async (req, res) => {
  try {
    const publication = await publicationModel.findByIdAndUpdate(
      req.body.idPub,
      {
        $push: {
          [`commentaires.${req.body.commindex}.comments`]: {
            userId: req.body.iduser,
            text: req.body.reply,
            reaction: 0,
          },
        },
      }
    );

    if (!publication) {
      return res.status(404).send("Publication not found");
    }

    res.status(200).send("Comment reaction updated");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

exports.getPublication = async (req, res) => {
  try {
    const items = await publicationModel.find({});
    res.status(200).send(items);
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred", err);
  }
};

exports.getPublicationByUserId = async (req, res) => {
  try {
    const id = req.params.id;
    const posts = await Post.find({ Id_user: id }).exec();
    if (posts.length > 0) {
      res.json(posts);
    } else {
      res.status(404).send("No posts found for the given ID.");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred while fetching the posts.");
  }
};
exports.PostPublication = async (req, res) => {
  verification = true;
  let currentDate = Date.now();
  var hashtagList = [];
  if (req.body.hashtags) {
    // Convert hashtags to an array if it's not already an array
    const hashtags = Array.isArray(req.body.hashtags)
      ? req.body.hashtags
      : [req.body.hashtags];
    for (const tag of hashtags) {
      const existingTag = await Hashtag.findOne({ tag_name: tag });
      let tagId;
      if (!existingTag) {
        // If tag doesn't exist, create a new tag and save it to the database
        const newTag = new Hashtag();
        newTag.tag_name = tag;
        newTag.copyrightChecked = req.body.copyrightChecked;
        await newTag.save();
        tagId = newTag._id;
      } else {
        // If tag exists, get its ID
        tagId = existingTag._id;
      }
      // Add the ID to the list of hashtags for the post
      hashtagList.push(tagId);
    }
  }
  var ImgList = [];
  if (req.files.images) {
    for (var element of req.files.images) {
      // var img = new imgModel({
      //   name: element.filename,
      //   img: {
      //     data: fs.readFileSync(
      //       path.join(
      //         path.dirname(require.main.filename),
      //         "uploads",
      //         element.filename
      //       )
      //     ),
      //     contentType: "image/png",
      //   },
      // });
      await axios
        .post("https://artverse-project-api-django.onrender.com/", {
          image: img,
        })
        .then((response) => {
          if (response.data === 0) {
            ImgList.push(element);
          } else {
            verification = false;
          }
        })
        .catch(() => {
          res.status(401).json({ message: "error" });
        });
    }
  }
  var ImgList1 = [];
  if (verification) {
    for (item of ImgList) {
      await item.save().then((res) => {
        ImgList1.push({ idimg: res._id, imgName: element.filename });
      });
    }
    var post = new publicationModel({
      Id_user: req.body.Id_user,
      text: req.body.text,
      date: currentDate,
      img: ImgList1,
      hashtag: hashtagList,
    });
    await post.save().then(() => {
      res.status(200).json({ message: "post added" });
    });
  } else {
    res.status(401).json({ message: "problem copyrigth" });
  }
};

exports.getAllImages = async (req, res) => {
  try {
    const images = await imgModel.find();
    res.send(images);
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

// *************************
// ********* tags ***********
// **************************

exports.GetTag = async (req, res) => {
  Hashtag.find({}, (err, tags) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error retrieving tags");
    } else {
      res.json(tags);
    }
  });
};
exports.AddTags = async (req, res) => {
  // Extract the tag name from the request b
  const { tagname } = req.body;
  console.log(req.body);
  const { tagn } = req.params;
  // Add this line to log the request body
  try {
    if (!tagn) {
      return res.status(400).json({
        errorMessage: "Tag name is required",
      });
    }

    // Check if tag already exists
    const existingTag = await Hashtag.findOne({ tag_name: tagn });
    if (existingTag) {
      // If tag already exists, return a success response
      return res.status(200).json({
        SuccessMessage: "Tag already exists",
      });
    } else {
      // If tag doesn't exist, create a new tag and save it to the database
      const newTag = new Hashtag();
      newTag.tag_name = tagn;
      await newTag.save();
      // Return a success response
      return res.status(200).json({
        SuccessMessage: "New tag added",
      });
    }
  } catch (err) {
    // If there was an error, return an error response
    return res.status(500).json({
      errorMessage: "Please try again later" + err,
    });
  }
};

exports.deletPostWihSngle = async (req, res) => {
  const Post = await publicationModel
    .findByIdAndRemove({ _id: req.body.id })
    .then(async (Post) => {
      console.log(Post);
    })
    .catch((error) => {
      console.log(error);
    });
  console.log(req.body.idSng);
  const sing = await SignleModule.findById(req.body.idSng);
  sing.state = false;
  await sing.save().then(() => {
    res.status(200).json({ message: "single updated" });
  });
};

exports.deleteMyPost = async (req, res) => {
  const Post = await publicationModel
    .findByIdAndRemove({ _id: req.body.id })
    .then(async (Post) => {
      console.log(Post);
      res.status(200).json({ message: "single updated" });
    })
    .catch((error) => {
      console.log(error);
    });
};
exports.upateDatePost = async (req, res) => {
  try {
    const post = await publicationModel.findById(req.body.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.text = req.body.text;
    await post.save();

    return res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPublicationsByID = async (req, res) => {
  const id = req.params.id;
  console.log(id);
  let post = await publicationModel.findById({ _id: id });
  console.log(post);

  if (post) {
    res.json(post);
  } else {
    res.status(404).send("ID does not exist !!");
  }
};
