"use strict";
/**
 * Manage member.
 * commands like:
 * !member verlauf <discord#1234>
 * !member status <discord#1234>
 * !member add <day> <discord#1234>
 *
 * @param {any} message
 * @param {any} cmd
 */
var status = async function (message, cmd) {
    const commandBuilder = require("./../../services/commandBuilder");
    const i18Next = require("i18next");
    const moment = require("moment/min/moment-with-locales");
    moment.locale(global.bot.config.defaultLng);

    async function getUserByDiscordTag(discordTag) {
        const results =
            await global.bot.databaseConnection.query("SELECT * FROM mapBot_user WHERE discordTag = ?", [discordTag]);

        if (results.length === 0) {
            return false;
        }

        return results[0];
    }

    async function getUserAccessLevelHistory(userId) {
        const results =
            await global.bot.databaseConnection.query(
                "SELECT * FROM mapBot_userAccessLevelHistory WHERE userId = ? ORDER BY createdAt",
                userId);

        return results;
    }

    async function getUserAccessLevel(userId) {
        const results =
            await global.bot.databaseConnection.query("SELECT * FROM mapBot_userAccessLevel WHERE userId = ?", userId);

        return results[0];
    }

    async function createdUserAccessLevelIfNotExists(user) {
        const results =
            await global.bot.databaseConnection.query("SELECT * FROM mapBot_userAccessLevel WHERE userId = ?", user.id);

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

    function addRoleToUser(discordId) {
        const guild = global.bot.client.guilds.get(global.bot.config.discord.guildId);
        guild.members.get(discordId).addRole(global.bot.config.discord.roles.supporter).catch(console.error);
    }

    var expireDate;
    var user;
    if (cmd[0] === commandBuilder.build("member") && cmd[1] === "status" && cmd[2]) {
        let userDiscordTag = cmd[2];

        user = await getUserByDiscordTag(userDiscordTag);
        if (typeof user == "undefined" || user === false) {
            message.channel.send(i18Next.t("bot.modules.admin.member.userUnknown", { command: commandBuilder.build("neu") }));

            return false;
        }

        const accessLevel = await getUserAccessLevel(user.id);
        expireDate = moment(accessLevel.expiredAt).format("DD.MM.YYYY HH:mm");

        message.channel.send(global.bot.i18next.t("bot.modules.admin.member.statusMessage", { expireDate: expireDate }));
    } else if (cmd[0] === commandBuilder.build("member") && cmd[1] === "verlauf" && cmd[2]) {
        let userDiscordTag = cmd[2];

        user = await getUserByDiscordTag(userDiscordTag);
        if (typeof user == "undefined" || user === false) {
            message.channel.send(i18Next.t("bot.modules.admin.member.userUnknown", { command: commandBuilder.build("neu") }));

            return false;
        }

        const history = await getUserAccessLevelHistory(user.id);

        var messageToSend = "";

        for (var index in history) {
            if (Object.prototype.hasOwnProperty.call(history, index)) {
                var historyDetails = history[index];

                var eventDate = moment(historyDetails.createdAt).format("DD.MM.YYYY HH:mm");

                if (messageToSend.length > 1800) {
                    await message.channel.send(global.bot.i18next.t("bot.modules.admin.member.historyMessage",
                        { messageToSend: messageToSend }));
                    messageToSend = "";
                }

                messageToSend += `[${eventDate}] ${historyDetails.details}\n`;
            }
        }

        message.channel.send(global.bot.i18next.t("bot.modules.admin.member.historyMessage", { messageToSend: messageToSend }));

    } else if (cmd[0] === commandBuilder.build("member") && cmd[1] === "add" && cmd[2] && cmd[3]) {
        const eventLogger = require("./../../services/eventLogger");
        let userDiscordTag = cmd[3];

        user = await getUserByDiscordTag(userDiscordTag);
        if (typeof user == "undefined" || user === false) {
            message.channel.send(global.bot.i18next.t("bot.modules.admin.member.userForTransactionUnknown", { command: commandBuilder.build("neu") }));

            return false;
        }

        const durationToAdd = cmd[2];

        var userAccessLevel = await getUserAccessLevel(user.id);
        expireDate = moment(userAccessLevel.expiredAt);
        if (expireDate < moment.now()) {
            expireDate = moment().add(durationToAdd, "days");
        } else {
            expireDate.add(durationToAdd, "days");
        }

        //await updateTransactionInfoToUsed(transactionId, user.id);
        await createdUserAccessLevelIfNotExists(user);
        await updateUserAccessLevel(user, expireDate.format("YYYY-MM-DD HH:mm:ss"));
        addRoleToUser(user.discordId);
        await eventLogger.addTimeForOther(user.discordId, durationToAdd, message.author.tag);
        message.channel.send(global.bot.i18next.t("bot.modules.admin.member.success"));
    }

    return false;
};

module.exports = status;