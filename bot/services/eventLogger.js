"use strict";

/**
 *
 * @param {string} discordId - DiscordId from discord user
 * @returns {} id of userAccessLevel
 */
async function getUserAccessLevelId(discordId) {
    const results = await bot.databaseConnection.query("SELECT id FROM mapBot_userAccessLevel WHERE userId = (SELECT id FROM mapBot_user WHERE discordId = ?)", discordId);

    return results[0].id;
}

/**
 *
 * @param {string} discordId - DiscordId from discord user
 * @returns {} id of user
 */
async function getUserId(discordId) {
    const results = await bot.databaseConnection.query("SELECT id FROM mapBot_user WHERE discordId = ?", discordId);

    return results[0].id;
}

/**
 *
 * @param {string} discordId - DiscordId from discord user
 * @param {number} duration - Time value to add
 * @returns {}
 */
async function addTime(discordId, duration) {
    const userAccessLevelId = await getUserAccessLevelId(discordId);
    const userId = await getUserId(discordId);
    const details = bot.i18next.t("bot.services.eventLogger.addTime", { duration: duration });

    await log(userAccessLevelId, userId, "AddTime", details);
}

/**
 * 
 * @param {string} discordId - DiscordId from discord user
 * @param {number} duration - Time value to add
 * @param {string} actionUsername - Username from executing user
 * @returns {} 
 */
async function addTimeForOther(discordId, duration, actionUsername) {
    const userAccessLevelId = await getUserAccessLevelId(discordId);
    const userId = await getUserId(discordId);
    const details = bot.i18next.t("bot.services.eventLogger.addTimeForOther", { duration: duration, actionUsername: actionUsername });

    await log(userAccessLevelId, userId, "AddTime", details);
}

/**
 * 
 * @param {string} discordId - DiscordId from discord user
 * @param {number} duration - Time value to add
 * @param {string} actionUsername - Username from executing user
 * @returns {} 
 */
async function addTimeForMigration(discordId, date) {
    const userAccessLevelId = await getUserAccessLevelId(discordId);
    const userId = await getUserId(discordId);
    const details = bot.i18next.t("bot.services.eventLogger.addTimeForMigration", { date: date });

    await log(userAccessLevelId, userId, "AddTime", details);
}

/**
 *
 * @param {string} discordId - DiscordId from discord user
 * @param {string} date - Datetime format
 * @returns {} 
 */
async function notification(discordId, date) {
    const userAccessLevelId = await getUserAccessLevelId(discordId);
    const userId = await getUserId(discordId);
    const details = bot.i18next.t("bot.services.eventLogger.notification", { date: date });

    return await log(userAccessLevelId, userId, "Notification", details);
}

/**
 * 
 * @param {string} discordId - DiscordId from discord user
 * @param {string} date - Datetime format
 * @returns {} 
 */
async function removeAccess(discordId, date) {
    const userAccessLevelId = await getUserAccessLevelId(discordId);
    const userId = await getUserId(discordId);
    const details = bot.i18next.t("bot.services.eventLogger.removeAccess", { date: date });

    return await log(userAccessLevelId, userId, "Notification", details);
}

/**
 * Write logs to database
 * @param {number} userAccessLevelId - databaseId of userAccessLevel
 * @param {number} userId - databaseId of user
 * @param {string} event - event like ADD, REMOVE etc.
 * @param {string} details - describes what happened
 * @returns {boolean} affectedRows > 0
 */
async function log(userAccessLevelId, userId, event, details) {
    const userAccessLevelHistory = { userAccessLevelId: userAccessLevelId, userId: userId, event: event, details: details };

    const insertResult = await bot.databaseConnection.query("INSERT INTO mapBot_userAccessLevelHistory SET ?", userAccessLevelHistory);

    return insertResult.affectedRows > 0;
}

module.exports = {
    addTime: addTime,
    addTimeForOther: addTimeForOther,
    addTimeForMigration: addTimeForMigration,
    notification: notification,
    removeAccess: removeAccess
};;