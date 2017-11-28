'use-strict';

const fs = require("fs-extra");
const nodemailer = require('nodemailer');
const config = require("./Config.js");
const Tail = require('tail').Tail;
const Slack = require('slack-node');

let transporter;
let slack = new Slack();
let mailOptions = {};
let lineCounter = 0;
const fileWatchers = {};
let messages = [];

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

function notificationQueueWorker(expression, line) {
    if (config.enableEmail) {
        //message =
        await sendMail({
            from: config.mailfrom,
            to: config.mailto,
            subject: `${config.subjectPrefix}`,
            text: `${expression.subject}`
        });
    }

    if (config.enableSlack) {
        slack.webhook({
            channel: config.slackChannel,
            username: config.slackUserName,
            text: `${expression.subject}: ${line}`
        }, (err, response) => {
            if (config.debug) console.log(response);
        });
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

// sort by expression.matchCounter DESC
function optimizeExpressionCollectionOrder() {
    config.expressions.sort((first, seconds) => {
        if (first.matchCounter > seconds.matchCounter) return -1;
        if (first.matchCounter < seconds.matchCounter) return 1;
        return 0;
    });
    if (config.debug) console.log(config.expressions);
}

async function filterLog( /** @type {string} */ line) {
    if (lineCounter % 100 === 0) optimizeExpressionCollectionOrder();

    for (let index = 0; index < config.expressions.length; index++) {
        const expression = config.expressions[index];
        expression.match.lastIndex = 0;

        if (expression.match.test(line)) {
            config.expressions[index].matchCounter++;
            // messages.push({
            //     expression: expression,
            //     message: line
            // });
            notificationQueueWorker(expression, line);
        }
    }
}

async function setupTail( /** @type {string[]} */ filesToWatch) {
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
            lineCounter++;
            filterLog(data);
        });

        tail.on('error', error => {
            console.log(`Watcher ERROR (${fileName}): `, error);
        });

        fileWatchers[fileName] = tail;
    }
}

(async() => {
    setupSmtp();
    setupSlack();
    await setupTail(config.filesToWatch);
    // setTimeout(notificationQueueWorker, 5000);
})();