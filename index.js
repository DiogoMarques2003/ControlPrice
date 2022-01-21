const startControling = require('./startControll');

const config = require('./config');

let timeout = 0;

function start() {
    const items = Object.keys(config);

    itemsLastPrice = {};

    for (const item of items) {
        setTimeout(() => {
            console.log(`Starting controling price of ${item}`);
            itemsLastPrice[item] = 0;
            startControling(item, itemsLastPrice);
        }, timeout * 60 * 1000);
        timeout++;
    }
}

start();