const path = require('path');

const express = require('express');
const auth = require('../middleware/is-auth');

const shopController = require('../controllers/shop');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', auth, shopController.getCart);

router.post('/cart', auth, shopController.postCart);

router.post('/cart-delete-item', auth, shopController.postCartDeleteProduct);

router.post('/create-order', auth, shopController.postOrder);

router.get('/orders', auth, shopController.getOrders);

module.exports = router;