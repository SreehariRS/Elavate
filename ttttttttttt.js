const checkout = async (req, res) => {
  try {
      const userId = req.session.user;
      if (!userId) {
          return res.status(400).json({ message: 'User ID is required' });
      }

      // Fetch the cart items along with product details
      const cart = await Cart.findOne({ userId }).populate('items.productId');
      if (!cart) {
          return res.status(404).json({ message: 'Cart not found' });
      }

      // Extract cart items from the cart document
      const cartItems = cart.items.map(item => {
          const productDetails = item.productId;
          const maxStock = productDetails.stock;
          const quantityToUse = Math.min(item.quantity, maxStock);
          const price = quantityToUse * Math.min(productDetails.offerprice || Infinity, productDetails.price);

          return {
              productId: productDetails._id.valueOf(),
              productName: productDetails.productname,
              description: productDetails.description,
              price: productDetails.price,
              offerprice: productDetails.offerprice,
              quantity: quantityToUse,
              maxStock,
              image: productDetails.productImages[0],// Assuming productImages is an array
              totalPrice: price
          };
      });

      // Calculate total price using reduce
      const totalPrice = cartItems.reduce((acc, item) => {
          return acc + item.totalPrice;
      }, 0);

      // Fetch coupon details based on the provided code
      const couponCode = req.session.couponCode; // Change this based on your application's logic
      const selectedCoupon = await AdminCoupon.findOne({ code: couponCode });

      // Apply discount if a valid coupon is found
      let discountedPrice = totalPrice;
      if (selectedCoupon) {
          // Subtract the discountValue from the total price
          discountedPrice -= selectedCoupon.discountValue;
      }

      const coupons = await AdminCoupon.find();

      // Fetch user's addresses
      const user = await User.findOne({ _id: userId });
      const addresses = user.addresses;

      res.render('user/checkout', { userId, cartItems, totalPrice, addresses, coupons, discountedPrice });

  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};
