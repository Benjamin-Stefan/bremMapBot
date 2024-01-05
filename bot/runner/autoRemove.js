"use strict";
var autoRemove = async function () {
    (async function autoRemoveRun() {
        const eventLogger = require("../services/eventLogger");
        const moment = require("moment/min/moment-with-locales");
        moment.locale(global.bot.config.defaultLng);

        async function getDiscordId(userId) {
            const results =
                await global.bot.databaseConnection.query("SELECT discordId FROM mapBot_user WHERE id = ?", userId);

            return results[0].discordId;
        }

        async function removeRole(discordId) {
            const guild = global.bot.client.guilds.get(global.bot.config.discord.guildId);
            guild.members.get(discordId).removeRole(global.bot.config.discord.roles.supporter).catch(console.error);
        }

        async function updateUserAccessLevel(userAccessLevelId) {
            const results =
                await global.bot.databaseConnection.query("UPDATE mapBot_userAccessLevel SET removed = 1 WHERE id = ?",
                    userAccessLevelId);

            return results[0];
        }

        const momentNow = moment();
        const results = await global.bot.databaseConnection.query(
            "SELECT * FROM mapBot_userAccessLevel WHERE expiredAt <= ? AND removed = 0",
            momentNow.format("YYYY-MM-DD HH:mm"));

        for (let index in results) {
            if (Object.prototype.hasOwnProperty.call(results, index)) {
                const userAccessLevel = results[index];

                const discordId = await getDiscordId(userAccessLevel.userId);

                const user = await global.bot.client.fetchUser(discordId);
                if (user) {
                    const expireDate = moment(userAccessLevel.expiredAt).format("DD.MM.YYYY HH:mm");
                    user.send(global.bot.i18next.t("bot.runner.autoRemove.notificationMessage", { date: expireDate }));
                    await eventLogger.removeAccess(discordId, expireDate);
                    await removeRole(discordId);
                    await updateUserAccessLevel(userAccessLevel.id);
                }
            }
        }

        setTimeout(autoRemoveRun, 60000);
    })();
};

module.exports = autoRemove;