"use strict";
var status = function (message, cmd) {
    const commandBuilder = require("./../../services/commandBuilder");

    if (message.content.startsWith("ping") || cmd[0] === commandBuilder.build("ping")) {
        message.channel.send(new Date().getTime() - message.createdTimestamp + " ms");
    }
};

module.exports = status;