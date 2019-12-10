var uuid = getUuid();
var aiteToUser  = [];
var fmsearch    = false;//是否有搜索

var clientId    = uuid;
var topic       = ['pyjy/' + room_id + '/chat', 'pyjy/allroom/chat'];
var host        = useSSL ? 'wss://' + mqttOpt.host + ':8084/mqtt' : 'ws://' + mqttOpt.host + ':8083/mqtt';

var chatType = 0;
var client = null;
var qos = 1;
var retain = false;
var followIdArr = new Array();

if (userInfo) {
    var user_id = userInfo.id;
    var type = 1;
} else {
    var user_id = Cookie.getCookie('your_name');
    var type = 2;
}

$(function () {
    var willPayload = {
        action: 'logout',
        dataType: 'text',
        data: {
            id: user_id,
            group_id: userInfo.group_id,
            type: type
        },
        status: 1
    };

    var options = {
        keepalive: 10,
        clientId: clientId,
        protocolId: 'MQTT',
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        will: {
            topic: topic[1],
            payload: JSON.stringify(willPayload),
            qos: qos,
            retain: retain
        },
        rejectUnauthorized: false
    };

    client = mqtt.connect(host, options);

    client.on('error', function (err) {
        console.log(err);
        client.end()
    });

    client.on('connect', function () {
        console.log(clientId + ' CONNECT ' + host + ' SUCCESS!');

    });

    client.subscribe(topic[0], {qos: qos});
    client.subscribe(topic[1], {qos: qos});

    client.on('message', function (topic, message, packet) {
        console.log('TOPIC:' + topic, 'MESSAGE:' + message.toString());
        try {
            onChat(message.toString())
        } catch (e) {
            console.log(e);
        }
    });

    client.on('close', function () {
        console.log(clientId + ' disconnected');
    })
});

//屏蔽推送
$(document).on('click',".pressCon .shield",function (e) {
    if(!userInfo){
        layer.open({
            content: errMsg[10],
            btn: '确定'
        });
        return;
    }

    var userId = $(this).parents('li').attr('userId');
    var isgag  = $(this).parents('li').attr('isgag');

    //推送提交
    var payload2 = {
        action: 'forbid',
        dataType: 'text',
        data: {
            admin_id:userInfo.id,
            token:userInfo.token,
            user_id: userId,
            chat_time: Date.parse(new Date()) / 1000,
            msg_id: getUuid(),
            isgag: isgag,
            msg_id: uuid
        },
        status: 1
    };

    client.publish('pyjy/allroom/chat', JSON.stringify(payload2), 1);
    //底部提示
    var TSmsg = isgag == 0 ? '该用户已禁言' : '已取消禁言';
    layer.open({
        style: 'background-color:#78BA32;',
        shade: false, //不显示遮罩
        content: TSmsg,
        skin: 'footer',
        time: 2
    });
});

//点击发送
$('.submit').click(function () {
    if(time_open != "1"){
        layer.open({
            content: time_open_notice,
            btn: '确定'
        });
        return;
    }
    say();
})

//键盘确定发言
$("#messageEditor").keydown(function (event) {
    if (event.keyCode == 13) {
        if ($("#SendBtn").attr('disabled')) {
            return;
        }
        say();
    }
    return;
});

//发言
function say() {
    try {
        if(!userInfo){
            layer.open({
                content: errMsg[1],
                btn: '确定'
            });
            $('#messageEditor').blur();
            return;
        }

        var text = $.trim($("#messageEditor").val());

        if (text == '') {
            var hasImg = $("#messageEditor").find('img');
            if (hasImg.length == 0) {
                layer.open({
                    content: errMsg[3],
                    btn: '确定'
                });
                $('#messageEditor').val('');
                $('#messageEditor').blur();
                return;
            }
        }

        var c1 = $.trim($("#messageEditor").val());

        if (c1.length > 240) {
            layer.open({
                content: errMsg[4],
                btn: '确定'
            });
            $('#messageEditor').blur();
            return;
        }
        var c2 = c1.replace(/<div>(.*?)<\/div>/g, function (arg1, arg2) {
            return arg2;
        });

        var reg = new RegExp("<br>", "g");
        var c3 = c2.replace(reg, "");

        var reg2 = new RegExp("&nbsp;", "g");
        var content = c3.replace(reg2, "");

        var payload = {
            action: 'say',
            dataType: 'text',
            data: {
                user_id: userInfo.id,
                room_id: room_id,
                nickname: userInfo.nickname,
                group_id: userInfo.group_id,
                avatar: userInfo.avatar,
                chat_time: Date.parse(new Date()) / 1000,
                content: content,
                msg_id: getUuid(),
                token:userInfo.token
            },
            status: 1
        };

        if (chatType == 3) {
            payload.data.toUserId = aiteToUser.join(',');
            payload.action = 'sayTo';
            chatType = null;
        }
        var jStr = JSON.stringify(payload);
        $('#messageEditor').val('');
        $('#messageEditor').blur();
        aiteToUser = [];
    } catch (e) {
        console.log(e);
        return;
    }
    client.publish('pyjy/' + room_id + '/chat', jStr, 1);
}

