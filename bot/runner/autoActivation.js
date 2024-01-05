"use strict";
var autoActivation = async function () {
    (async function autoActivationRun() {
        const eventLogger = require("../services/eventLogger");
        const moment = require("moment/min/moment-with-locales");
        moment.locale(global.bot.config.defaultLng);
        
        async function getUserById(userId) {
            const results = await global.bot.databaseConnection.query("SELECT * FROM mapBot_user WHERE id = ?", [userId]);

            if (results.length === 0) {
                return false;
            }

            return results[0];
        }

        async function createdUserAccessLevelIfNotExists(user) {
            const results = await global.bot.databaseConnection.query("SELECT * FROM mapBot_userAccessLevel WHERE userId = ?", user.id);

            if (results.length === 0) {

                const userAccessLevel = {
                    userId: user.id,
                    discordRoleId: global.bot.config.discord.roles.supporter,
                    expiredAt: moment("1970-01-01").format("YYYY-MM-DD HH:mm:ss")
                };

                const insertResult =
                    await global.bot.databaseConnection.query("INSERT INTO mapBot_userAccessLevel SET ?",
                        userAccessLevel);

                if (insertResult.affectedRows > 0) {

                    const newResult = await global.bot.databaseConnection.query("SELECT * FROM mapBot_userAccessLevel WHERE userId = ?", user.id);

                    return newResult[0];
                }
            }

            return results[0];
        }

        async function updateUserAccessLevel(user, expiredAt) {
            const results = await global.bot.databaseConnection.query(
                "UPDATE mapBot_userAccessLevel SET expiredAt = ?, notification = 0, removed = 0 WHERE userid = ?",
                [expiredAt, user.id]);

            return results[0];
        }

        async function updateTransactionInfoToUsed(transactionInfoId, userId) {
            const results = await global.bot.databaseConnection.query(
                "UPDATE mapBot_transactionInfo SET used = 1, userId = ? WHERE transactionId = ?",
                [userId, transactionInfoId]);

            return results[0];
        }

        async function updateTransactionToUsed(transactionid) {
            const results = await global.bot.databaseConnection.query(
                "UPDATE mapBot_transaction SET used = 1 WHERE id = ?",
                [transactionid]);

            return results[0];
        }

        async function getAllTransactionInfo() {
            const results =
                await global.bot.databaseConnection.query("SELECT * FROM mapBot_transactionInfo WHERE used = 0 OR used IS NULL");

            return results;
        }

        async function getTransaction(transactionCode) {
            const results = await global.bot.databaseConnection.query(
                "SELECT * FROM mapBot_transaction WHERE transactionCode = ? AND (used = 0 OR used IS NULL)",
                transactionCode);

            return results[0];
        }

        function addRoleToUser(discordId) {
            const guild = global.bot.client.guilds.get(global.bot.config.discord.guildId);
            guild.members.get(discordId).addRole(global.bot.config.discord.roles.supporter).catch(console.error);
        }

        const allTransactionInfos = await getAllTransactionInfo();
        const defaultItem = await global.bot.databaseConnection.query("SELECT * FROM mapBot_item WHERE defaultItem = 1");

        for (let i in allTransactionInfos) {
            if (Object.prototype.hasOwnProperty.call(allTransactionInfos, i)) {
                const transactionInfo = allTransactionInfos[i];

                global.bot.logger.info(`Process transactionInfo: ${transactionInfo.textMessage}`);
                const transaction = await getTransaction(transactionInfo.textMessage);
                
                if (typeof transaction == "undefined") {
                    global.bot.logger.info("transaction not found!");
                    continue;
                }

                const user = await getUserById(transaction.userId);
                if (typeof user == "undefined" || user === false) {
                    continue;
                }

                const paymentValue = transactionInfo.paymentValue.substring(0, transactionInfo.paymentValue.indexOf(","));
                const multipleValue = paymentValue / defaultItem[0].currencyValue;
                const durationToAdd = multipleValue * defaultItem[0].duration;
                
                const userAccessLevel = await createdUserAccessLevelIfNotExists(user);
                
                let expireDate = moment(userAccessLevel.expiredAt);
                if (expireDate < moment.now()) {
                    expireDate = moment().add(durationToAdd, "days");
                } else {
                    expireDate.add(durationToAdd, "days");
                }

                await updateTransactionInfoToUsed(transactionInfo.transactionId, user.id);
                await updateTransactionToUsed(transaction.id);
                await updateUserAccessLevel(user, expireDate.format("YYYY-MM-DD HH:mm:ss"));
                addRoleToUser(user.discordId);
                await eventLogger.addTime(user.discordId, durationToAdd);

                const discordUser = await global.bot.client.fetchUser(user.discordId);
                if (discordUser) {
                    const message = global.bot.i18next.t("bot.runner.autoActivation.notificationMessage",
                        { date: expireDate.format("DD.MM.YYYY HH:mm") });
                    discordUser.send(message);
                }

                global.bot.logger.info(`Processed transactionInfo: ${transactionInfo.textMessage} and ${transaction.transactionCode}`);
            }
        }

        setTimeout(autoActivationRun, 1000 * 60 * 3);
    })();
};

module.exports = autoActivation;