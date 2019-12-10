var uuid        = getUuid();
var newConNum   = 0;
var aiteToUser  = [];
var fmsearch    = false;//是否有搜索
var lastMsgId   = '';

var client      = null;
var qos         = 1;
var retain      = false;
var clientId    = uuid;
var topic       = ['pyjy/' + room_id + '/chat', 'pyjy/allroom/chat'];
var host        = useSSL ? 'wss://' + mqttOpt.host + ':8084/mqtt' : 'ws://' + mqttOpt.host + ':8083/mqtt';

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
$(document).on('click', ".lookList .shield", function (e) {
    if (!userInfo) {
        layer.msg(errMsg[10], {shift: 6});
        return;
    }

    var userId = onlineUserId;
    var isgag = $(".shield").attr('isgag');

    //推送提交
    var payload2 = {
        action: 'forbid',
        dataType: 'text',
        data: {
            admin_id: userInfo.id,
            token: userInfo.token,
            user_id: userId,
            chat_time: Date.parse(new Date()) / 1000,
            isgag: isgag,
            msg_id: uuid
        },
        status: 1
    };

    client.publish(topic[1], JSON.stringify(payload2), {qos: qos, retain: retain});
});

//关注功能
$(document).on('click', ".lookList .follow", function (e) {
    if (!userInfo) {
        layer.msg(errMsg[10], {shift: 6});
        return;
    }
    if (onlineUserId == userInfo.id) {
        layer.msg(errMsg[9], {shift: 6});
        return;
    }
    var userId = onlineUserId;
    var follow = $(this).attr('follow');
    $.ajax({
        type: 'post',
        url: '/generic/follow',
        dataType: 'json',
        data: {follow_id: userId, follow: follow},
        success: function (msg) {
            if (msg.code == 1) {
                var userLi = $('#onlineUser li[userId="' + userId + '"]');

                //列表是否有关注
                var followLi = $('#onlineUser li[follow=1]:last');

                if (followLi.length > 0) {
                    //移动到关注后面
                    followLi.after(userLi);
                } else {
                    if (userInfo.group_id == 1) {
                        //移到我的后面
                        var myUserLi = $('#onlineUser li[userid="' + userInfo.id + '"]:last');
                    } else {
                        //移动到管理员后面
                        var myUserLi = $('#onlineUser li[group="2"]:last');
                    }
                    myUserLi.after(userLi);
                }

                if (userLi.length > 0) {
                    //更换关注图片
                    var LiSrc = userLi.find('.groupImg').attr('src');
                    var src = msg.type == 0 ? LiSrc.replace('-1', '-1-1') : LiSrc.replace('-1-1', '-1');
                    //更换关注状态
                    userLi.attr('follow', msg.type == 0 ? 1 : 0);
                    userLi.find('.groupImg').attr('src', src);
                }

                if (msg.type == 0) {
                    //添加到我的关注
                    $('#followUser').append(userLi.clone());
                    //把消息列表li改成已关注
                    $('.msgHead[userid="' + userId + '"]').attr('follow', 1);
                    //更新我的关注
                    followIdArr.push(parseInt(userId));
                } else {
                    //移除我的关注
                    $('#followUser li[userId="' + userId + '"]').remove();
                    //把消息列表li改成未关注
                    $('.msgHead[userid="' + userId + '"]').attr('follow', 0);
                    followIdArr.splice($.inArray(parseInt(userId), followIdArr), 1);
                }
                //更新消息是否关注显示
                if (isToUser() == 1) seeFollowMsg();
            } else {
                jslogout(msg.msg)
            }
        }
    })
})

//点击发送
$('#SendBtn').click(function () {
    say();
})

