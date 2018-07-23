// Nginx
// log_format main '[$time_local] status:$status request_time:$request_time upstream_response_time:$upstream_response_time bytes_sent:$body_bytes_sent client_ip:$remote_addr domain:$host port:$server_port request:"$request" referer:"$http_referer" user_agent:"$http_user_agent"';
defaultMessageTemplateFilter = /^\[((\d{1,2}\/\w{3}\/\d{4}):(\d{2}:\d{2}:\d{2}) ([+-]\d{4}))\] status:(\d{3}) request_time:(\d{1,}\.\d{3}) upstream_response_time:((\d{1,}\.\d{3})|-) bytes_sent:(\d{1,}) client_ip:(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|(:{0,2}[\da-f]{1,4}){1,8}) domain:([\w.-]*) port:(\d{1,5}) request:"((\w{3,8}) ([\w-.,_~:<>\\\/\[\]%@!$'()*+;?=&#]*) HTTP\/(\d\.\d))" referer:"([\w-.,_~:<>\\/[\]%@!$'()*+;?=&#]*)" user_agent:"([\w-.,_~: /[\]%@!$'()*+;?=&#]*)"$/;
defaultMatchingGroupName = {
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
};

// Test strings
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:60.004 upstream_response_time:60.000 bytes_sent:228 client_ip:1.22.33.44 domain:example.com request:"GET / HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:60.004 upstream_response_time:60.000 bytes_sent:228 client_ip:1.22.33.44 domain:xn--4ca.com request:"GET / HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"GET / HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"POST / HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"HEAD / HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"CONNECT / HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"TRACE / HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"PROPFIND / HTTP/0.9" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"OPTIONS / HTTP/0.9" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:1.22.33.44 domain:example.com request:"GET / HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:1.22.33.44 domain:example.com request:"GET /post/1564a3 HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:1.22.33.44 domain:example.com request:"GET /post/1564a3?a= HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:1.22.33.44 domain:example.com request:"GET /post/1564a3?a=56&da='dsf' HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:1.22.33.44 domain:example.com request:"GET /\x22<script>alert(\x22lalal\x22)</script> HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:1.22.33.44 domain:example.com request:"GET /\xF0\x9F\x92\xA9 HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:1.22.33.44 domain:example.com request:"GET / HTTP/2.0" referer:"http://example.com/\xF0\x9F\x92\xA9" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:fd80::e domain:example.com request:"GET / HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:fd80:0000:0000:0000:0000:0000:0000:000e domain:example.com request:"GET / HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:1.22.33.44 domain:example.com request:"GET /?&mail=bob@example.com HTTP/2.0" referer:"-" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:1.22.33.44 domain:example.com request:"GET / HTTP/2.0" referer:"https://example.com/page/1" user_agent:""
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:1.22.33.44 domain:example.com request:"GET / HTTP/2.0" referer:"-" user_agent:"curl/7.53.1"
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:5.060 upstream_response_time:5.060 bytes_sent:521 client_ip:1.22.33.44 domain:example.com request:"GET / HTTP/2.0" referer:"-" user_agent:"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/604.4.7 (KHTML, like Gecko) Version/11.0.2 Safari/604.4.7"
// [10/Dec/2017:01:08:21 +0100] status:404 request_time:0.000 upstream_response_time:- bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"GET / HTTP/2.0" referer:"-" user_agent:""

// ----------------------------------------------------
// Apache
// LogFormat "%v:%p %h %l %u %t \"%r\" %>s %O \"%{Referer}i\" \"%{User-Agent}i\"" vhost_combined
defaultMessageTemplateFilter = /^([\w.-]*):(\d{1,5}) (\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|(:{0,2}[\da-f]{1,4}){1,8}) ([\w.-]*) ([\w.-]*) \[((\d{1,2}\/\w{3}\/\d{4}):(\d{2}:\d{2}:\d{2}) ([+-]\d{4}))\] "((\w{3,8}) (\/[\w-.,_~:<>\\/[\]%@!$'()*+;?=&#]*) HTTP\/(\d\.\d)|-)" (\d{3}) (\d{1,}) "([\w-.,_~:<>\\/[\]%@!$'()*+;?=&#]*)" "([\w-.,_~: \/[\]%@!$'()*+;?=&#]*)"$/;
defaultMatchingGroupName = {
    All: 0,
    Domain: 1,
    Port: 2,
    ClientIp: 3,
    RemoteLogonName: 5,
    RemoteUser: 6,
    DateTime: 7,
    Date: 8,
    Time: 9,
    TimeZone: 10,
    Request: 11,
    Method: 12,
    Path: 13,
    ProtocolVersion: 14,
    StatusCode: 15,
    BytesSent: 16,
    Referer: 17,
    UserAgent: 18
};

// Test strings
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET / HTTP/2.0" 200 228 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET / HTTP/2.0" 200 228 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET / HTTP/2.0" 200 0 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "POST / HTTP/2.0" 200 0 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "HEAD / HTTP/2.0" 200 0 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "CONNECT / HTTP/2.0" 200 0 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "TRACE / HTTP/2.0" 200 0 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "PROPFIND / HTTP/0.9" 200 0 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "OPTIONS / HTTP/0.9" 200 0 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET / HTTP/2.0" 200 521 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET /post/1564a3 HTTP/2.0" 200 521 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET /post/1564a3?a= HTTP/2.0" 200 521 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET /post/1564a3?a=56&da='dsf' HTTP/2.0" 200 521 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET /\x22<script>alert(\x22lalal\x22)</script> HTTP/2.0" 200 521 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET /\xF0\x9F\x92\xA9 HTTP/2.0" 200 521 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET / HTTP/2.0" 200 521 "http://example.com/\xF0\x9F\x92\xA9" ""
// example.com:443 fd80::e - - [11/Dec/2017:15:48:27 +0100] "GET / HTTP/2.0" 200 521 "-" ""
// example.com:443 fd80:0000:0000:0000:0000:0000:0000:000e - - [11/Dec/2017:15:48:27 +0100] "GET / HTTP/2.0" 200 521 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET /?&mail=bob@example.com HTTP/2.0" 200 521 "-" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET / HTTP/2.0" 200 521 "https://example.com/page/1" ""
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET / HTTP/2.0" 200 521 "-" "curl/7.53.1"
// example.com:443 1.22.33.44 - - [11/Dec/2017:15:48:27 +0100] "GET / HTTP/2.0" 200 521 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/604.4.7 (KHTML, like Gecko) Version/11.0.2 Safari/604.4.7"

// ----------------------------------------------------
