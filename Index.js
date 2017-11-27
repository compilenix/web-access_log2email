'use-strict';

const fs = require("fs-extra");
const nodemailer = require('nodemailer');
const config = require("./Config.js");
const Tail = require('tail').Tail;


let transporter;
let mailOptions = {};
let lineCounter = 0;
const fileWatchers = {};

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
        subject: `${config.subjectPrefix} - `,
        text: ''
    };
}

function sendMail(subject, message) {
    console.log(message);
    mailOptions.subject += subject;
    mailOptions.text = message;

    transporter.sendMail(mailOptions, (error, info) => {
        mailOptions = {
            subject: `${config.subjectPrefix} - `,
            text: ''
        };

        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

// sort by expression.matchCounter DESC
function optimizeExpressionCollectionOrder() {
    config.expressions.sort((first, seconds) => {
        if (first.matchCounter > seconds.matchCounter) return -1;
        if (first.matchCounter < seconds.matchCounter) return 1;
        return 0;
    });
}

function filterLog( /** @type {string} */ line) {
    if (lineCounter % 10 === 0) optimizeExpressionCollectionOrder();

    for (let index = 0; index < config.expressions.length; index++) {
        const expression = config.expressions[index];

        if (expression.match.test(line)) {
            config.expressions[index].matchCounter++;
            sendMail(expression.subject, line);
            return;
        }
    }
}

async function setupTail(filesToWatch) {
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

        tail.on('line', data => {
            lineCounter++;
            filterLog(data);
        });

        tail.on('error', error => {
            console.log(`Watcher ERROR (${fileName}): `, error);
        });

        fileWatchers[fileName] = tail;
    }
}

return (async() => {
    setupSmtp();
    await setupTail(config.filesToWatch);
})();