//拼接消息html
function getSayHtml(data,aiTeMe){
    var sayHtml = '';
    if (userInfo && data.user_id == userInfo.id) {
        sayHtml = '<li class="clearfix msgList" id="'+data.msg_id+'">'+
                    '<div class="clearfix fr msg msgRight">'+
                        '<div class="msgContent fr">'+
                            '<div class="name text-r"> '+data.nickname+' <span class="timed">'+formatDateTime(data.chat_time)+'</span></div>'+
                            '<div class="chatSay">'+data.content+'</div>'+
                            '<span style="display: none" class="userId"> '+data.user_id+'</span>'+
                        '</div>'+
                        '<div class="msgHead fr"><img src="'+data.avatar+'" title="'+data.nickname+'"></div>'+
                    '</div>'+
                '</li>';
    }else{
        //是否关注
        var is_follow = $.inArray(parseInt(data.user_id), followIdArr) >= 0 ? 1 : 0;
        //是否只看我关注的人
        var isDisplayNone = '';
        if(isToUser()){
            if(isToUserHide(data.user_id,data.group_id) == 1){
                isDisplayNone = 'style="display: none;"';
            }
        }
        sayHtml = '<li class="clearfix msgList" id="'+data.msg_id+'" '+isDisplayNone+'>'+
                    '<div class="clearfix fl msg msgLeft">'+
                        '<div class="msgHead fl" userId="'+data.user_id+'" isgag="0" group="'+data.group_id+'" follow="'+is_follow+'"><img src="'+data.avatar+'" title="'+data.nickname+'"></div>'+
                        '<div class="msgContent fl">'+
                            '<div class="name text-l"> '+data.nickname+' <span class="timed">'+formatDateTime(data.chat_time)+'</span></div>'+
                            '<div class="chatSay '+aiTeMe+'"> '+data.content+'</div>'+
                            '<span style="display: none" class="userId"> '+data.user_id+'</span>'+
                        '</div>'+
                    '</div>'+
                '</li>';
    }

    return sayHtml;
}

//接收数据处理

