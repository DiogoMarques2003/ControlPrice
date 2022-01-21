const puppeteer = require('puppeteer');
const { WebhookClient, MessageEmbed } = require('discord.js');

const config = require('./config');

async function run(itemName, itemsLastPrice) {
    const itemConfig = config[itemName];

    const webhook = new WebhookClient({ url: itemConfig.webhookURL });

    startControling(itemConfig, itemName, webhook, itemsLastPrice);

    setInterval(() => {
        startControling(itemConfig, itemName, webhook, itemsLastPrice);
    }, itemConfig.interval * 60 * 1000);
}

async function startControling(itemConfig, itemName, webhook, itemsLastPrice) {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    
        const page = await browser.newPage();
        await page.goto(itemConfig.siteURL);
        await page.reload();

        const price = (await page.$eval(itemConfig.element, el => el.innerText)).replace(',', '.');

        const diference = Number(Number((price.replace('€', '')).replace('US$', '')) - itemsLastPrice[itemName]).toFixed(2);

        const embed = new MessageEmbed()
            .setTitle(`Price of ${itemName}`)
            .setTimestamp(new Date())
            .setColor('#2F3136');

        if (Number((price.replace('€', '')).replace('US$', '')) === itemsLastPrice[itemName]) {
            console.log(`[ ${new Date().toLocaleString({ timeZone: 'Europe/Lisbon' })} ] The price of ${itemName} is the same as the last one (${price}).`);
        } else if (diference > 0) {
            console.log(`[ ${new Date().toLocaleString({ timeZone: 'Europe/Lisbon' })} ] The price of ${itemName} has increased ${diference}.`);
            embed.setDescription(`The price of ${itemName} has increased by ${diference}.\n\nThe price of ${itemName} is now ${price}.`);
            await webhook.send({ username: `Price Monitor for ${itemName}`, embeds: [embed] });
        } else {
            console.log(`[ ${new Date().toLocaleString({ timeZone: 'Europe/Lisbon' })} ] The price of ${itemName} has decreased ${diference.replace('-', '')}.`);
            embed.setDescription(`The price of ${itemName} has decreased by ${diference.replace('-', '')}.\n\nThe price of ${itemName} is now ${price}.`);
            await webhook.send({ username: `Price Monitor for ${itemName}`, embeds: [embed] });
        }
    
        itemsLastPrice[itemName] = Number((price.replace('€', '')).replace('US$', ''));

        await browser.close();
    } catch (e) {
        console.error(`[ ${new Date().toLocaleString({ timeZone: 'Europe/Lisbon' })} ] ERROR in ${itemName}: ${e.message}`);
    }
}

module.exports = run;