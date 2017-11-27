class Config {
    constructor() {
        this.smtpUsername = 'smtp login username';
        this.smtpPassword = 'password';
        this.smtpHost = 'your.email.server';
        this.smtpPort = 25;
        this.smtps = false;
        this.mailfrom = 'foo@baar.local';
        this.mailto = 'foo@baar.local';
        this.subjectPrefix = 'access_log mailer: ';
        this.filesToWatch = [
            'test.txt',
            'test1.txt'
        ];
        this.expressions = [
            { match: /HTTP\/\d\.\d\" 404/g, subject: 'HTTP 404', matchCounter: 0 },
            { match: /HTTP\/\d\.\d\" 5\d{2}/g, subject: 'HTTP 5xx', matchCounter: 0 }
        ]
    }
};

module.exports = new Config();
