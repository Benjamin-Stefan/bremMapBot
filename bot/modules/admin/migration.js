"use strict";
/**
 * Manage member.
 * commands like:
 * !migration <discordTag> <date>
 *
 * @param {any} message
 * @param {any} cmd
 */
var migration = async function (message, cmd) {
    const commandBuilder = require("./../../services/commandBuilder");
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

    async function getUserByDiscordId(discordId) {
        const results = await global.bot.databaseConnection.query("SELECT * FROM mapBot_user WHERE discordId = ?", [discordId]);

        if (results.length === 0) {
            return false;
        }

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

    async function insertUser(user) {
        const results = await global.bot.databaseConnection.query("INSERT INTO mapBot_user SET ?", user);

        return results.affectedRows > 0;
    }

    if (cmd[0] === commandBuilder.build("migration") && cmd[1] && cmd[2]) {
        const eventLogger = require("./../../services/eventLogger");

        const guild = global.bot.client.guilds.get(global.bot.config.discord.guildId);
        let usernameTag = cmd[1];

        var user;
        var r = await guild.fetchMembers();
        var rUser;
        r.members.array().forEach(r => {

            const disUsername = `${r.user.tag}`;

            if (disUsername === usernameTag) {
                rUser = r.user;
            }
        });

        if (typeof rUser == "undefined" || rUser === false) {
            message.channel.send(global.bot.i18next.t("bot.modules.admin.member.userForTransactionUnknown", { command: commandBuilder.build("neu") }));

            return false;
        }

        user = { name: rUser.username, discordTag: rUser.tag, discordId: rUser.id, defaultLanguage: global.bot.config.defaultLng };

        var results = await global.bot.databaseConnection.query("SELECT * FROM mapBot_user WHERE discordId = ?", user.discordId);

        if (results.length === 0) {
            var result = await insertUser(user);

            if (typeof result == "undefined" || result === false) {
                return false;
            }


            let guild = global.bot.client.guilds.get(global.bot.config.discord.guildId);
            guild.members.get(message.author.id).addRole(global.bot.config.discord.roles.trainer)
                .catch(console.error);

            var newUser = await getUserByDiscordTag(rUser.tag);
            if (typeof newUser == "undefined" || newUser === false) {
                message.channel.send(global.bot.i18next.t("bot.modules.admin.member.userForTransactionUnknown", { command: commandBuilder.build("neu") }));

                return false;
            }

            const dateEnd = cmd[2];

            var expireDate = moment(dateEnd + " 12:00:00").add(1, "days");
            await createdUserAccessLevelIfNotExists(newUser);
            await updateUserAccessLevel(newUser, expireDate.format("YYYY-MM-DD HH:mm:ss"));
            addRoleToUser(newUser.discordId);
            await eventLogger.addTimeForMigration(newUser.discordId, expireDate.format("DD.MM.YYYY HH:mm"));

            const userToSendMessage = await global.bot.client.fetchUser(rUser.id);
            if (userToSendMessage) {
                userToSendMessage.send(`Willkommen, dein Zugang gilt bis ${expireDate.format("DD.MM.YYYY HH:mm")}\nF\u00FCr mehr Informationen bitte den Befehl .help ausf\u00FChren.`);
                message.channel.send(global.bot.i18next.t("bot.modules.admin.member.success"));
            }
        } else {
            message.channel.send("Benutzer schon migriert!");
        }
    } else if (cmd[0] === commandBuilder.build("migrationid") && cmd[1] && cmd[2]) {
        const eventLogger = require("./../../services/eventLogger");

        const guild = global.bot.client.guilds.get(global.bot.config.discord.guildId);
        let usernameId = cmd[1];

        var user;
        var r = await guild.fetchMembers();
        var rUser = await global.bot.client.fetchUser(usernameId);

        if (typeof rUser == "undefined" || rUser === false) {
            message.channel.send(global.bot.i18next.t("bot.modules.admin.member.userForTransactionUnknown", { command: commandBuilder.build("neu") }));

            return false;
        }

        user = { name: rUser.username, discordTag: rUser.tag, discordId: rUser.id, defaultLanguage: global.bot.config.defaultLng };

        var results = await global.bot.databaseConnection.query("SELECT * FROM mapBot_user WHERE discordId = ?", user.discordId);

        if (results.length === 0) {
            var result = await insertUser(user);

            if (typeof result == "undefined" || result === false) {
                return false;
            }

            let guild = global.bot.client.guilds.get(global.bot.config.discord.guildId);
            guild.members.get(message.author.id).addRole(global.bot.config.discord.roles.trainer)
                .catch(console.error);

            var newUser = await getUserByDiscordId(rUser.id);
            if (typeof newUser == "undefined" || newUser === false) {
                message.channel.send(global.bot.i18next.t("bot.modules.admin.member.userForTransactionUnknown", { command: commandBuilder.build("neu") }));

                return false;
            }

            const dateEnd = cmd[2];

            var expireDate = moment(dateEnd + " 12:00:00").add(1, "days");
            await createdUserAccessLevelIfNotExists(newUser);
            await updateUserAccessLevel(newUser, expireDate.format("YYYY-MM-DD HH:mm:ss"));
            addRoleToUser(newUser.discordId);
            await eventLogger.addTimeForMigration(newUser.discordId, expireDate.format("DD.MM.YYYY HH:mm"));

            const userToSendMessage = await global.bot.client.fetchUser(rUser.id);
            if (userToSendMessage) {
                userToSendMessage.send(`Willkommen, dein Zugang gilt bis ${expireDate.format("DD.MM.YYYY HH:mm")}\nF\u00FCr mehr Informationen bitte den Befehl .help ausf\u00FChren.`);
                message.channel.send(global.bot.i18next.t("bot.modules.admin.member.success"));
            }
        } else {
            message.channel.send("Benutzer schon migriert!");
        }
    }

    return false;
};

module.exports = migration;