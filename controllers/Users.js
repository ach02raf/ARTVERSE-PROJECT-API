const User = require("../models/user");
const crypto = require("crypto");
let jwt = require("jsonwebtoken");
let bcrypt = require("bcrypt");
const emailjs = require("@emailjs/nodejs");
const { token } = require("morgan");

exports.UserList = async (req, res) => {
  try {
    const users = await User.find({}).populate();
    res.json({ users });
  } catch (err) {
    res.status(500).json({
      errorMessage: "Please try again later",
    });
  }
};

// *************************
// ********* Inscription ***
// *************************
exports.userInscription = async (req, res) => {
  try {
    const { firstname, lastname, email, password, bio } = req.body;
    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }
    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    // Create user in our database
    const user = await User.create({
      firstname,
      lastname,
      email: email.toLowerCase(), // sanitize: convert email to lowercase
      password: encryptedPassword,
      bio,
    });

    // Create token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.ACCES_TOKEN_KEY
    );
    // save user token
    user.token = token;
    res.status(201).json(token);
    // console.log("signup posted");
    // console.log("token", user.token);
  } catch (err) {
    res.status(401).send("signup failed");
  }
};

//*************************
// ********* Login ********
// *************************

exports.userLogin = async (req, res) => {
  // Our login logic starts here

  // Get user input
  const { email, password } = req.body;

  // Validate user input
  if (!(email && password)) {
    res.status(400).send("All input is required");
  }
  // Validate if user exist in our database
  const user = await User.findOne({ email });
  user
    ? bcrypt
        .compare(password, user.password)
        .then(() => {
          let token = jwt.sign(
            { userId: User._id, email },
            process.env.ACCES_TOKEN_KEY
          );
          user.token = token;
          res.status(201).json(token);
          //   res.send({ token });
          //   console.log("successfully logged in");
        })
        .catch(() => res.status(401).send("Password failed"))
    : console.log("failll");
  // res.status(401).send("User not found");
};

//**********************************
// ********* reset password ********
// *********************************

exports.forgotPassword = async (req, res, next) => {
  // console.log(req.email);
  try {
    if (!req.body.email) {
      return res.status(404).send("Email is required");
    }
    //get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    // console.log("req.body.email", req.body.email);
    // console.log(user);
    if (!user) {
      return res.status(409).send("User does not exist");
    }
    //generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //send it to user's email
    // const resetURL = `http://${req.get(
    //   "host"
    // )}/user/resetPassword/${resetToken}`;
    const resetURL = `http://localhost:4200/#/reset/${resetToken}`;
    // const message = `|Forgot your password ? \n submit a PATCH request with your new password and passwordConfirm tp : ${resetURL}\n
    //    If you didn't forget your password, please ignore this emai!`;
    const my_html = `<html>        
     <body>
        <p>Hi ${user.name},</p>          
         <p>You recently requested to reset your password for your account. Click the button below to reset it:</p>         
           <a href="${resetURL}"><button style="background-color: #008CBA; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;">Reset Password</button></a>          
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>        
             </body>      
              </html>`;

    const serviceID = "service_0xkww3p";
    const templateID = "template_bqhwddo";
    const templateParams = {
      toemail: user.email,

      my_html: my_html,
    };
    emailjs
      .send(serviceID, templateID, templateParams, {
        publicKey: "Ct-Yh5Ac3p-Qn0UPd",
        privateKey: "0WSHgxStyUzB6IGlGxDh8", // optional, highly recommended for security reasons
      })
      .then(
        (response) => {
          console.log("SUCCESS!", response.status, response.text);
        },
        (err) => {
          console.log("FAILED...", err);
        }
      );

    res.status(200).json({
      status: "success",
      message: resetToken,
    });

    // console.log("{ reset token :", resetToken, "}","user.passwordResetToken", user.passwordResetToken);
  } catch (err) {
    // console.error(err);
    res.status(500).send("An error occurred");
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // Get the token from the URL
    const token = req.params.token;

    // Hash the token and find the user in the database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // If no user is found, return an error response
    if (!user) {
      console.log("enter in 400");
      return res.status(400).json({ message: "Token invalid or expired" });
    }
    console.log("enter after 400");
    // Set the new password and remove the reset token and expiration time
    console.log("req body pass", req.body.password);
    user.password = await bcrypt.hash(req.body.password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save();

    // Return a success message
    console.log("Password reset successfully");
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    console.log("Password reset failed");
    // Return an error message
    return res.status(500).json({ message: "Password reset failed" });
  }
};
