class Config {
    constructor() {
        this.filesToWatch = [
            'test.txt',
            'test1.txt'
        ];
        // nginx
        this.defaultMessageTemplateFilter = /^\[((\d{1,2}\/\w{3}\/\d{4}):(\d{2}:\d{2}:\d{2}) ([+-]\d{4}))\] status:(\d{3}) request_time:(\d{1,}.\d{3}) upstream_response_time:(\d{1,}.\d{3}) bytes_sent:(\d{1,}) client_ip:(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|(:{0,2}[\da-f]{1,4}){1,8}) domain:([\w.-]*) request:"((\w{3,8}) (\/[\w-.,_~:<>\\/[\]%@!$'()*+;?=&#]*) HTTP\/(\d\.\d))" referer:"([\w-.,_~:<>\\/[\]%@!$'()*+;?=&#]*)" user_agent:"([\w-.,_~: \/[\]%@!$'()*+;?=&#]*)"$/;
        this.defaultMatchingGroupName = {
            All: 0,
            DateTime: 1,
            Date: 2,
            Time: 3,
            TimeZone: 4,
            StatusCode: 5,
            RequestTime: 6,
            UpstreamResponseTime: 7,
            BytesSent: 8,
            ClientIp: 9,
            Domain: 11,
            Request: 12,
            Method: 13,
            Path: 14,
            ProtocolVersion: 15,
            Referer: 16,
            UserAgent: 17
        };
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

        this.enableEmail = false;
        this.smtpUsername = 'smtp login username';
        this.smtpPassword = 'password';
        this.smtpHost = 'your.email.server';
        this.smtpPort = 25;
        this.smtps = false;
        this.mailfrom = 'foo@bar.local';
        this.mailto = 'foo@bar.local';
        this.subjectPrefix = 'access_log mailer: ';

        this.enableSlack = false;
        this.slackWebHookUri = 'https://hooks.slack.com/services/xxxxxx/xxxxxx/xxxxxx';
        this.slackChannel = '#general';
        this.slackUsername = 'webserver-access_log-bot';

        this.botName = 'web-access_log2email';
        this.botIcon = "https://compilenix.org/cdn/Compilenix.png";
        this.debug = true;

        this.expressions = [
            {
                match: /" 503 /,
                //filter: (/** @type {string} */ line) => { return line.match(/./); },
                subject: (/** @type {any} */ match) => {
                    return `HTTP ${match[this.defaultMatchingGroupName.StatusCode]} (something we're already fixing...)\n`;
                },
                template: (/** @type {any} */ match) => {
                    return `${match[this.defaultMatchingGroupName.Method]} ${match[this.defaultMatchingGroupName.Domain]} \`${match[this.defaultMatchingGroupName.Path]}\`\nUser-Agent: \`${match[this.defaultMatchingGroupName.UserAgent]}\``;
                },
                slackOptions: {
                    channel: this.slackChannel,
                    username: this.slackUsername,
                    attachments: [{
                        footer: this.botName,
                        footer_icon: this.botIcon,
                        color: "#f0d32c",
                        mrkdwn_in: ["text", "pretext"]
                    }]
                }
            },
            {
                match: /" 5(?!03)\d{2} /, // matches all 5xx status codes, except a 503 (using regex negative lookahead)
                //filter: (/** @type {string} */ line) => { return line.match(/./); },
                subject: (/** @type {any} */ match) => {
                    return `HTTP ${match[this.defaultMatchingGroupName.StatusCode]}\n`;
                },
                template: (/** @type {any} */ match) => {
                    return `${match[this.defaultMatchingGroupName.Method]} ${match[this.defaultMatchingGroupName.Domain]} \`${match[this.defaultMatchingGroupName.Path]}\`\nUser-Agent: \`${match[this.defaultMatchingGroupName.UserAgent]}\``;
                },
                slackOptions: {
                    channel: this.slackChannel,
                    username: this.slackUsername,
                    attachments: [{
                        footer: this.botName,
                        footer_icon: this.botIcon,
                        color: "#c4463d",
                        mrkdwn_in: ["text", "pretext"]
                    }]
                }
            }
        ];
    }
};

module.exports = new Config();
