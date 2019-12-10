///设置cookie
var Cookie = {};

Cookie.setCookie = function (NameOfCookie, value, expiredays) {
    var ExpireDate = new Date();
    ExpireDate.setTime(ExpireDate.getTime() + (expiredays * 24 * 3600 * 1000));

    document.cookie = NameOfCookie + "=" + escape(value) +
        ((expiredays == null) ? "" : "; expires=" + ExpireDate.toGMTString()) + "; path=/;";
}

///获取cookie值
Cookie.getCookie = function (NameOfCookie) {
    if (document.cookie.length > 0) {
        begin = document.cookie.indexOf(NameOfCookie + "=");
        if (begin != -1) {
            begin += NameOfCookie.length + 1;
            end = document.cookie.indexOf(";", begin);
            if (end == -1) end = document.cookie.length;
            return unescape(document.cookie.substring(begin, end));
        }
    }
    return null;
}

///删除cookie
Cookie.delCookie = function (NameOfCookie) {
    if (Cookie.getCookie(NameOfCookie)) {
        document.cookie = NameOfCookie + "=" +
            "; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/;";
    }
}