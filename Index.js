'use-strict';

const fs = require("fs-extra");
const nodemailer = require('nodemailer');
const config = require("./Config.js");
const Tail = require('tail').Tail;
const Slack = require('slack-node');

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
        if (typeof (message.expression.subject) !== 'function') {
            var oldSubjectValue = message.expression.subject.toString();
            message.expression.subject = () => oldSubjectValue;
        }

        const oldTemplate = message.expression.template;
        if (typeof (message.expression.template) !== 'function') {
            message.expression.template = () => `\`${message.message}\``;
        }

        if (config.enableEmail) {
            await sendMail({
                from: config.mailfrom,
                to: config.mailto,
                subject: `${config.subjectPrefix}${message.expression.subject(match)}`,
                text: message.expression.template(match)
            });
        }

        if (config.enableSlack) {
            slack.webhook({
                channel: config.slackChannel,
                username: config.slackUserName,
                text: `${message.expression.subject(match)}${message.expression.template(match)}`
            }, (err, response) => {
                if (config.debug && err) console.log(err, response);
            });
        }

        message.expression.subject = oldSubjectValue;
        message.expression.template = oldTemplate;
        await sleep(1000);
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
                if (config.debug) console.log('Email sent: ' + info.response);
                resolve(info);
            }
        });
    });
}

async function setupTail( /** @type {string[]} */ filesToWatch) {
    if (!config.expressions || config.expressions.length < 1) {
        console.error('no expressions defined in config!');
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

        tail.on('line', ( /** @type {string} */ data) => {
            filterLog(data);
        });

        tail.on('error', error => {
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
        text: ''
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