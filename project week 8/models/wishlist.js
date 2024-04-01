const mongoose = require('mongoose');



const wishlistSchema = new mongoose.Schema({
  userId: {
    type: String,
   
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true,
    },
  }],
});

const Wishlist = mongoose.model('wishlists', wishlistSchema);

module.exports = Wishlist;
