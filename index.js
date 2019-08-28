'use-strict'

const https = require('https')

const fs = require('fs-extra')
const nodemailer = require('nodemailer')
const Tail = require('tail').Tail

const config = require('./config.js')
let transporter
const mailOptions = {
  from: config.mailfrom,
  to: config.mailto,
  subject: '',
  text: ''
}
const fileWatchers = {}
const messages = []
let queueWorkerRunning = false

async function notificationQueueWorker () {
  if (queueWorkerRunning) return
  queueWorkerRunning = true

  while (messages.length > 0) {
    const message = messages[0]
    messages.shift()

    if (!message) {
      continue
    }

    let filterExpression = config.defaultMessageTemplateFilter
    if (message.expression.filter) {
      filterExpression = message.expression.filter
    }
    let match = message.message.match(filterExpression)

    if (match === null) match = message.message

    const oldSubject = message.expression.subject
    if (typeof (message.expression.subject) !== 'function') {
      var oldSubjectValue = ''
      if (message.expression.subject && message.expression.subject.toString) oldSubjectValue = message.expression.subject.toString()
      message.expression.subject = () => oldSubjectValue
    }

    const oldTemplate = message.expression.template
    if (typeof (message.expression.template) !== 'function') {
      var oldTemplateValue = `\`${message.message}\``
      if (message.expression.template && message.expression.template.toString) oldTemplateValue = message.expression.template.toString()
      message.expression.template = () => oldTemplateValue
    }

    const subject = message.expression.subject(match)
    const template = message.expression.template(match)
    let messageFiltered = false
    if (subject === false || template === false) {
      messageFiltered = true
    }

    if (!messageFiltered && config.enableEmail) {
      mailOptions.text = template
      mailOptions.subject = `${config.subjectPrefix}${subject}`
      await sendMail(mailOptions)
      mailOptions.text = ''
      mailOptions.subject = ''
    }

    const oldSlackOptions = message.expression.slackOptions
    if (!messageFiltered && config.enableSlack && oldSlackOptions) {
      const payload = message.expression.slackOptions
      payload.attachments[0].fallback = `${subject}${template}`
      payload.attachments[0].text = payload.attachments[0].fallback
      payload.attachments[0].ts = Date.now() / 1000
      await sendWebook(payload, message.expression.webhookUri || config.slackWebHookUri)
    }

    if (!messageFiltered && config.enableMsTeams) {
      await sendWebook(JSON.parse(template), message.expression.webhookUri || config.teamsWebHookUri)
    }

    message.expression.subject = oldSubject
    message.expression.template = oldTemplate
    message.expression.slackOptions = oldSlackOptions

    if (!messageFiltered) {
      if (messages.length > 0) console.log(`remaining messages in queue: ${messages.length}`)
      await sleep(1000)
    }
  }

  queueWorkerRunning = false
}

async function filterLog (/** @type {string} */ line) {
  for (let index = 0; index < config.expressions.length; index++) {
    const expression = config.expressions[index]
    expression.match.lastIndex = 0

    if (expression.match.test(line)) {
      messages.push({
        expression: expression,
        message: line
      })
    }
  }
}

async function sendMail (mailOptions) {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        if (config.debug) console.log(error)
        reject(error)
      } else {
        if (config.debug) console.log('Email sent: ' + info.response)
        resolve(info)
      }
    })
  })
}

async function setupTail (/** @type {string[]} */ filesToWatch) {
  if (!config.expressions || config.expressions.length < 1) {
    console.error('no expressions defined in config!')
    process.exit(1)
  }

  for (const fileName of filesToWatch) {
    if (!fs.existsSync(fileName)) {
      console.log(`File not found, not watching: ${fileName}`)
      continue
    }

    const tail = new Tail(fileName, {
      separator: /[\r]{0,1}\n/,
      fromBeginning: false,
      fsWatchOptions: {},
      follow: true
    })

    tail.on('line', (/** @type {string} */ data) => {
      filterLog(data)
    })

    tail.on('error', error => {
      console.log(`Watcher ERROR (${fileName}): `, error)
    })

    fileWatchers[fileName] = tail
  }
}

function setupSmtp () {
  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtps,
    auth: {
      user: config.smtpUsername,
      pass: config.smtpPassword
    }
  })
}

async function sendWebook (payload, uri, rejectUnauthorized = true) {
  return new Promise((resolve, reject) => {
    try {
      const data = JSON.stringify(payload, /* replacer */ null, /* space */ 0)
      const url = new URL(uri)
      const request = https.request({
        timeout: 3000,
        protocol: 'https:',
        method: 'POST',
        host: url.host,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          // eslint-disable-next-line quote-props
          'Accept': 'application/json, text/json;q=0.9, */*;q=0',
          'Accept-Language': 'en',
          'Accept-Encoding': 'identity'
        },
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        rejectUnauthorized: rejectUnauthorized
      }, async res => {
        resolve(res)
      })

      request.on('error', error => {
        console.error(error)
        resolve()
      })
      request.end(data)
    } catch (error) {
      console.error(error)
      resolve()
    }
  })
}

function sleep (/** @type {Number} */ ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

(async () => {
  setupSmtp()
  await setupTail(config.filesToWatch)
  setInterval(notificationQueueWorker, 1000)
})()