function onChat(d) {
    var temp = JSON.parse(d);
    var data = temp.data;
    switch(temp.action){
        case 'say':
        case 'sayTo':
        case 'sayLike':
            //有人@我
            var aiTeMe  = '';
            if (temp.action == 'sayTo') {
                var toIds = data.toUserId;
                var cl = $('.aiTe').hasClass('class');
                var ac = $('.chatroom').hasClass('active');
                if (toIds.indexOf(userInfo.id) > -1 && !cl && ac) {
                    $('.aiTe').addClass('animate');
                    $('.aiTe').removeClass('bounceOutRight');
                    $('.aiTe').css('display', 'block');
                    $('.aiTe').attr('msg_id', data.msg_id);
                    aiTeMe = 'hey';
                }
            }

            var sayHtml = getSayHtml(data,aiTeMe);
console.log();
            $(".msgListBox ul").append(sayHtml);

            if(newMsgAlert && userInfo.id != data.user_id){
                msgNew ++;
                $('.moreInfor').addClass('animate');
                $('.moreInfor').removeClass('bounceOutRight');
                $('.moreInfor').css('display', 'block');
                $('.moreInfor .newMsg').text(msgNew + '条新消息');
            }else{
                MsgAutoScroll();
            }

        break;
        case 'sayHello':
            if(userInfo){
                if(userInfo.id == data.id && userInfo.token != data.token){
                    jslogout('您已在其他端登录！')
                }
            }
            /* 进入直播间提醒 */
            // var $_div = $('<div class="welcome">' + '<span>' + data.nickname + '</span>进入直播间' + '</div>');
            // $('.comein').prepend($_div);
            // $_div.animateCss("bounceInLeft");
            // setTimeout(function () {
            //     $_div.animateCss("bounceOutLeft", function () {
            //         $_div.remove()
            //     });
            // }, 3e3);
            //已有不需要插入
            if ($('.onlineUser li[userId="' + data.id + '"]').length > 0) return;
            //登录推送
            var your_name = Cookie.getCookie('your_name');
            if (data.id != userInfo.id && data.id != your_name) {

                //是否关注
                var is_follow = $.inArray(parseInt(data.id), followIdArr) >= 0 ? 1 : 0

                if(data.group_id == 1 && data.id != userInfo.id){
                    var followspan = is_follow == 1 ? '<a href="javascript:;" class="gzed fr follow">已关注</a>' : '<a href="javascript:;" class="fr follow">关注</a>';
                }else{
                    var followspan = '';
                }
                html = '<li class="clearfix" userId="' + data.id + '" group="' + data.group_id + '"  follow="' + is_follow + '">'+
                            '<span class="fl iconImg"><img src="'+data.avatar+'" alt="'+data.nickname+'"></span>'+
                            '<span class="fl fs30">'+data.nickname+'<img src="/room/images/mChatRoom/mage-'+data.group_id+'.png"></span>'+
                            followspan+
                        '</li>';

                //游客
                if(data.group_id == 0){
                    //游客最后面
                    $('.onlineUser li:last').after(html);
                    return;
                }

                //管理员
                if (data.group_id >= 2) {
                    //相同等级后面
                    var userLi = $('.onlineUser li[group="' + data.group_id + '"]:last');
                    if(userLi.length > 0){
                        userLi.after(html);
                    }else{
                        //第一位
                        $('.onlineUser').prepend(html);
                    }
                }

                //会员
                if(data.group_id == 1)
                {
                    if(is_follow == 1){
                        //关注后面
                        var userLi = $('.onlineUser li[group="' + data.group_id + '"][follow="'+is_follow+'"]:last');
                        if(userLi.length == 0){
                            //没有关注放我的后面
                            var userLi = $('.onlineUser li[userid="' + userInfo.id + '"]:last');
                        }
                    }else{
                        //同等级后面
                        var userLi = $('.onlineUser li[group="1"]:last');
                    }

                    if(userLi.length == 0){
                        //没有同等级放管理员后面
                        var userLi = $('.onlineUser li[group="2"]:last');
                    }

                    if(userLi.length > 0){
                        userLi.after(html);
                    }else{
                        //没有管理员放第一位
                        $('.onlineUser').prepend(html);
                    }

                }

                //管理员或关注栏
                if(data.group_id >= 2 || is_follow == 1){
                    //关注栏插入
                    if ($('.followUser li[userId="' + data.id + '"]').length == 0){
                        //相同等级后面
                        var followLi = $('.followUser li[group="' + data.group_id + '"]:last');
                        if(followLi.length > 0){
                            followLi.after(html);
                        }else{
                            //第一位
                            if(data.group_id >= 2){
                                $('.followUser').prepend(html);
                            }else{
                                $('.followUser').append(html);
                            }
                        }
                    }
                }
            }
        break;
        case 'forbid':
            //是否禁言操作
            if($.inArray(parseInt(data.isgag), [0,1,9]) == -1){
                //是否为自己
                if (userInfo.id == data.user_id || visitor == data.user_id){
                    if(data.saygag == 1){
                        layer.open({
                          content: '您的账号因违反规定被禁言，如再次违反，将进行封号处理',
                          btn: ['联系客服', '取消'],
                          yes: function(index){
                            window.location.href = 'http://wpa.b.qq.com/cgi/wpa.php?ln=2&uin='+kfqq;
                          }
                        });
                    }else{
                        layer.open({
                            content: data.notice_str,
                            btn: '确定'
                        });
                    }
                    $('#messageEditor').blur();
                }
                return;
            }

            //是否禁用成功
            if(data.isgag == 9){
                if (userInfo.id == data.admin_id){
                    jslogout(data.notice_str)
                }
                return;
            }

            var isgag  = parseInt(data.isgag) == 0 ? 1 : 0;
            //把消息列表li修改禁言状态
            $('.msgHead[userId="'+data.user_id+'"]').attr('isgag',isgag);

            //是否为自己
            if (userInfo.id != data.user_id) return;

            if(isgag == 1){
                layer.open({
                  content: '您的账号因违反规定被禁言，如再次违反，将进行封号处理',
                  btn: ['联系客服', '取消'],
                  yes: function(index){
                    window.location.href = 'http://wpa.b.qq.com/cgi/wpa.php?ln=2&uin='+kfqq;
                  }
                });
            }else{
                layer.open({
                    content: data.notice_str,
                    btn: '确定'
                });
            }

            $('#messageEditor').blur();
        break;
        case 'logout':
            if ($('.onlineUser li[userId="' + data.id + '"]').length == 0) return;

            var your_name = Cookie.getCookie('your_name');
            if (data.id == userInfo.id || data.id == your_name) return;

            //退出登录
            $('.onlineUser li[userId="' + data.id + '"]').remove();

            //关注栏退出
            // if ($('.followUser li[userId="' + data.id + '"]').length > 0){
            //     $('.followUser li[userId="' + data.id + '"]').remove();
            // }
        break;
        case 'hiddenMsg':
            if(data.msg_id != undefined){
                var msg_ids = data.msg_id.split(',');
                for(var i=0; i<msg_ids.length;i++){
                    $(".msgList[id='"+msg_ids[i]+"']").remove();
                }
            }

        break;
        case 'hiddenUser':
            if(userInfo){
                var user_list = data.user_list.split(',');
                if($.inArray(String(userInfo.id), user_list) >= 0){
                    jslogout(data.notice_str);
                }
            }

            if(data.user_list != undefined){
                var userid = data.user_list.split(',');
                for (var i1 = 0; i1 < userid.length; i1++) {
                    $("div[userid='"+userid[i1]+"']").parent().remove();
                }
            }
        break;
        case 'panIp':
            if (clientIp == data.ip) {
                jslogout(data.notice_str);
            }
            break;
        case 'groupUpdate':
            if(userInfo){
                if(userInfo.id == data.user_list){
                    layer.open({
                        content: data.notice_str,
                        btn: '确定',
                        yes: function(index, layero){
                            window.location.reload();
                        }
                    });
                }
            }
            //关注栏退出
            if(data.group_id == 1){
                if ($('.followUser li[userId="' + data.user_list + '"]').length > 0){
                    $('.followUser li[userId="' + data.user_list + '"]').remove();
                }
            }
        break;
    }
}