//键盘确定发言
$(document).keyup(function (event) {
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

        if (!userInfo) {
            layer.msg(errMsg[1], {shift: 6});
            return;
        }

        if (openchat > 0) {
            layer.msg(errMsg[2], {shift: 6});
            return;
        }

        var text = $.trim($("#chatTxt").text());

        if (text == '') {
            var hasImg = $("#chatTxt").find('img');
            if (hasImg.length == 0) {
                layer.msg(errMsg[3], {shift: 6});
                $('#chatTxt').html('');
                return;
            }
        }else if(text == time_open_notice){
            layer.msg(errMsg[3], {shift: 6});
            $('#chatTxt').html('');
            return;
        }

        var c1 = $.trim($("#chatTxt").html());

        if (text.length > 240) {
            layer.msg(errMsg[4], {shift: 6});
            return;
        }
        var c2 = c1.replace(/<div>(.*?)<\/div>/g, function (arg1, arg2) {
            return arg2;
        });

        var reg = new RegExp("<br>", "g");
        var c3 = c2.replace(reg, "");

        var reg2 = new RegExp("&nbsp;", "g");
        var content = c3.replace(reg2, "");

        content = content.replace(/<img class="(.*?)" src="(.*?)" code="(.*?)">/g, function (arg1, arg2, arg3, arg4) {
            return "undefined" != typeof arg4 ? jEmoji.EMOJI_UMAP[arg4] : arg1;
        });

        var payload = {
            action: 'say',
            dataType: 'text',
            data: {
                user_id: userInfo.id,
                nickname: userInfo.nickname,
                group_id: userInfo.group_id,
                avatar: userInfo.avatar,
                chat_time: Date.parse(new Date()) / 1000,
                content: content,
                msg_id: getUuid(),
                token: userInfo.token,
                room_id:room_id
            },
            status: 1
        };

        if (chatType == 3) {
            payload.data.toUserId = aiteToUser.join(',');
            payload.action = 'sayTo';
            chatType = null;
        }

        var jStr = JSON.stringify(payload);
        $('#chatTxt').html('');
        aiteToUser = [];
    } catch (e) {
        console.log(e);
        return;
    }

    $('.textCon').html(time_open_notice);
    client.publish(topic[0], jStr, {qos: qos, retain: retain});
}

//点赞
function sayLike() {
    var cc = '<span class="pull-left"><img src="' + url_pre + '/room/images/chatRoom/sup1.png" width="42" height="37"><img src="' + url_pre + '/room/images/chatRoom/sup2.png" width="42" height="37"></span>';
    var nick = userInfo ? userInfo.nickname : '游客' + visitor;
    var id = userInfo ? userInfo.id : visitor;
    var group_id = userInfo ? userInfo.group_id : 0;
    var avatar = userInfo ? userInfo.avatar : url_pre + '/room/images/avatar.png';
    var payload2 = {
        action: 'sayLike',
        dataType: 'text',
        data: {
            user_id: id,
            group_id: group_id,
            nickname: nick,
            avatar: avatar,
            chat_time: Date.parse(new Date()) / 1000,
            content: cc,
            msg_id: getUuid(),
            room_id:room_id
        },
        status: 1
    };

    client.publish(topic[0], JSON.stringify(payload2), {qos: qos, retain: retain});

}

//拼接消息html
function getSayHtml(data, aiTeMe) {
    //显示发言
    var chat_time = formatDateTime(data.chat_time);
    //是否关注
    var is_follow = $.inArray(parseInt(data.user_id), followIdArr) >= 0 ? 1 : 0
    //是否只看我关注的人
    var isDisplayNone = '';
    if (isToUser()) {
        if (isToUserHide(data.user_id, data.group_id) == 1) {
            isDisplayNone = 'style="display: none;"';
        }
    }

    //是否是我发言
    var isMine = userInfo && data.user_id == userInfo.id ? 'msgRight' : 'msgLeft';
    var layim_chatsay = 'layim_chatsay';

    //替换回表情
    var content = data.content;
    if (content.match(/<img class="uploadImg" src=".*?">/g)) {
        layim_chatsay = 'layim_chatsay layim_chatsay2';
    }
    content = jEmoji.unifiedToHTML(content)
    var hiddenLayer = userInfo.group_id == 2 && data.user_id != userInfo.id ? '<div class="pbxx"><span class="boxShadow">屏蔽信息</span></div>' : '';
    var sayHtml = '<li ' + isDisplayNone + ' class="msgList clearfix" id="' + data.msg_id + '" autoid="' + data.id + '">' +
        '<div class="msg ' + isMine + ' ' + aiTeMe + '">' +
        '<div class="msgHead" userId="' + data.user_id + '" isgag="0" group="' + data.group_id + '" follow="' + is_follow + '">' +
        '<img src="' + data.avatar + '" class="msg_group_ico" title="' + data.nickname + '">' +
        '<span style="display: none" class="userId">' + data.user_id + '</span></div><div class="msgContent">' +
        '<div class="name"><font class="faceName" onclick="ToUser.set()">' + data.nickname + '</font>&nbsp;&nbsp; ' +
        '<font class="date">' + chat_time + '</font></div> <div class="' + layim_chatsay + '">' +
        '<font>' + content + '</font>' + hiddenLayer + '</div></div></div></li>';

    return sayHtml;
}

