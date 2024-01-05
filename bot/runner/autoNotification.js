"use strict";
var autoNotification = async function () {
    (async function autoNotificationRun() {
        const eventLogger = require("../services/eventLogger");
        const moment = require("moment/min/moment-with-locales");
        moment.locale(global.bot.config.defaultLng);

        async function getDiscordId(userId) {
            const results =
                await global.bot.databaseConnection.query("SELECT discordId FROM mapBot_user WHERE id = ?", userId);

            return results[0].discordId;
        }

        async function updateUserAccessLevel(userAccessLevelId) {
            const results =
                await global.bot.databaseConnection.query(
                    "UPDATE mapBot_userAccessLevel SET notification = 1 WHERE id = ?",
                    userAccessLevelId);

            return results[0];
        }

        const expiredDateForNotification = moment().add(3, "days");
        const results = await global.bot.databaseConnection.query(
            "SELECT * FROM mapBot_userAccessLevel WHERE expiredAt <= ? AND notification = 0",
            expiredDateForNotification.format("YYYY-MM-DD HH:mm"));

        for (let index in results) {
            if (Object.prototype.hasOwnProperty.call(results, index)) {
                const userAccessLevel = results[index];
                const discordId = await getDiscordId(userAccessLevel.userId);

                const user = await global.bot.client.fetchUser(discordId);
                if (user) {
                    const expireDate = moment(userAccessLevel.expiredAt).format("DD.MM.YYYY HH:mm");
                    user.send(global.bot.i18next.t("bot.runner.autoNotification.notificationMessage",
                        { date: expireDate }));
                    await eventLogger.notification(discordId, expireDate);
                    await updateUserAccessLevel(userAccessLevel.id);
                }
            }
        }

        setTimeout(autoNotificationRun, 60000);
    })();
};

module.exports = autoNotification;