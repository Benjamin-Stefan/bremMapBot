"use strict";
var help = function (message, cmd) {
    const commandBuilder = require("./../services/commandBuilder");

    if (cmd[0] === commandBuilder.build("help") || cmd[0] === commandBuilder.build("hilfe")) {
        const helpMessage = "**Eine \u00DCbersicht der Befehle**\n" +
            "*Die Befehle m\u00FCsst ihr mit dem . (Punkt) zu mir (dem Bot) senden*\n\n"+
            "**Spenden**\n" +
            "*Hol dir mir .freischaltung eine Zahlen und Buchstabenkombinationen.\nDie Kombination gibt ihr bei PayPal als Mitteilung an.*\n"+
            ".freischaltung\n\n" +
            "**Status**\n" +
            "*Informationen zum Status*\n"+
            ".status\n" +
            ".verlauf\n" +
            ".update\n" +
            ".neu\n\n" +
            "**Hilfe**\n" +
            ".hilfe";

        message.channel.send(helpMessage);
    } else if (cmd[0] === commandBuilder.build("help") ||
        cmd[0] === commandBuilder.build("hilfe") && cmd[1] === "spenden") {
        const helpMessageSpenden = "";

        message.channel.send(helpMessageSpenden);
    }
};

module.exports = help;