//接收数据处理
function onChat(d) {
    var temp = JSON.parse(d);
    var data = temp.data;
    switch (temp.action) {
        case 'say':
        case 'sayTo':
        case 'sayLike':
            var maodian = '';
            var aiTeMe = '';
            //接收到aite消息
            if (temp.action == 'sayTo') {
                var toIds = data.toUserId;
                var displayAite = $('#aiTe').css('display');
                if (toIds.indexOf(userInfo.id) > -1) {
                    if (displayAite == 'none') {
                        $('#aiTe').css('display', 'block');
                        $('#aiTe').attr('name', data.msg_id);
                    }
                    aiTeMe = 'hey';
                }
            }

            if (temp.action == 'say' || temp.action == 'sayLike') {
                if (isNew && userInfo && userInfo.id != data.user_id) {
                    $('#newCon').css('display', 'block');
                    newConNum++;
                    $('#newCon').html('有' + newConNum + '新消息' + '<i class="laba"></i>');
                } else {
                    isNew = false;
                    newConNum = 0;
                    $('#newCon').css('display', 'none');
                }
                // hiddenMsgList();
            }

            var sayHtml = getSayHtml(data, aiTeMe);

            $(".msgListBox .msgListBoxUl").append(sayHtml);
            $(".msgBox").mCustomScrollbar("update");

            layer.photos({
                shadeClose: true,
                closeBtn: true,
                photos: '.layim_chatsay2',
                anim: 5, //0-6的选择，指定弹出图片动画类型，默认随机（请注意，3.0之前的版本用shift参数）
                shade: 0.3
            });
            //滚动到底部
            scrollToBottom();
            break;
        case 'sayHello':
            if (userInfo) {
                if (userInfo.id == data.id && userInfo.token != data.token) {
                    jslogout('您已在其他端登录！')
                }
            }
            //暂时去掉进入提示
            //$('.welcome span').html(data.nickname + ' 加入聊天室');
            //$('.welcome').stop().animate({'left': '20px'}, 3000).animate({'left': '-400px'});
            //已有不需要插入
            if ($('#onlineUser li[userId="' + data.id + '"]').length > 0) return;
            //登录推送
            var your_name = Cookie.getCookie('your_name');
            if (data.id != userInfo.id && data.id != your_name) {
                var groupImg = data.isgag == 1 && userInfo.group_id >= 2 ? 'shield-' + data.group_id : 'rank-' + data.group_id;
                var isDisplayNone = fmsearch == true ? 'style="display: none;"' : '';
                //是否关注
                var is_follow = $.inArray(parseInt(data.id), followIdArr) >= 0 ? 1 : 0

                if (is_follow == 1 && data.group_id == 1) groupImg = groupImg + '-1';
                var html = '<li class="userList" userId="' + data.id + '" group="' + data.group_id + '" isgag="' + data.isgag + '" follow="' + is_follow + '" ' + isDisplayNone + '><a title="' + data.nickname + '" href="javascript:;" class="clearfix Lista">' +
                    '<span style="display: none" class="userId">' + data.id + '</span>' +
                    '<cite class="pull-left headFace"><img src="' + data.avatar + '" border="0" width="32" height="32"></cite>' +
                    '<span class="pull-left faceName">' + data.nickname + '</span>' +
                    '<span class="pull-right faceRank">' +
                    '<img class="groupImg" src="/room/images/chatRoom/' + groupImg + '.png" width="33" height="32">' +
                    '</span>' +
                    '</a>' +
                    '</li>';
                //更新在线用户数量
                var num = $('.onLine .usernum').text();
                $('.onLine .usernum').text(parseInt(num) + 1);


                if (data.group_id == 0) {
                    //游客最后面
                    $('#onlineUser li:last').after(html);
                }
                else if (data.group_id >= 2) {
                    //管理员相同等级后面
                    var userLi = $('#onlineUser li[group="' + data.group_id + '"]:last');
                    if (userLi.length > 0) {
                        userLi.after(html);
                    } else {
                        //第一位
                        $('#onlineUser').prepend(html);
                    }
                }
                else if (data.group_id == 1) {
                    //会员
                    if (is_follow == 1) {
                        //关注后面
                        var userLi = $('#onlineUser li[group="' + data.group_id + '"][follow="' + is_follow + '"]:last');
                        if (userLi.length == 0) {
                            //没有关注放我的后面
                            var userLi = $('#onlineUser li[userid="' + userInfo.id + '"]:last');
                        }
                    } else {
                        //同等级后面
                        var userLi = $('#onlineUser li[group="1"]:last');
                    }

                    if (userLi.length == 0) {
                        //没有同等级放管理员后面
                        var userLi = $('#onlineUser li[group="2"]:last');
                    }

                    if (userLi.length > 0) {
                        userLi.after(html);
                    } else {
                        //没有管理员放第一位
                        $('#onlineUser').prepend(html);
                    }

                }

                //管理员或关注栏
                if (data.group_id >= 2 || is_follow == 1) {
                    //关注栏插入
                    if ($('#followUser li[userId="' + data.id + '"]').length == 0) {
                        //相同等级后面
                        var followLi = $('#followUser li[group="' + data.group_id + '"]:last');
                        if (followLi.length > 0) {
                            followLi.after(html);
                        } else {
                            //第一位
                            if (data.group_id >= 2) {
                                $('#followUser').prepend(html);
                            } else {
                                $('#followUser').append(html);
                            }
                        }
                    }
                }
                $(".userUl").mCustomScrollbar("update");
            }
            break;
        case 'forbid':
            //是否禁言操作
            if ($.inArray(parseInt(data.isgag), [0, 1, 9]) == -1) {
                //是否为自己
                if (userInfo.id == data.user_id || visitor == data.user_id) {
                    layer.msg(data.notice_str, {shift: 6});
                }
                return;
            }

            //是否禁用成功
            if (data.isgag == 9) {
                if (userInfo.id == data.admin_id) {
                    jslogout(data.notice_str)
                }
                return;
            }

            var userLi = $('.userUl li[userId="' + data.user_id + '"]');
            var isgag = parseInt(data.isgag) == 0 ? 1 : 0;
            userLi.attr('isgag', isgag);
            //把消息列表li修改禁言状态
            $('.msgHead[userid="' + data.user_id + '"]').attr('isgag', isgag);

            //管理员改变图片
            if (userInfo.group_id >= 2) {
                var groupImg = isgag == 1
                    ? userLi.find('.groupImg').attr('src').replace('rank', 'shield')
                    : userLi.find('.groupImg').attr('src').replace('shield', 'rank');
                userLi.find('.groupImg').attr('src', groupImg);
            }

            // if (data.notice_str == 0) {
            //     //禁言
            //     if (userInfo.id != data.user_id) {
            //         //移动到最后面
            //         $('#onlineUser').append(userLi);
            //     }
            // } else if (data.notice_str == 1) {
            //     //解除禁言
            //     var group = userLi.attr('group');
            //     if (userInfo.id != data.user_id) {
            //         //移动到会员组最后面
            //         var userList = $('#onlineUser li[group="' + group + '"][isgag="0"]:last');
            //         if (userList.length > 0) {
            //             userList.after(userLi);
            //         } else {
            //             $('#onlineUser li:last').after(userLi);
            //         }
            //     }
            // }
            //是否为自己
            if (userInfo.id != data.user_id) return;
            layer.msg(data.notice_str, {shift: 6});
            break;
        case 'logout':
            var userLi = $('#onlineUser li[userId="' + data.id + '"]');
            if (userLi.length == 0) return;

            var your_name = Cookie.getCookie('your_name');
            if (data.id == userInfo.id || data.id == your_name) return;

            //退出登录
            userLi.remove();
            var num = $('.onLine .usernum').text();
            $('.onLine .usernum').text(parseInt(num) - 1);

            $(".userUl").mCustomScrollbar("update");
            //关注栏退出
            // if ($('#followUser li[userId="' + data.id + '"]').length > 0){
            //     $('#followUser li[userId="' + data.id + '"]').remove();
            // }
            break;
        case 'hiddenMsg':
            var msg_ids = data.msg_id.split(',');
            for (var i = 0; i < msg_ids.length; i++) {
                $(".msgList[id='" + msg_ids[i] + "']").remove();
            }
            break;
        case 'hiddenUser':
            if (userInfo) {
                var user_list = data.user_list.split(',');
                if ($.inArray(String(userInfo.id), user_list) >= 0) {
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
            if (userInfo) {
                if (userInfo.id == data.user_list) {
                    layer.open({
                        title: '提示',
                        closeBtn: 0, //不显示关闭按钮
                        content: data.notice_str,
                        yes: function (index, layero) {
                            window.location.reload();
                        }
                    });
                }
            }
            //关注栏退出
            if (data.group_id == 1) {
                if ($('#followUser li[userId="' + data.user_list + '"]').length > 0) {
                    $('#followUser li[userId="' + data.user_list + '"]').remove();
                }
            }
            break;
    }


}

//搜索在线会员
function validates() {
    var name = $.trim($('#search').val());
    if (name == '') {
        $('.onlineUser .userUl li').show();
        fmsearch = false;
    } else {
        $('.onlineUser .userUl li').hide();
        $('.onlineUser .userUl li').find('.faceName:Contains(' + name + ')').parents('li').show();
        fmsearch = true;
    }
    return false;
}

//查看更多历史消息
var page = 2;//第二页开始
var pageTime = 0;
$('.more-message').on('click', function () {
    $.ajax({
        type: 'POST',
        url: '/generic/chatLog',
        dataType: 'json',
        data: {room_id: room_id, p: page},
        success: function (msg) {
            if (msg.code == 1) {
                var html = '';
                if (msg.list != '') {
                    $.each(msg.list, function (k, v) {
                        html += getSayHtml(v, '');
                    });
                    $(".msgListBox ul").prepend(html);

                    var inx = msg.list.pop();
                    var _id = '#' + inx['msg_id'];
                    $(".msgBox").mCustomScrollbar("scrollTo", _id, {
                        scrollInertia: 0
                    });
                    layer.photos({
                        shadeClose: true,
                        closeBtn: true,
                        photos: '.layim_chatsay2',
                        anim: 5, //0-6的选择，指定弹出图片动画类型，默认随机（请注意，3.0之前的版本用shift参数）
                        shade: 0.3
                    });

                } else {
                    $('.more-message').css('display', 'none');
                }
                page++;
                pageTime = getTime();
                lastMsgId = msg.msg_id;
            } else {
                layer.msg(msg.list, {shift: 6});
            }
        }
    })
})

/**
 * 时间对象的格式化;
 */
function formatDateTime(inputTime) {
    var date = new Date(inputTime * 1000);
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    var h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    var minute = date.getMinutes();
    var second = date.getSeconds();
    minute = minute < 10 ? ('0' + minute) : minute;
    second = second < 10 ? ('0' + second) : second;
    return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second;
};

function hiddenMsgList() {
    var liLen = $(".msgListBox ul").children('li').length;
    var maxLen = 9;
    if (page <= 2 || (page > 2 && getTime() - pageTime > 10)) {//不翻页情况下，消息条数超过100就收起到历史消息
        lastMsgId = $(".msgListBox ul").find('li').eq(maxLen + 1).attr('id');
        if (liLen > maxLen) {
            $(".msgListBox ul>li").filter(function (index) {
                return index < maxLen;
            }).remove();
        }
    }
}

function getTime() {
    return Date.parse(new Date()) / 1000;
}
//获取在线会员
function onlineUser() {
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
                    var groupImg = d.isgag == 1 && userInfo.group_id >= 2 ? 'shield-' + d.group_id : 'rank-' + d.group_id;
                    if (d.is_follow == 1) groupImg = groupImg + '-1';
                    uhtml += '<li class="userList" userId="' + d.id + '" group="' + d.group_id + '" isgag="' + d.isgag + '" follow="' + d.is_follow + '"><a title="' + d.nickname + '" href="javascript:;" class="clearfix Lista">' +
                        '<span style="display: none" class="userId">' + d.id + '</span>' +
                        '<cite class="pull-left headFace"><img src="' + d.avatar + '" border="0" width="32" height="32"></cite>' +
                        '<span class="pull-left faceName">' + d.nickname + '</span>' +
                        '<span class="pull-right faceRank">' +
                        '<img class="groupImg" src="/room/images/chatRoom/' + groupImg + '.png" width="33" height="32">' +
                        '</span>' +
                        '</a>' +
                        '</li>';
                });
                //所有用户
                $("#onlineUser").append(uhtml);
                $('.onLine .usernum').text(data.u.length);
                //关注的人
                var fhtml = '';
                $.each(data.fu, function (k, d) {
                    var groupImg = d.isgag == 1 && userInfo.group_id >= 2 ? 'shield-' + d.group_id : 'rank-' + d.group_id;
                    if (d.is_follow == 1) groupImg = groupImg + '-1';
                    fhtml += '<li class="userList" userId="' + d.id + '" group="' + d.group_id + '" isgag="' + d.isgag + '" follow="' + d.is_follow + '"><a title="' + d.nickname + '" href="javascript:;" class="clearfix Lista">' +
                        '<span style="display: none" class="userId">' + d.id + '</span>' +
                        '<cite class="pull-left headFace"><img src="' + d.avatar + '" border="0" width="32" height="32"></cite>' +
                        '<span class="pull-left faceName">' + d.nickname + '</span>' +
                        '<span class="pull-right faceRank">' +
                        '<img class="groupImg" src="/room/images/chatRoom/' + groupImg + '.png" width="33" height="32">' +
                        '</span>' +
                        '</a>' +
                        '</li>';
                });
                $("#followUser").append(fhtml);
            }
        }
    });
}

