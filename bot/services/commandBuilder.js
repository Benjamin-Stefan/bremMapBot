"use strict";
/**
 * 
 * @param {string} cmd
 */
var build = function (cmd) {
    return bot.config.commandPrefix + cmd;
}

module.exports = {
    build: build
}