//搜索在线会员
function validates() {
    var name = $.trim($('#search').val());
    if (name == '') {
        $('.onlineUser li').show();
        fmsearch = false;
    } else {
        $('.onlineUser li').hide();
        $('.onlineUser li').find('.faceName:Contains(' + name + ')').parents('li').show();
        fmsearch = true;
    }
    return false;
}

//查看更多历史消息
var page = 2;//第二页开始
$('.more-message').on('click', function () {
    var msg_id = $('.msgList:first').attr('id');
    $.ajax({
        type: 'POST',
        url: '/generic/chatLog',
        dataType: 'json',
        data: {room_id: room_id, p: page},
        success: function (msg) {
            if (msg.code == 1) {
                var html = '';
                if(msg.list != ''){
                    $.each(msg.list, function (k, v) {
                        html += getSayHtml(v,'');
                    });
                    $(".msgListBox ul").prepend(html);
                    window.location.href="#"+msg_id;
                }else{
                    $('.more-message').css('display', 'none');
                }
                page++;
            } else {
                if (!params) {
                    layer.open({
                        content: msg.list,
                        btn: '确定'
                    });
                    return;
                }
            }
        }
    })
})

/**
 * 进入聊天室
 */
function joinRoom() {
    //在线人数
    $.ajax({
        type: 'POST',
        url: '/chat/onlineUser',
        dataType: 'json',
        data: {room_id: room_id},
        success: function (msg) {
            var data = msg.list;
            followIdArr = data.f;
            if (data.u.length > 0) {
                var uhtml = '';
                $.each(data.u, function (k, d) {
                    if(d.group_id == 1 && d.id != userInfo.id){
                        var followspan = d.is_follow == 1 ? '<a href="javascript:;" class="gzed fr follow">已关注</a>' : '<a href="javascript:;" class="fr follow">关注</a>';
                    }else{
                        var followspan = '';
                    }
                    uhtml += '<li class="clearfix" userId="' + d.id + '" group="' + d.group_id + '"  follow="' + d.is_follow + '">'+
                                '<span class="fl iconImg"><img src="'+d.avatar+'" alt="'+d.nickname+'"></span>'+
                                '<span class="fl fs30">'+d.nickname+'<img src="/room/images/mChatRoom/mage-'+d.group_id+'.png"></span>'+
                                followspan+
                            '</li>';
                });
                //所有用户
                $(".onlineUser").append(uhtml);
                //关注的人
                var fhtml = '';
                $.each(data.fu, function (k, d) {
                    if(d.group_id == 1 && d.id != userInfo.id){
                        var followspan = d.is_follow == 1 ? '<a href="javascript:;" class="gzed fr follow">已关注</a>' : '<a href="javascript:;" class="fr follow">关注</a>';
                    }else{
                        var followspan = '';
                    }
                    fhtml += '<li class="clearfix" userId="' + d.id + '" group="' + d.group_id + '"  follow="' + d.is_follow + '">'+
                                '<span class="fl iconImg"><img src="'+d.avatar+'" alt="'+d.nickname+'"></span>'+
                                '<span class="fl fs30">'+d.nickname+'<img src="/room/images/mChatRoom/mage-'+d.group_id+'.png"></span>'+
                                followspan+
                            '</li>';
                });
                $(".followUser").append(fhtml);
            }
        }
    });
}