//屏蔽推送
$(document).on('click', ".msgList .boxShadow", function (e) {
    var msg_id = $(this).parents('li').attr('id');
    //推送提交
    var payload2 = {
        action: 'hiddenMsg',
        dataType: 'text',
        data: {
            notice_str: '屏蔽消息',
            msg_id: msg_id
        },
        status: 1
    };
    client.publish(topic[0], JSON.stringify(payload2), {qos: qos, retain: retain});
});

//查看会员信息
function getDetails(userId) {
    $('.layerBody ul').empty();
    $.ajax({
        type: 'POST',
        url: '/user/getDetails',
        dataType: 'json',
        data: {user_id: userId},
        success: function (msg) {
            if (msg.code == 1) {
                var data = msg.data;
                $('.layerFace img').attr('src', data.avatar);
                $('.layerName .faceName').text(data.nickname);
                $('.layerName .faceRank img').attr('src', data.userGroup.img);

                var jointime = formatDateTime(data.jointime);
                var html = '<li class="inforLi clearfix">' +
                    '<span class="pull-left">昵称：</span> <em class="pull-left">' + data.nickname + '</em></li>' +
                    '<li class="inforLi clearfix"><span class="pull-left">QQ：</span> <em class="pull-left">' + data.qq + '</em></li>' +
                    '<li class="inforLi clearfix"><span class="pull-left">手机号码：</span> <em class="pull-left">' + data.mobile + '</em></li>' +
                    '<li class="inforLi clearfix"><span class="pull-left">我的身份：</span> <em class="pull-left">' + data.userGroup.name + '</em></li>' +
                    '<li class="inforLi clearfix"><span class="pull-left">登陆次数：</span> <em class="pull-left">0</em></li>' +
                    '<li class="inforLi clearfix"><span class="pull-left">注册时间：</span> ' +
                    '<em class="pull-left">' + jointime + '</em>' +
                    '</li>';
                $('.layerBody ul').append(html);
                $(".layerInfor").addClass('animate');
            } else {
                layer.msg(msg.data, {shift: 6});
            }
        }
    });
}

