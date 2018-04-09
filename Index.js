"use-strict";

const fs = require("fs-extra");
const nodemailer = require("nodemailer");
const config = require("./Config.js");
const Tail = require("tail").Tail;
const Slack = require("slack-node");

let transporter;
let slack = new Slack();
let mailOptions = {};
const fileWatchers = {};
let messages = new Array();
let queueWorkerRunning = false;

async function notificationQueueWorker() {
    if (queueWorkerRunning) return;
    queueWorkerRunning = true;

    while (messages.length > 0) {
        let message = messages[0];
        messages.shift();

        if (!message) {
            continue;
        }

        let filterExpression = config.defaultMessageTemplateFilter;
        if (message.expression.filter) {
            filterExpression = message.expression.filter;
        }
        let match = message.message.match(filterExpression);

        if (match === null) match = message.message;

        const oldSubject = message.expression.subject;
        if (typeof (message.expression.subject) !== "function") {
            var oldSubjectValue = "";
            if (message.expression.subject && message.expression.subject.toString) oldSubjectValue = message.expression.subject.toString();
            message.expression.subject = () => oldSubjectValue;
        }

        const oldTemplate = message.expression.template;
        if (typeof (message.expression.template) !== "function") {
            var oldTemplateValue = `\`${message.message}\``;
            if (message.expression.template && message.expression.template.toString) oldTemplateValue = message.expression.template.toString();
            message.expression.template = () => oldTemplateValue;
        }

        let subject = message.expression.subject(match);
        let template = message.expression.template(match);
        let messageFiltered = false;
        if (subject === false || template === false) {
            messageFiltered = true;
        }

        if (!messageFiltered && config.enableEmail) {
            await sendMail({
                from: config.mailfrom,
                to: config.mailto,
                subject: `${config.subjectPrefix}${subject}`,
                text: template
            });
        }

        const oldSlackOptions = message.expression.slackOptions;
        if (!messageFiltered && config.enableSlack) {
            let payload = message.expression.slackOptions;
            payload.attachments[0].fallback = `${subject}${template}`;
            payload.attachments[0].text = payload.attachments[0].fallback;
            payload.attachments[0].ts = Date.now() / 1000;
            slack.webhook(payload, (err, response) => {
                if (config.debug && err) console.log(err, response);
            });
        }

        message.expression.subject = oldSubject;
        message.expression.template = oldTemplate;
        message.expression.slackOptions = oldSlackOptions;

        if (!messageFiltered) {
            if (messages.length > 0) console.log(`remaining messages in queue: ${messages.length}`);
            await sleep(1000);
        }
    }

    queueWorkerRunning = false;
}

async function filterLog( /** @type {string} */ line) {
    for (let index = 0; index < config.expressions.length; index++) {
        const expression = config.expressions[index];
        expression.match.lastIndex = 0;

        if (expression.match.test(line)) {
            messages.push({
                expression: expression,
                message: line
            });
        }
    }
}

async function sendMail(mailOptions) {
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                if (config.debug) console.log(error);
                reject(error);
            } else {
                if (config.debug) console.log("Email sent: " + info.response);
                resolve(info);
            }
        });
    });
}

async function setupTail( /** @type {string[]} */ filesToWatch) {
    if (!config.expressions || config.expressions.length < 1) {
        console.error("no expressions defined in config!");
        process.exit(1);
    }

    for (const fileName of filesToWatch) {
        if (!(await fs.exists(fileName))) {
            console.log(`File not found, not watching: ${fileName}`);
            continue;
        }

        const tail = new Tail(fileName, {
            separator: /[\r]{0,1}\n/,
            fromBeginning: false,
            fsWatchOptions: {},
            follow: true
        });

        tail.on("line", ( /** @type {string} */ data) => {
            filterLog(data);
        });

        tail.on("error", error => {
            console.log(`Watcher ERROR (${fileName}): `, error);
        });

        fileWatchers[fileName] = tail;
    }
}

function setupSmtp() {
    transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtps,
        auth: {
            user: config.smtpUsername,
            pass: config.smtpPassword
        }
    });

    mailOptions = {
        from: config.mailfrom,
        to: config.mailto,
        subject: `${config.subjectPrefix} -`,
        text: ""
    };
}

function setupSlack() {
    slack.setWebhook(config.slackWebHookUri);
}

function sleep(/** @type {Number} */ ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async() => {
    setupSmtp();
    setupSlack();
    await setupTail(config.filesToWatch);
    setInterval(notificationQueueWorker, 1000);
})();
