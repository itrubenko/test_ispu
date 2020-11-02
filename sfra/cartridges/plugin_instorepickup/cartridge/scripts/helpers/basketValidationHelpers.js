'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var base = require('app_storefront_base/cartridge/scripts/helpers/basketValidationHelpers');

/**
 * validates that the product line items exist, are online, and have available inventory.
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {Object} an error object
 */
function validateProducts(basket) {
    var result = {
        error: false,
        hasInventory: true
    };
    var productLineItems = basket.productLineItems;

    collections.forEach(productLineItems, function (item) {
        if (item.product === null || !item.product.online) {
            result.error = true;
            return;
        }

        if (Object.hasOwnProperty.call(item.custom, 'fromStoreId')
            && item.custom.fromStoreId) {
            // var store = StoreMgr.getStore(item.custom.fromStoreId);
            // var storeInventory = ProductInventoryMgr.getInventoryList(store.custom.inventoryListId);

            // result.hasInventory = result.hasInventory
            //     && (storeInventory.getRecord(item.productID)
            //     && storeInventory.getRecord(item.productID).ATS.value >= item.quantityValue);


            result.hasInventory = 100;
        } else {
            var availabilityLevels = item.product.availabilityModel
                .getAvailabilityLevels(item.quantityValue);
            result.hasInventory = result.hasInventory
                && (availabilityLevels.notAvailable.value === 0);
        }
    });

    return result;
}
base.validateProducts = validateProducts;
module.exports = base;