//获取随机ID
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

//点击@按钮
$(document).on('click', "#sayTo", function (e) {
    if($('.textCon').html() == time_open_notice){
        $('.textCon').html('')
    }
    if (!userInfo) {
        layer.msg(errMsg[1], {shift: 6});
        return;
    }
    chatType = 3;
    //@多个人
    if ($.inArray(onlineUserId, aiteToUser) == -1) {
        aiteToUser.push(onlineUserId);
        //console.log('onlineFaceName:' + onlineFaceName, 'onlineUserId:' + onlineUserId);
        $('.chatTxt').append('@' + onlineFaceName + '&nbsp;');
    }
});

//点击@消息弹窗
$('#aiTe').click(function (e) {
    var _id = '#' + $(this).attr("name");
    $(".msgBox").mCustomScrollbar("scrollTo", _id, {
        scrollInertia: 0
    });

    $(this).css('display', 'none');
});

//点击新消息弹窗
$('#newCon').click(function (e) {
    $(".msgBox").mCustomScrollbar("scrollTo", "bottom", {
        scrollInertia: 0,
    });
    isNew = false;
    newConNum = 0;
    $(this).css('display', 'none');
});

/**
 * 之粘贴纯文本
 */
$('#chatTxt').each(function () {
    // 干掉IE http之类地址自动加链接
    try {
        document.execCommand("AutoUrlDetect", false, false);
    } catch (e) {
    }

    $(this).on('paste', function (e) {
        e.preventDefault();
        var text = null;

        if (window.clipboardData && clipboardData.setData) {
            // IE
            text = window.clipboardData.getData('text');
        } else {
            text = (e.originalEvent || e).clipboardData.getData('text/plain');
        }
        if (document.body.createTextRange) {
            if (document.selection) {
                textRange = document.selection.createRange();
            } else if (window.getSelection) {
                sel = window.getSelection();
                var range = sel.getRangeAt(0);

                // 创建临时元素，使得TextRange可以移动到正确的位置
                var tempEl = document.createElement("span");
                tempEl.innerHTML = "&#FEFF;";
                range.deleteContents();
                range.insertNode(tempEl);
                textRange = document.body.createTextRange();
                textRange.moveToElementText(tempEl);
                tempEl.parentNode.removeChild(tempEl);
            }
            textRange.text = text;
            textRange.collapse(false);
            textRange.select();
        } else {
            // Chrome之类浏览器
            document.execCommand("insertText", false, text);
        }
    });
    // 去除Crtl+b/Ctrl+i/Ctrl+u等快捷键
    $(this).on('keydown', function (e) {
        // e.metaKey for mac
        if (e.ctrlKey || e.metaKey) {
            switch (e.keyCode) {
                case 66: //ctrl+B or ctrl+b
                case 98:
                case 73: //ctrl+I or ctrl+i
                case 105:
                case 85: //ctrl+U or ctrl+u
                case 117: {
                    e.preventDefault();
                    break;
                }
            }
        }
    });
});
