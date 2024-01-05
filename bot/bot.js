"use strict";
global.bot = (() => {
    const folderRoot = global.__basedir + "/";
    const discord = require("discord.js");
    const util = require("util");
    const i18Next = require("i18next");
    const i18NextBackend = require("i18next-fs-backend");
    const winston = require("winston");
    const fs = require("fs");
    const mysql = require("mysql");
    const config = JSON.parse(fs.readFileSync(folderRoot + "config/config.ini", "utf8"));

    i18Next
        .use(i18NextBackend)
        .init({
            lng: config.defaultLng,
            debug: false,
            backend: {
                loadPath: __dirname + "/../locales/{{lng}}/{{ns}}.json"
            },
            fallbackLng: config.fallbackLng,
            preload: ["de", "en"]
        });

    const myFormat = winston.format.printf(({ level, message, timestamp }) => {
        return `[${timestamp}] [${level}]: ${message}`;
    });

    const logger = winston.createLogger({
        level: "info",
        format: winston.format.combine(
            winston.format.timestamp(),
            myFormat
        ),
        //format: winston.format.simple(),
        transports: [
            new winston.transports.File({ filename: "log/error.log", level: "error" }),
            new winston.transports.File({ filename: "log/info.log" })
        ],
        exceptionHandlers: [
            new winston.transports.File({ filename: "log/exceptions.log" })
        ]
    });

    if (process.env.NODE_ENV !== "production") {
        logger.add(new winston.transports.Console({
            format: winston.format.combine(
                //winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.simple(),
                myFormat
            )
        }));
    }

    function makeDatabaseConnection(configParams) {
        const connectionPool = mysql.createPool(configParams);

        connectionPool.getConnection((err, connection) => {
            if (err) {
                if (err.code === "PROTOCOL_CONNECTION_LOST") {
                    bot.logger.error("Database connection was closed.", err);
                }
                if (err.code === "ER_CON_COUNT_ERROR") {
                    bot.logger.error("Database has too many connections.", err);
                }
                if (err.code === "ECONNREFUSED") {
                    bot.logger.error("Database connection was refused.", err);
                }
            }

            if (connection) {
                connection.release();
            }

            return;
        });

        // Promisify for Node.js async/await.
        connectionPool.query = util.promisify(connectionPool.query);
        
        return connectionPool;
    }

    const databaseConnection = makeDatabaseConnection({
        connectionLimit: 10,
        host: config.database.host,
        port: config.database.port ? config.database.port : 3306,
        user: config.database.user,
        password: config.database.password,
        database: config.database.name,
        charset: "utf8mb4"
    });

    const appExit = (error = null) => {
        if (error) {
            bot.logger.error("appExit error: ", error);
        }

        if (bot.client) {
            bot.client.destroy((error) => {
                bot.logger.error(error);
            });
        }

        if (bot.databaseConnection) {
            bot.databaseConnection.end();
        }

        bot.logger.info("process.exit");
        process.exit();
    };

    const appError = (error = null, message) => {
        if (error) {
            bot.logger.error("App error: ", error);
            //forward to admin
            bot.client.fetchUser(bot.config.discord.adminUserId).then(user => {
                if (user) {
                    user.send(`${message.author.tag}(${message.author.id}) sent this message to this bot:\n\`\`\`${message.content}\n\`\`\`\n\n and throw this error:\n\`\`\`${error}\n\`\`\``);
                }
            });
        }
    };

    return {
        client: new discord.Client(),
        config: config,
        //folderRoot: folderRoot,
        i18next: i18Next,
        logger: logger,
        databaseConnection,
        modules: [],
        adminModules: [],
        appExit: appExit,
        appError: appError
    };
})();