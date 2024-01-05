"use strict";
/**
 * Manage item.
 * 
 * commands like:
 * !item list
 * !item add <name> <duration> <currencyValue> <currency> <defaultItem>
 * !item change <id> <property> <newValue>
 * !item default <id>
 *
 * @param {any} message
 * @param {any} cmd
 */
var item = function (message, cmd) {
    const commandBuilder = require("./../../services/commandBuilder");
    const tableName = "mapBot_item";

    if (cmd[0] === commandBuilder.build("item") && cmd[1] === "list") {
        global.bot.databaseConnection.query(`SELECT * FROM ${tableName}`, (error, results) => {
            if (error) {
                global.bot.appError(error, message);

                return false;
            }

            if (results[0]) {
                let reply = "";
                for (let i in results) {
                    if (Object.prototype.hasOwnProperty.call(results, i)) {
                        reply += `\`\`\`Id: ${results[i].id}\nName: ${results[i].name}\nDuration: ${results[i].duration
                            }\nCurrencyValue: ${results[i].currencyValue}\nCurrency: ${results[i].currency
                            }\DefaultItem: ${results[i].defaultItem}\nCreatedAt: ${results[i].createdAt}\nUpdatedAt: ${
                            results[i].updatedAt}\n\`\`\``;
                    }
                }

                message.channel.send(reply);
            }

            return false;
        });
    } else if (cmd[0] === commandBuilder.build("item") && cmd[1] === "add" && cmd[2] && cmd[3] && cmd[4] && cmd[5] && cmd[6]) {
        const newItem = {
            name: cmd[2],
            duration: cmd[3],
            currencyValue: cmd[4],
            currency: cmd[5],
            defaultItem: cmd[6]
        };

        global.bot.databaseConnection.query(`INSERT INTO ${tableName} SET ?`, newItem, (error, results) => {
            if (error) {
                global.bot.appError(error, message);

                return false;
            }

            if (results) {
                message.channel.send(`Item added with id: ${results.insertId}`);
            }

            return false;
        });
    } else if (cmd[0] === commandBuilder.build("item") && cmd[1] === "change" && cmd[2] && cmd[3] && cmd[4]) {
        let sqlQuery = "";
        if (cmd[3] === "name") {
            sqlQuery = `UPDATE ${tableName} SET name = ? WHERE id = ?`;
        } else if (cmd[3] === "duration") {
            sqlQuery = `UPDATE ${tableName} SET duration = ? WHERE id = ?`;
        } else if (cmd[3] === "currencyValue") {
            sqlQuery = `UPDATE ${tableName} SET cureencyValue = ? WHERE id = ?`;
        } else if (cmd[3] === "currency") {
            sqlQuery = `UPDATE ${tableName} SET currency = ? WHERE id = ?`;
        }

        global.bot.databaseConnection.query(sqlQuery, [cmd[4], cmd[2]], (error, results) => {
            if (error) {
                global.bot.appError(error, message);

                return false;
            }

            if (results) {
                message.channel.send(results.message);
            }

            return false;
        });
    } else if (cmd[0] === commandBuilder.build("item") && cmd[1] === "default" && cmd[2]) {
        global.bot.databaseConnection.query(`UPDATE ${tableName} SET defaultItem = 0 WHERE defaultItem = 1`, (error, results) => {
            if (error) {
                global.bot.appError(error, message);

                return false;
            }

            if (results) {
                message.channel.send(results.message);
            }

            return false;
        });
        global.bot.databaseConnection.query(`UPDATE ${tableName} SET defaultItem = 1 WHERE id = ?`, cmd[2], (error, results) => {
            if (error) {
                global.bot.appError(error, message);

                return false;
            }

            if (results) {
                message.channel.send(results.message);
            }

            return false;
        });
    } else if (cmd[0] === commandBuilder.build("item")) {
        message.channel.send(global.bot.i18next.t("bot.modules.admin.item.help"));
    }
};

module.exports = item;