//点击登录
$('.inputLogin').on('click',function(){
    ssoLogin();
})
//点击退出登录
$('.closeUser').click(function () {
    //退出推送
    var payload2 = {
        action: 'logout',
        dataType: 'text',
        data: {
            id: userInfo.id,
            group_id: userInfo.group_id,
            type: 1
        },
        status: 1
    };
    client.publish('pyjy/allroom/chat', JSON.stringify(payload2), 1);
    $.ajax({
        url: "/user/logout",
        type: 'get',
        dataType: "json",
        success: function (data) {
            Cookie.setCookie('logout',1);
            window.location.reload();
        }
    });
});

//登录转跳
function ssoLogin(){
    var url = ssoPre + "/sso/login";

    var params = ssoParams;
    if (!params) {
        layer.open({
            content: errMsg[1],
            btn: '确定'
        });
        return;
    }

    var postForm = document.createElement("form");
    postForm.method = "post";
    postForm.action = url;

    $.each(params, function (k, v) {
        var input1 = document.createElement("input");
        input1.setAttribute("type", "hidden");
        input1.setAttribute("name", k);
        input1.setAttribute("value", v);
        postForm.appendChild(input1);
    });

    // postForm.target = 'layui-layer-iframe'+ index;
    document.body.appendChild(postForm);
    postForm.submit();
    document.body.removeChild(postForm);
}

//退出登录
function logout(){
    var params = ssoParams;
    if (!params) {
        layer.open({
            content: errMsg[1],
            btn: '确定'
        });
        return;
    }
    var url = ssoPre + "/sso/logout";
    var postForm = document.createElement("form");
    postForm.method = "post";
    postForm.action = url;
    postForm.target = 'submitIframe';
    $.each(params, function (k, v) {
        var input1 = document.createElement("input");
        input1.setAttribute("type", "hidden");
        input1.setAttribute("name", k);
        input1.setAttribute("value", v);
        postForm.appendChild(input1);
    });

    //删除cookie
    Cookie.delCookie('lottery_status');
    $('#qrcode-iframe').append(postForm);
    postForm.submit();
}

/**
 * 时间对象的格式化;
 */
function formatDateTime(inputTime) {
    var date = new Date(inputTime * 1000);
    //var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    var h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    var minute = date.getMinutes();
    //var second = date.getSeconds();
    minute = minute < 10 ? ('0' + minute) : minute;
    //second = second < 10 ? ('0' + second) : second;
    return m + '-' + d + ' ' + h + ':' + minute;
};

function getUuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

//获取下期开奖时间，并且倒计时
var delayTimeInterval = 0;
var color = '';
var sInt = null;
var sInt2 = null;
var period = 0;//开奖倒计时
var tempTime = 0;
var awardResult = null;

