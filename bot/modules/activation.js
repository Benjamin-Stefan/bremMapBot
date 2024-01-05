"use strict";
/**
 * donation module
 * 
 * commands like:
 * donation / freischaltung
 * donation / freischaltung
 *
 * @param {any} message
 * @param {any} cmd
 */
var donation = async function (message, cmd) {
    const commandBuilder = require("./../services/commandBuilder");
    const { v4: uuidv4 } = require("uuid");

    if ((cmd[0] === commandBuilder.build("activation") || cmd[0] === commandBuilder.build("freischaltung"))) {
        var moment = require("moment/min/moment-with-locales");
        moment.locale(global.bot.config.defaultLng);

        async function getUserByDiscordId(discordId) {
            const results = await global.bot.databaseConnection.query("SELECT * FROM mapBot_user WHERE discordId = ?", [discordId]);

            if (results.length === 0) {
                return false;
            }

            return results[0];
        }
        
        async function insertTransactionCode(transaction) {
            const results = await global.bot.databaseConnection.query("INSERT INTO mapBot_transaction SET ?", transaction);

            return results.affectedRows > 0;
        }

        var user = await getUserByDiscordId(message.author.id);

        if (typeof user == "undefined" || user === false) {
            message.channel.send(global.bot.i18next.t("bot.modules.activation.userUnknown", { command: commandBuilder.build("neu") }));

            return false;
        }

        var transaction = {
            transactionCode: uuidv4(),
            userId: user.id
        }

        var result = await insertTransactionCode(transaction);

        if (result) {
            message.channel.send(`Die Zahlen und Buchstabenkombinationen nur einmal verwenden!\n \`\`\`${transaction.transactionCode}\`\`\`\n Für jede Spenden muss eine neue Generiert werden!`);
        }
    }

    return false;
};

module.exports = donation;