"use strict";
/**
 * Manage memberStatus.
 * 
 * commands like:
 * !status
 * !verlauf
 * !update
 * !neu
 *
 * @param {any} message
 * @param {any} cmd
 */
var memberStatus = async function (message, cmd) {
    const commandBuilder = require("./../services/commandBuilder");
    const i18Next = require("i18next");
    const moment = require("moment/min/moment-with-locales");
    moment.locale(global.bot.config.defaultLng);

    async function getUserByDiscordId(discordId) {
        const results =
            await global.bot.databaseConnection.query("SELECT * FROM mapBot_user WHERE discordId = ?", [discordId]);

        if (results.length === 0) {
            return false;
        }

        return results[0];
    }

    async function insertUser(user) {
        const results = await global.bot.databaseConnection.query("INSERT INTO mapBot_user SET ?", user);

        return results.affectedRows > 0;
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

    var user;
    if (cmd[0] === commandBuilder.build("status")) {
        let userDiscordId = message.author.id;

        user = await getUserByDiscordId(userDiscordId);
        if (typeof user == "undefined" || user === false) {
            message.channel.send(i18Next.t("bot.modules.memberStatus.userUnknown", { command: commandBuilder.build("neu") }));

            return false;
        }

        const accessLevel = await getUserAccessLevel(user.id);
        if (typeof accessLevel == "undefined" || accessLevel === false) {
            message.channel.send(i18Next.t("bot.modules.memberStatus.userNoDonation"));

            return false;
        }

        var expireDate = moment(accessLevel.expiredAt).format("DD.MM.YYYY HH:mm");

        message.channel.send(global.bot.i18next.t("bot.modules.memberStatus.statusMessage", { expireDate: expireDate }));
    } else if (cmd[0] === commandBuilder.build("verlauf")) {
        let userDiscordId = message.author.id;

        user = await getUserByDiscordId(userDiscordId);
        if (typeof user == "undefined" || user === false) {
            message.channel.send(i18Next.t("bot.modules.memberStatus.userUnknown", { command: commandBuilder.build("neu") }));

            return false;
        }

        const history = await getUserAccessLevelHistory(user.id);

        var messageToSend = "";

        for (var index in history) {
            if (Object.prototype.hasOwnProperty.call(history, index)) {
                var historyDetails = history[index];

                var eventDate = moment(historyDetails.createdAt).format("DD.MM.YYYY HH:mm");

                if (messageToSend.length > 1800) {
                    await message.channel.send(global.bot.i18next.t("bot.modules.memberStatus.historyMessage",
                        { messageToSend: messageToSend }));
                    messageToSend = "";
                }

                messageToSend += global.bot.i18next.t("bot.modules.memberStatus.historyMessageTemplate", { eventDate: eventDate, details: historyDetails.details });
            }
        }

        if (messageToSend.length === 0) {
            messageToSend = global.bot.i18next.t("bot.modules.memberStatus.nothing");
        }

        message.channel.send(global.bot.i18next.t("bot.modules.memberStatus.historyMessage", { messageToSend: messageToSend }));
    } else if (cmd[0] === commandBuilder.build("update")) {
        user = { name: message.author.username, tag: message.author.tag, discordId: message.author.id };

        user = getUserByDiscordId(user.discordId);
        if (typeof user == "undefined" || user === false) {
            message.channel.send(i18Next.t("bot.modules.memberStatus.userUnknown", { command: commandBuilder.build("neu") }));

            return false;
        }

        global.bot.databaseConnection.query("UPDATE mapBot_user SET name = ?, tag = ? WHERE discordId = ?", [user.name, user.tag, user.discordid, user.discordid]);

        message.channel.send(i18Next.t("bot.modules.memberStatus.updateSuccess"));
    } else if (cmd[0] === commandBuilder.build("neu")) {
        user = { name: message.author.username, discordTag: message.author.tag, discordId: message.author.id, defaultLanguage: global.bot.config.defaultLng };

        var results = await global.bot.databaseConnection.query("SELECT * FROM mapBot_user WHERE discordId = ?", user.discordId);

        if (results.length === 0) {
            var result = await insertUser(user);

            if (typeof result == "undefined" || result === false) {

                return false;
            }

            message.channel.send(i18Next.t("bot.modules.memberStatus.userWelcome", { command: commandBuilder.build("help") }));

            let guild = global.bot.client.guilds.get(global.bot.config.discord.guildId);
            guild.members.get(message.author.id).addRole(global.bot.config.discord.roles.trainer).catch(console.error);
        } else {
            message.channel.send(i18Next.t("bot.modules.memberStatus.userKnown", { command: commandBuilder.build("help") }));
        }
    }

    return false;
};

module.exports = memberStatus;