function getawardtimes(type){
    $.ajax({
        url: historyUrl + room_id + "/getawardtimes",
        dataType: 'jsonp',
        data: '',
        jsonp: 'callback',
        success: function (result) {
            awardResult = JSON.parse(result.Result);
            if(awardResult){
                var curAward = awardResult.current.awardNumbers.split(',');//当前获奖号码
                var curPeriod = awardResult.current.periodNumber;//当前开奖期数

                var nextAwardTime = awardResult.next.awardTimeInterval;//下期开奖间隔（毫秒）
                var nextTelayTime = awardResult.next.delayTimeInterval;//下期开奖延迟（秒）

                //正在开奖中时，不用更新
                if(type != 2 || nextAwardTime > 0){
                    $(".resultTop .fl").text('第'+ curPeriod + '期');
                    var numSpan = '';
                    if (room_id == 'pk10' || room_id == 'xyft') {
                        for (var i = 0; i <= curAward.length - 1; i++) {
                            numSpan += '<span class="num-' + curAward[i] + '">' + curAward[i] + '</span> ';
                        }
                        $(".resultBottom").html(numSpan);

                    }else if (room_id == 'cqssc') {
                        for (var j = 0; j <= curAward.length - 1; j++) {
                            color = ['#f02f22','#5234ff','#8a0d00','#2D92C2','#005e15','#6F8A97'];
                            numSpan += '<span style="background-color: ' + color[j] + '">' + curAward[j] + '</span> ';
                        }
                        $(".resultBottom").html(numSpan);
                    }else if (room_id == 'gdkl10') {
                        color = ['#f02f22','#5234ff','#8a0d00','#2D92C2','#005e15','#d46a00','#A76A2A','#4C208C'];
                        for (var i = 0; i <= curAward.length - 1; i++) {

                            var n = Math.ceil(curAward[i]);

                            numSpan += '<span style="background-color: ' + color[i] + '">' + n + '</span> ';
                        }
                        $(".resultBottom").html(numSpan);
                    }

                    //历史开奖记录
                    awardHistory();
                }

                clearInterval(sInt2);

                if(nextAwardTime > 0){
                    clearInterval(sInt);
                    $(".resultBottom").html(numSpan);
                    period = Math.floor(nextAwardTime / 1000) - 1;//减1是因为定时器延迟一秒才倒计时
                    delayTimeInterval = nextTelayTime * 1000;
                    sInt = setInterval("runAwardTimes()", 1000);
                    tempTime = getTime();
                }else{
                    $(".resultTop .fl").text('第'+ (curPeriod+1) + '期');
                    $(".hdCenter .periodsFs").html("正在开奖");
                    sInt2 = setInterval("randaward()", 800);
                    setTimeout("getawardtimes(2)", 3500);
                }
            }
        }
    });
}

//事假倒计时
function runAwardTimes(){
    if(getTime() - tempTime > 5000){
        window.location.reload();
    }else{
        tempTime = getTime();
        if(period >= 0){
            clearInterval(sInt2);
            var minute=Math.floor(period/60);
            minute = minute < 10 ? '0'+ minute : minute;

            var second= Math.floor(period-minute*60);
            second = second < 10 ? '0'+ second : second;
            var descHtml = '距下期<em class="timeFs">'+minute+':'+second+'</em>';

            period = period - 1;
            $(".hdCenter .periodsFs").html(descHtml);
        }else{
            clearInterval(sInt);
            sInt2 = setInterval("randaward()", 800);
            $(".hdCenter .periodsFs").html("正在开奖...");
            setTimeout(function () {
                getawardtimes(2);
            }, delayTimeInterval);
        }
    }
}

function getTime() {
    return Date.now();
}

function randaward(){
    var len = $(".resultBottom").children('span').length;
    var tempHtml = '';

    for(var i=1;i<=len;i++){
        var html = $(".resultBottom span").eq(len - i).prop("outerHTML");
        tempHtml += html + ' ';
    }

    $(".resultBottom").html(tempHtml);
}

// setInterval(function () {
//     if(tempTime > 1 && (getTime() - tempTime > 5000)){
//         clearInterval(sInt);
//         getawardtimes(2);
//     }
// },3000);

