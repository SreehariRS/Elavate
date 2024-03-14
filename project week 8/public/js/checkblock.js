const checkBlocked = (req, res, next) => {
    // Assuming your user object has an 'isBlocked' property
    if (req.user && req.user.isBlocked) {
      // Redirect to a blocked page or display an error message
      res.redirect('/blocked-page');
    } else {
      // User is not blocked, proceed to the next middleware or route handler
      next();
    }
  };

  module.exports = checkBlocked