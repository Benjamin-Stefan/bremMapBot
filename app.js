"use strict";
global.__basedir = __dirname;
require("./bot/bot.js");

bot.client.on("ready", async () => {
    bot.modules.push(require("./bot/modules/activation.js"));
    //bot.modules.push(require("./bot/modules/donation.js"));
    bot.modules.push(require("./bot/modules/help.js"));
    bot.modules.push(require("./bot/modules/memberStatus.js"));

    bot.adminModules.push(require("./bot/modules/admin/item.js"));
    bot.adminModules.push(require("./bot/modules/admin/mailReader.js"));
    bot.adminModules.push(require("./bot/modules/admin/member.js"));
    bot.adminModules.push(require("./bot/modules/admin/migration.js"));
    bot.adminModules.push(require("./bot/modules/admin/status.js"));

    // require("./bot/runner/autoActivation.js")();
    // require("./bot/runner/autoMailReader.js")();
    // require("./bot/runner/autoNotification.js")();
    // require("./bot/runner/autoRemove.js")();

    bot.client.user.setActivity(bot.config.discord.activity, { type: "WATCHING" });
    bot.logger.info(`Logged in as ${bot.client.user.tag}!`);
});

bot.client.on("message", message => {
    if (message.author.bot || message.content === "") {
        return;
    }

    //if (message.channel.type === 'dm') {
    //    //forward to admin
    //    bot.client.fetchUser(bot.config.discord.adminUserId).then(user => {
    //        if (user) {
    //            user.send(`${message.author.tag}(${message.author.id}) sent this message to this bot:\n\`\`\`${message.content}\n\`\`\``);
    //        } else {
    //            console.log(`User with id ${bot.config.discord.adminUserId} doesn't exist. Fix this in the config before DMs will get forwarded.`);
    //        }
    //    });
    //}

    //if (message.channel.type !== 'text') {
    //    return;
    //}

    const cmd = message.content.split(" ");

    bot.modules.forEach(callback => {
        callback(message, cmd);
    });

    //admin commands
    if (message.author.id === bot.config.discord.adminUserId) {
        bot.adminModules.forEach(callback => {
            callback(message, cmd);
        });
    }
});

bot.client.login(bot.config.discord.token);

bot.client.on("disconnect", (event) => {
    bot.logger.info(`Disconnected with code ${event.code}`);
    if (event.code !== 1006) {
        bot.appexit();
    } else {
        bot.client.destroy().then(() => bot.client.login(bot.config.discord.token));
    }
});

process.on("SIGINT", () => {
    bot.appExit();
});