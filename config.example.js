class Config {
  constructor () {
    this.filesToWatch = [
      'test.txt',
      'test1.txt'
    ]
    // nginx
    this.defaultMessageTemplateFilter = /^\[((\d{1,2}\/\w{3}\/\d{4}):(\d{2}:\d{2}:\d{2}) ([+-]\d{4}))\] status:(\d{3}) request_time:(\d{1,}\.\d{3}) upstream_response_time:((\d{1,}\.\d{3})|-) bytes_sent:(\d{1,}) client_ip:(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|(:{0,2}[\da-f]{1,4}){1,8}) domain:([\w.-]*) port:(\d{1,5}) request:"((\w{3,8}) ([\w-.,_~:<>\\\/\[\]%@!$'()*+;?=&#]*) HTTP\/(\d\.\d))" referer:"([\w-.,_~:<>\\/[\]%@!$'()*+;?=&#]*)" user_agent:"([\w-.,_~: /[\]%@!$'()*+;?=&#]*)"$/
    this.defaultMatchingGroupName = {
      All: 0,
      DateTime: 1,
      Date: 2,
      Time: 3,
      TimeZone: 4,
      StatusCode: 5,
      RequestTime: 6,
      UpstreamResponseTime: 7,
      BytesSent: 9,
      ClientIp: 10,
      Domain: 12,
      Port: 13,
      Request: 14,
      Method: 15,
      Path: 16,
      ProtocolVersion: 17,
      Referer: 18,
      UserAgent: 19
    }
    // apache
    // this.defaultMessageTemplateFilter = /^([\w.-]*):(\d{1,5}) (\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|(:{0,2}[\da-f]{1,4}){1,8}) ([\w.-]*) ([\w.-]*) \[((\d{1,2}\/\w{3}\/\d{4}):(\d{2}:\d{2}:\d{2}) ([+-]\d{4}))\] "((\w{3,8}) (\/[\w-.,_~:<>\\/[\]%@!$'()*+;?=&#]*) HTTP\/(\d\.\d))" (\d{3}) (\d{1,}) "([\w-.,_~:<>\\/[\]%@!$'()*+;?=&#]*)" "([\w-.,_~: \/[\]%@!$'()*+;?=&#]*)"$/;
    // this.defaultMatchingGroupName = {
    //     All: 0,
    //     Domain: 1,
    //     Port: 2,
    //     ClientIp: 3,
    //     RemoteLogonName: 5,
    //     RemoteUser: 6,
    //     DateTime: 7,
    //     Date: 8,
    //     Time: 9,
    //     TimeZone: 10,
    //     Request: 11,
    //     Method: 12,
    //     Path: 13,
    //     ProtocolVersion: 14,
    //     StatusCode: 15,
    //     BytesSent: 16,
    //     Referer: 17,
    //     UserAgent: 18
    // };

    this.enableEmail = false
    this.smtpUsername = 'smtp login username'
    this.smtpPassword = 'password'
    this.smtpHost = 'your.email.server'
    this.smtpPort = 25
    this.smtps = false
    this.mailfrom = 'foo@bar.local'
    this.mailto = 'foo@bar.local'
    this.subjectPrefix = 'access_log mailer: '

    this.enableSlack = false
    this.slackWebHookUri = 'https://hooks.slack.com/services/xxxxxx/xxxxxx/xxxxxx'
    this.rejectUnauthorized = false
    this.slackChannel = '#general'
    this.slackUsername = 'webserver-access_log-bot'

    this.enableMsTeams = false
    this.teamsWebHookUri = 'https://outlook.office.com/webhook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx@xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/IncomingWebhook/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

    this.botName = 'web-access_log2email'
    this.botIcon = 'https://compilenix.org/cdn/Compilenix.png'
    this.debug = true

    this.expressions = [
      {
        match: / status:503 /,
        subject: (/** @type {string[]|string} */ match) => {
          return `HTTP ${match[this.defaultMatchingGroupName.StatusCode]} (something we're already fixing...)\n`
        },
        template: (/** @type {string[]|string} */ match) => {
          return `${match[this.defaultMatchingGroupName.Method]} ${match[this.defaultMatchingGroupName.Domain]} \`${match[this.defaultMatchingGroupName.Path]}\`\nUser-Agent: \`${match[this.defaultMatchingGroupName.UserAgent]}\``
        },
        webhookUri: 'https://hooks.slack.com/services/xxxxxx/xxxxxx/xxxxxx',
        slackOptions: {
          channel: this.slackChannel,
          username: this.slackUsername,
          attachments: [{
            footer: this.botName,
            footer_icon: this.botIcon,
            color: '#f0d32c',
            mrkdwn_in: ['text', 'pretext']
          }]
        }
      },
      {
        match: / status:5\d{2} /, // matches all 5xx status codes
        // filter: (/** @type {string} */ line) => { return line.match(/./); }, // use custom regex filter instead of this.defaultMatchingGroupName
        subject: (/** @type {string[]|string} */ match) => {
          if (match[this.defaultMatchingGroupName.Path].startsWith('/RequestToIgnore')) return false // return false to ignore/dismiss this message
          return `HTTP ${match[this.defaultMatchingGroupName.StatusCode]}\n`
        },
        template: (/** @type {string[]|string} */ match) => {
          return `{
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "summary": "Server Error post",
            "themeColor": "c4463d",
            "sections": [
              {
                "activityTitle": "Server Error (500)",
                "facts": [
                  {
                    "name": "When:",
                    "value": "\`${match[this.defaultMatchingGroupName.DateTime]}\`"
                  },
                  {
                    "name": "Domain:",
                    "value": "\`${match[this.defaultMatchingGroupName.Domain]}\`"
                  },
                  {
                    "name": "Request:",
                    "value": "\`${match[this.defaultMatchingGroupName.Request]}\`"
                  },
                  {
                    "name": "User-Agent:",
                    "value": "\`${match[this.defaultMatchingGroupName.UserAgent]}\`"
                  },
                  {
                    "name": "Referer:",
                    "value": "\`${match[this.defaultMatchingGroupName.Referer]}\`"
                  }
                ],
                "text": ""
              }
            ]
          }`
        }
        // webhookUri: 'https://outlook.office.com/webhook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx@xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/IncomingWebhook/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      }
    ]
  }
}

module.exports = new Config()
