// Nginx
// log_format main '[$time_local] status:$status request_time:$request_time upstream_response_time:$upstream_response_time bytes_sent:$body_bytes_sent client_ip:$remote_addr domain:$host request:"$request" referer:"$http_referer" user_agent:"$http_user_agent"';
const defaultMessageTemplateFilter = /^\[((\d{1,2}\/\w{3}\/\d{4}):(\d{2}:\d{2}:\d{2}) ([+-]\d{4}))\] status:(\d{3}) request_time:(\d{1,}.\d{3}) upstream_response_time:(\d{1,}.\d{3}) bytes_sent:(\d{1,}) client_ip:(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|(:{0,2}[\da-f]{1,4}){1,8}) domain:([\w.-]*) request:"((\w{3,8}) (\/[\w-.,_~:<>\\/[\]%@!$'()*+;?=&#]*) HTTP\/(\d\.\d))" referer:"([\w-.,_~:<>\\/[\]%@!$'()*+;?=&#]*)" user_agent:"([\w-.,_~: \/[\]%@!$'()*+;?=&#]*)"$/;
const defaultMessageTemplateFilterMatchingGroupNames = {
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

// Test strings
// [10/Dec/2017:01:08:21 +0100] status:200 request_time:60.004 upstream_response_time:60.000 bytes_sent:228 client_ip:1.22.33.44 domain:example.com request:"GET / HTTP/2.0" referer:"-" user_agent:""

// [10/Dec/2017:01:08:21 +0100] status:200 request_time:60.004 upstream_response_time:60.000 bytes_sent:228 client_ip:1.22.33.44 domain:xn--4ca.com request:"GET / HTTP/2.0" referer:"-" user_agent:""

// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"GET / HTTP/2.0" referer:"-" user_agent:""

// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"POST / HTTP/2.0" referer:"-" user_agent:""

// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"HEAD / HTTP/2.0" referer:"-" user_agent:""

// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"CONNECT / HTTP/2.0" referer:"-" user_agent:""

// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"TRACE / HTTP/2.0" referer:"-" user_agent:""

// [10/Dec/2017:01:08:21 +0100] status:200 request_time:0.000 upstream_response_time:0.000 bytes_sent:0 client_ip:1.22.33.44 domain:example.com request:"PROPFIND / HTTP/0.9" referer:"-" user_agent:""

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

// ----------------------------------------------------