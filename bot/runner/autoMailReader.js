"use strict";
var autoMailReader = function () {
    (function autoMailReaderRun() {
        const Imap = require("imap");
        const jsdom = require("jsdom");
        // ReSharper disable InconsistentNaming
        const { JSDOM } = jsdom;
        // ReSharper restore InconsistentNaming
        var moment = require("moment/min/moment-with-locales");
        moment.locale(global.bot.config.defaultLng);

        var imap = new Imap({
            user: global.bot.config.imap.user,
            password: global.bot.config.imap.password,
            host: global.bot.config.imap.host,
            port: global.bot.config.imap.port,
            tls: global.bot.config.imap.tls,
            tlsOptions: {
                servername: global.bot.config.imap.host
            }
        });

        function getTextMessage(dom) {
            try {
                return dom.window.document.querySelector("body > table > tbody > tr > td.mobContent > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(3) > tbody > tr > td > table > tbody > tr > td.ppsans").textContent;
            } catch (e) {
                return dom.window.document.querySelector("body > table > tbody > tr > td.mobContent > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(2) > tbody > tr > td > table > tbody > tr > td").textContent;
            }
        }

        function getTransactionId(dom) {
            try {
                return dom.window.document.querySelector("body > table > tbody > tr > td.mobContent > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(4) > tbody > tr:nth-child(2) > td > table > tbody > tr > td > table > tbody > tr > td:nth-child(1)").textContent;
            }
            catch (e) {
                return dom.window.document.querySelector("body > table > tbody > tr > td.mobContent > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(3) > tbody > tr:nth-child(2) > td > table > tbody > tr > td > table > tbody > tr > td:nth-child(1)").textContent;
            }
        }

        function getTransactionDate(dom) {
            try {
                return dom.window.document.querySelector("body > table > tbody > tr > td.mobContent > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(4) > tbody > tr:nth-child(2) > td > table > tbody > tr > td > table > tbody > tr > td.ppsans.padding0").textContent;

            } catch (e) {
                return dom.window.document.querySelector("body > table > tbody > tr > td.mobContent > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(3) > tbody > tr:nth-child(2) > td > table > tbody > tr > td > table > tbody > tr > td.ppsans.padding0").textContent;
            }
        }

        function getPaymentValue(dom) {
            try {
                return dom.window.document.querySelector("body > table > tbody > tr > td.mobContent > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(4) > tbody > tr:nth-child(3) > td > table:nth-child(2) > tbody > tr > td:nth-child(2) > table > tbody > tr > td").textContent;
            } catch (e) {
                return dom.window.document.querySelector("body > table > tbody > tr > td.mobContent > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(3) > tbody > tr:nth-child(3) > td > table:nth-child(2) > tbody > tr > td:nth-child(2) > table > tbody > tr > td").textContent;
            }
        }

        function saveTransaction(transactionInfo) {
            global.bot.databaseConnection.query("SELECT * FROM mapBot_transactionInfo WHERE transactionId = ?", transactionInfo.transactionId, (error, results) => {
                if (error) {
                    global.bot.logger.error(error);
                    //forward to admin
                    global.bot.client.fetchUser(global.bot.config.discord.adminUserId).then(user => {
                        if (user) {
                            user.send(`${message.author.tag}(${message.author.id}) sent this message to this bot:\n\`\`\`${message.content}\n\`\`\`\n\n and throw this error:\n\`\`\`${error}\n\`\`\``);
                        }
                    });

                    return false;
                }

                if (results.length === 0) {
                    global.bot.databaseConnection.query("INSERT INTO mapBot_transactionInfo SET ? ", transactionInfo, (error, results) => {
                        if (error) {
                            global.bot.logger.error(error);
                            //forward to admin
                            global.bot.client.fetchUser(global.bot.config.discord.adminUserId).then(user => {
                                if (user) {
                                    user.send(`${message.author.tag}(${message.author.id}) sent this message to this bot:\n\`\`\`${message.content}\n\`\`\`\n\n and throw this error:\n\`\`\`${error}\n\`\`\``);
                                }
                            });

                            return false;
                        }

                        if (results) {
                            return results.affectedRows > 0;
                        }

                        return false;
                    });
                }

                return false;
            });
        }

        function openInbox(cb) {
            imap.openBox("INBOX", false, cb);
        }

        imap.once("ready", function () {
            openInbox(function (err) {
                if (err) throw err;
                //Sie haben Geld erhalten
                //Sie haben eine Zahlung erhalten
                imap.seq.search(["UNSEEN", ["FROM", global.bot.config.imap.mailFrom], ["OR", ["SUBJECT", global.bot.config.imap.mailFromSubject[0]], ["SUBJECT", global.bot.config.imap.mailFromSubject[1]]]], function (error, results) {
                    if (error) throw error;
                    if (!results || !results.length) {
                        //global.bot.logger.info("Nothin to fetch");

                        return;
                    }

                    const f = imap.fetch(results, { bodies: "" });

                    f.on("message", function (msg, seqno) {
                        var prefix = `(#${seqno}) `;

                        msg.once("attributes", function (attrs) {
                            const fseq = imap.seq.fetch(attrs.uid, {
                                bodies: ["TEXT"],
                                struct: true
                            });

                            fseq.on("message", function (msg, seqno) {
                                var obj = {};

                                obj.num = seqno;

                                msg.on("body", function (stream, info) {
                                    var buffer;
                                    if (info.which === "TEXT") {
                                        buffer = "";
                                    }

                                    stream.on("data", function (chunk) {
                                        buffer += chunk.toString();
                                    });

                                    stream.once("end", function () {
                                        if (info.which !== "TEXT") {
                                            obj.header = Imap.parseHeader(buffer);
                                        }
                                        else {
                                            obj.body = buffer;

                                            const plainText = Buffer.from(buffer, "base64").toString();

                                            // ReSharper disable InconsistentNaming
                                            const dom = new JSDOM(plainText);
                                            // ReSharper restore InconsistentNaming

                                            const textMessage = getTextMessage(dom).trim();
                                            const transactionId = getTransactionId(dom).replace("Transaction ID:", "").replace("Transaktionscode:", "").trim();
                                            const transactionDate = getTransactionDate(dom);
                                            const paymentValue = getPaymentValue(dom).replace("EUR", "").trim();

                                            const dateToSave = moment(transactionDate, "D. MMMM YYYY").format("YYYY-MM-DD HH:mm:ss");

                                            global.bot.logger.info(`Id: ${transactionId} DatePlain: ${transactionDate} Date: ${dateToSave} Value: ${paymentValue} Message: ${textMessage}`);
                                            saveTransaction({ transactionId: transactionId, transactionDate: dateToSave, paymentValue: paymentValue, textMessage: textMessage });
                                        }
                                    });
                                });
                            });

                            fseq.once("error", function (err) {
                                global.bot.logger.error("Fetch error: ", err);
                            });

                            fseq.once("end", function () {
                                global.bot.logger.info("Done fetching all messages!");
                                //imap.end();
                            });
                        });

                        msg.once("end", function () {
                            global.bot.logger.info(prefix + "Finished");
                        });
                    });

                    f.once("error", function (err) {
                        global.bot.logger.error("Fetch error: ", err);
                    });

                    f.once("end", function () {
                        global.bot.logger.info("Done fetching all messages!");

                        imap.setFlags(results, ["\\SEEN"], function (err) {
                            if (err) {
                                global.bot.logger.error("Fetch error: ", err);
                            } else {
                                global.bot.logger.log("info", "marked as read");
                            }
                        });
                        imap.end();
                    });
                });
            });
        });

        imap.once("error", function (err) {
            global.bot.logger.error("Imap error:", err);
        });

        imap.once("end", function () {
            global.bot.logger.log("debug", "Connection ended");
        });

        imap.connect();

        setTimeout(autoMailReaderRun, 1000 * 60 * 5);
    })();
};

module.exports = autoMailReader;