"use strict";
/**
 * donation module
 * 
 * commands like:
 * donation / spende 
 * donation / spende <discordName>
 * 
 * @param {any} message
 * @param {any} cmd
 */
var donation = async function (message, cmd) {
    const commandBuilder = require("./../services/commandBuilder");

    if ((cmd[0] === commandBuilder.build("donation") || cmd[0] === commandBuilder.build("spende"))) {
        var moment = require("moment/min/moment-with-locales");
        moment.locale(global.bot.config.defaultLng);

        async function getUserByDiscordId(discordId) {
            const results = await global.bot.databaseConnection.query("SELECT * FROM mapBot_user WHERE discordId = ?", [discordId]);

            if (results.length === 0) {
                return false;
            }

            return results[0];
        }

        async function getUserByDiscordTag(discordTag) {
            const results = await global.bot.databaseConnection.query("SELECT * FROM mapBot_user WHERE discordTag = ?", discordTag);

            if (results.length === 0) {
                return false;
            }

            return results[0];
        }

        async function getUserAccessLevel(discordId) {
            const results = await global.bot.databaseConnection.query("SELECT * FROM mapBot_userAccessLevel WHERE userId = (SELECT id FROM mapBot_user WHERE discordId = ?)", [discordId]);

            if (results.length === 0) {
                return false;
            }

            return results[0];
        }

        async function createdUserAccessLevelIfNotExists(user) {
            const results = await global.bot.databaseConnection.query("SELECT * FROM mapBot_userAccessLevel WHERE userId = ?", user.id);

            if (results.length === 0) {

                const userAccessLevel = { userId: user.id, discordRoleId: global.bot.config.discord.roles.supporter, expiredAt: moment("1970-01-01").format("YYYY-MM-DD HH:mm:ss") };

                const insertResult = await global.bot.databaseConnection.query("INSERT INTO mapBot_userAccessLevel SET ?", userAccessLevel);

                return insertResult.affectedRows > 0;
            }

            return false;
        }

        async function updateUserAccessLevel(user, expiredAt) {
            const results = await global.bot.databaseConnection.query("UPDATE mapBot_userAccessLevel SET expiredAt = ?, notification = 0, removed = 0 WHERE userid = ?", [expiredAt, user.id]);

            return results[0];
        }

        async function updateTransactionInfoToUsed(transactionId, userId) {
            const results = await global.bot.databaseConnection.query("UPDATE mapBot_transactionInfo SET used = 1, userId = ? WHERE transactionId = ?", [userId, transactionId]);

            return results[0];
        }

        function addRoleToUser(discordId) {
            const guild = global.bot.client.guilds.get(global.bot.config.discord.guildId);
            guild.members.get(discordId).addRole(global.bot.config.discord.roles.supporter).catch(console.error);
        }

        var transactionId = cmd[1];

        const transactionResults = await global.bot.databaseConnection.query("SELECT * FROM mapBot_transactionInfo WHERE transactionId = ?", transactionId);

        if (transactionResults.length === 0) {
            message.channel.send(global.bot.i18next.t("bot.modules.donation.transactionNotFound"));

            return false;
        }

        if (transactionResults[0]) {
            const eventLogger = require("./../services/eventLogger");
            const transaction = transactionResults[0];

            if (typeof transaction == "undefined" || transaction.used) {
                message.channel.send(global.bot.i18next.t("bot.modules.donation.transactionAlreadyUsed"));
                return false;
            }

            const defaultItem = await global.bot.databaseConnection.query("SELECT * FROM mapBot_item WHERE defaultItem = 1");

            var paymentvalue = transaction.paymentValue.substring(0, transaction.paymentValue.indexOf(","));
            var multipleValue = paymentvalue / defaultItem[0].currencyValue;
            var durationToAdd = multipleValue * defaultItem[0].duration;

            var forOtherUser = cmd[2];
            var user;
            var userAccessLevel;
            var expireDate;
            if (forOtherUser) {
                // for other
                user = await getUserByDiscordTag(forOtherUser);
                if (typeof user == "undefined" || user === false) {
                    message.channel.send(global.bot.i18next.t("bot.modules.donation.userForTransactionUnknown", { command: commandBuilder.build("neu") }));

                    return false;
                }

                userAccessLevel = await getUserAccessLevel(user.discordId);
                expireDate = moment(userAccessLevel.expiredAt);
                if (expireDate < moment.now()) {
                    expireDate = moment().add(durationToAdd, "days");
                } else {
                    expireDate.add(durationToAdd, "days");
                }

                await updateTransactionInfoToUsed(transactionId, user.id);
                await createdUserAccessLevelIfNotExists(user);
                await updateUserAccessLevel(user, expireDate.format("YYYY-MM-DD HH:mm:ss"));
                addRoleToUser(user.discordId);
                await eventLogger.addTimeForOther(user.discordId, durationToAdd);
            } else {
                // for self
                user = await getUserByDiscordId(message.author.id);
                if (typeof user == "undefined" || user === false) {
                    message.channel.send(global.bot.i18next.t("bot.modules.donation.userUnknown", { command: commandBuilder.build("neu") }));

                    return false;
                }

                userAccessLevel = await getUserAccessLevel(user.discordId);
                expireDate = moment(userAccessLevel.expiredAt);
                if (expireDate < moment.now()) {
                    expireDate = moment().add(durationToAdd, "days");
                } else {
                    expireDate.add(durationToAdd, "days");
                }

                await updateTransactionInfoToUsed(transactionId, user.id);
                await createdUserAccessLevelIfNotExists(user);
                await updateUserAccessLevel(user, expireDate.format("YYYY-MM-DD HH:mm:ss"));
                addRoleToUser(user.discordId);
                await eventLogger.addTime(user.discordId, durationToAdd);

                message.channel.send(global.bot.i18next.t("bot.modules.memberStatus.success"));
            }
        }
    } else if (cmd[0] === commandBuilder.build("donation") || cmd[0] === commandBuilder.build("spende")) {

    }

    return false;
};

module.exports = donation;