const Messages = Object.freeze({
    INTERNAL_SERVER_ERROR: "Internal Server Error",
    INVALID_CREDENTIALS: "Invalid username or password",
    CATEGORY_ALREADY_EXISTS: "Category already exists",
    CATEGORY_NOT_FOUND: "Category not found",
    CATEGORY_ADDED_SUCCESS: "Category added successfully",
    CATEGORY_NAME_ALREADY_EXISTS: "Category name already exists",
    ORDER_STATUS_UPDATED_SUCCESS: "Order status updated successfully",
    INVALID_REQUEST_TYPE: "Invalid request type",
    ORDER_NOT_FOUND: "Order not found",
    INVALID_REQUEST_STATUS: "Invalid request status",
    RETURN_APPROVED_SUCCESS: "Return approved successfully",
    REFUND_APPROVED_SUCCESS: "Refund approved successfully",
    CANCELLATION_APPROVED_SUCCESS: "Cancellation approved successfully",
    PRODUCT_ADDED_SUCCESS: "Product added successfully",
    PRODUCT_NOT_FOUND: "Product not found",
    PRODUCT_UPDATED_SUCCESS: "Product updated successfully",
    INVALID_IMAGE_INDEX: "Invalid image index",
    IMAGE_DELETED_SUCCESS: "Image deleted successfully",
    USER_NOT_FOUND: "User not found",
    WRONG_PASSWORD: "Wrong Password",
    USER_ALREADY_EXISTS: "User already exists",
    PASSWORDS_DO_NOT_MATCH: "Passwords do not match",
    INVALID_OTP: "Invalid OTP",
    OLD_PASSWORD_INCORRECT: "Old password is incorrect",
    PRODUCT_ID_REQUIRED: "Product ID is required",
    INSUFFICIENT_STOCK: "Insufficient stock",
    INVALID_PRODUCT_ID_OR_QUANTITY: "Invalid product ID or quantity",
    QUANTITY_EXCEEDS_STOCK: "Quantity exceeds available stock",
    PRODUCT_NOT_FOUND_IN_CART: "Product not found in cart",
    CART_NOT_FOUND: "Cart not found",
    INVALID_AMOUNT: "Invalid amount",
    FAILED_TO_CREATE_RAZORPAY_ORDER: "Failed to create Razorpay order",
    INVALID_SIGNATURE: "Invalid signature",
    FAILED_TO_VERIFY_PAYMENT: "Failed to verify payment",
    FAILED_TO_UPDATE_ORDER_STATUS: "Failed to update order status",
    FAILED_TO_CREATE_RAZORPAY_ORDER_FOR_WALLET: "Failed to create Razorpay order for wallet",
    PRODUCT_ALREADY_IN_WISHLIST: "Product already in wishlist",
    WISHLIST_NOT_FOUND: "Wishlist not found",
    WALLET_NOT_FOUND: "Wallet not found",
    INSUFFICIENT_BALANCE: "Insufficient balance",
});

module.exports = Messages;