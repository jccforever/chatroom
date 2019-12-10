/**
 * quancai mChatRoom of js
 *
 * @author Chensiren <245017279@qq.com>
 *
 * @since  2017-12-08
 **/

//计算高度 2017-12-07
var wH = document.body.offsetHeight,
    tabItem = $('.tabItem').actual( 'height');
    headTopH = $('.header').height(),
    lotTitletH = $('.lotTitle').actual( 'height');

//聊天滚动
function MsgAutoScroll() {
    if ($('.msgBox').find(".msgList").length > 100) {
        $('.msgBox').find(".msgList:first").remove();
    }
    $('.msgBox').scrollTop($('.msgBox')[0] ? $('.msgBox')[0].scrollHeight : 0);
    $('.msgListBox img').load(function(){
        $('.msgBox').scrollTop($('.msgBox')[0] ? $('.msgBox')[0].scrollHeight : 0);
    });

    setTimeout(function () {
        newMsgAlert = false;
    },1000)
}

//百度浏览器判断
function baiduBrowser(){
    var ua = window.navigator.userAgent;
    if(ua.toLowerCase().indexOf("baidu") > 0){
        window.location.href="https://room.jrssports.com/";
        $('.top').css({'visibility': 'visible'});//baidu logic
    }else{
        window.location.href="http://room.jrssports.com/"
        $('.top').css({'visibility': 'hidden'});//others
    }
}


//调整页面
function OnResize(){
    var headHeight = $('#header').outerHeight(),
        footerHeight = $('.formCon').outerHeight(),
        bodyH = document.body.offsetHeight;

    var height = bodyH - headHeight - footerHeight;

    $('.msgBox').height(height);
    $('.onlineList').height(wH - headTopH - tabItem);

    $('.lotList').height(wH - headHeight - lotTitletH);
    MsgAutoScroll();
}
var errMsg = {
    0: '参数错误',
    1: '亲，需要登录才有发言权限哦',
    2: '新注册用户30分钟后才可以发言哦',
    3: '请输入聊天内容！',
    4: '聊天内容过长',
    7: "图片文件大小超过限制。请上传小于1M的文件",
    8: "图片限于bmp,png,gif,jpeg,jpg格式",
    9: "亲，不能关注自己哦",
    10: "请先登录",
    11: "聊天室开放时间为8:30-凌晨2:00，休息是为了走更长的路！",
}
var aiteToUser = new Array();
var sayType = 0;
var msgNew = 0;
var newMsgAlert = false;

var pp = '';
if(room_id == 'pk10'){
    pp = '?ver=v3';
}

var shiPinUrl = 'https://www.1398p.com/'+room_id+'/h5shipin'+pp;
var iframe = '<iframe id="player1" width="100%" height="100%" frameborder="no" border="0" marginwidth="0" marginheight="0" scrolling="no" ng-src="'+shiPinUrl+'" src="'+shiPinUrl+'"></iframe>';

$(function () {
    //baiduBrowser();

    //默认打开视频
    var live_status = Cookie.getCookie('live_status');
    if(live_status == 'on' || live_status == null){
        Cookie.setCookie('live_status', 'on', 1);
        //打开视频
        $('.video-container').show();
        $('.resultCon').hide();
        $('.liveBtn02').show();
        $('#video-win').append(iframe);
    }

    if(Cookie.getCookie('lottery_status') == 'on'){
        //打开开奖号码
        showLottery();
    }else{
        getawardtimes();
        //计算盒子宽高
        OnResize();
    }

    $(window).resize(function() {
        OnResize();
    });

    /*添加动画样式*/
    $.fn.extend({
        animateCss: function (e, t) {
            var i = "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend";
            return this.addClass("animated " + e).one(i, function () {
                $(this).removeClass("animated " + e),
                "function" == typeof t && t()
            }),
                this
        }
    })
    //皇家网站退出登录
    if(Cookie.getCookie('logout')){
        Cookie.delCookie('logout');
        logout();
    }
    //是否异常
    if(userStatus){
        jslogout(userStatus.msg)
    }
    //在线会员
    joinRoom();

});

//比赛直播
$('.liveBtn').click(function(e) {
    var type = $(this).attr('type');
    if(type == 'on'){
        //打开视频
        $('.video-container').show();
        $('.resultCon').hide();
        $('.liveBtn02').show();
        $('#video-win').append(iframe);
    }else{
        //收起视频
        $('.video-container').hide();
        $('.resultCon').show();
        $('.liveBtn02').hide();
        $('#video-win').empty();
    }
    Cookie.setCookie('live_status', type, 1);
    OnResize();
});

//顶部栏投注选择
$('.hdCenter').click(function(e) {
    $(this).parents('.lotBoxNo').stop().toggleClass('lotBoxYes');
});
$('.lotTypeCon a').click(function(e) {
    var htmlText = $(this).html();
    $('.lotBoxNo').removeClass('lotBoxYes');
    $('.hdCenter em').html(htmlText);
});

//图片点击放大
$('.thumbs .chatSayImg').touchTouch();

// 解决输入法遮挡
$('.messageEditor').on('click', function () {
    var ver = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
         ver = parseInt(ver[1], 10);
    // alert(ver);
    if(ver<11)
    {
        //var target = this;
        setTimeout(function(){
            //target.scrollIntoViewIfNeeded();
            document.body.scrollTop = document.body.scrollHeight;
            //document.getElementById("messageEditor").scrollintoview();
        },300);
    }
});

//皇家网站退出登录
function jslogout(msg){
    logout();
    layer.open({
        closeBtn: 0, //不显示关闭按钮
        content: msg,
        btn: '确定',
        yes: function(index, layero){
            window.location.reload();
        }
    });
}

//打开在线会员列表
$('.openOnlineList').on('click',function(){
    $('.main:eq(0),.chatHeader').hide();
    $('.main:eq(1)').show();
})

//关闭在线会员列表
$('.returnBtn').on('click',function(){
    // window.location.href = window.location.href;
    $('.main:eq(0),.chatHeader').show();
    $('.main:eq(1)').hide();
    MsgAutoScroll();
});

//在线用户切换
$('.tabItem a').click(function (e) {
    var numAlive = $(this).index();
    $(this).addClass('on').siblings().removeClass('on');
    $('.main .onlineList').eq(numAlive).show().siblings('ul').hide();
});

//关注功能
$(document).on('click',".follow",function (e) {
    if(!userInfo){
        layer.open({
            content: errMsg[10],
            btn: '确定'
        });
        return;
    }
    var userId = $(this).parents('li').attr('userId');
    var follow = $(this).parents('li').attr('follow');
    $.ajax({
        type:'post',
        url: '/generic/follow',
        dataType: 'json',
        data: {follow_id: userId, follow: follow},
        success:function(msg){
            if(msg.code == 1){
                var userLi = $('.onlineUser li[userId="' + userId + '"]');
                //列表是否有关注
                var followLi = $('.onlineUser li[follow=1]:last');

                if (followLi.length > 0) {
                    //移动到关注后面
                    followLi.after(userLi);
                } else {
                    if(userInfo.group_id == 1){
                        //移到我的后面
                        var myUserLi = $('.onlineUser li[userid="' + userInfo.id + '"]:last');
                    }else{
                        //移动到管理员后面
                        var myUserLi = $('.onlineUser li[group="2"]:last');
                    }
                    myUserLi.after(userLi);
                }
                if(userLi.length > 0){
                    //更换关注状态
                    userLi.attr('follow',msg.type == 0 ? 1 : 0);
                    if(msg.type == 0){
                        userLi.find('.follow').addClass('gzed');
                    }else{
                        userLi.find('.follow').removeClass('gzed');
                    }
                    userLi.find('.follow').text(msg.type == 0 ? '已关注' : '关注');
                }

                if(msg.type == 0){
                    //添加到我的关注
                    $('.followUser').append(userLi.clone());
                    //把消息列表li改成已关注
                    $('.msgHead[userid="'+userId+'"]').attr('follow',1);
                    //更新我的关注
                    followIdArr.push(parseInt(userId));
                }else{
                    //移除我的关注
                    $('.followUser li[userId="' + userId + '"]').remove();
                    //把消息列表li改成未关注
                    $('.msgHead[userid="'+userId+'"]').attr('follow',0);
                    followIdArr.splice($.inArray(parseInt(userId),followIdArr),1);
                }
                //底部提示
                var TSmsg = msg.type == 0 ? '已关注' : '已取消关注';
                layer.open({
                    style: 'background-color:#78BA32;',
                    shade: false, //不显示遮罩
                    content: TSmsg,
                    skin: 'footer',
                    time: 2
                });
                //更新消息是否关注显示
                if(isToUser() == 1) seeFollowMsg();
            }else{
                jslogout(msg.msg)
            }
        }
    })
})

//长按打开操作
var timeOutEvent;

$(document).on('touchstart','.msgLeft .msgHead',function(e){
    var group  = $(this).attr('group');
    //游客无操作
    if (group == 0) return false;

    var userId = $(this).attr('userId');
    //自己无操作
    if (userId == userInfo.id) return false;

    var isgag  = $(this).attr('isgag');
    var follow = $(this).attr('follow');
    var nick =  $(this).find('img').attr('title');

    var html = '<ul><li><a href="javascript:;"><span>@TA</span></a></li>';
    //只有会员有才可关注
    if(group == 1){
        var followMsg = follow == 1 ? '取消关注' : '关注TA';
        html += '<li userId="'+userId+'" follow="'+follow+'"><a class="follow" href="javascript:;"><span>'+followMsg+'</span></a></li>';
    }

    if(userInfo){
        //管理员有屏蔽操作
        if(userInfo.group_id >= 2 && group == 1){
            var gagMsg = isgag == 1 ? '取消屏蔽' : '禁言用户';
            html += '<li userId="'+userId+'" isgag="'+isgag+'"><a class="shield" href="javascript:;"><span>'+gagMsg+'</span></a></li>';
        }
    }
    html += '<li><a href="javascript:;" class="sharedClose"><span>取消</span></a></li></ul>';
    timeOutEvent = setTimeout(function(){
        timeOutEvent = 0;
        $(".pressCon").empty().append(html),
        $(".sharedWrap").show(),
        $(".pressCon").stop().slideDown(500),
        $(".pressCon ul li").click(function() {
            if($(this).index() ==  0){
                sayType = 3;
                if(!userInfo){
                    layer.open({
                        content: errMsg[10],
                        btn: '确定'
                    });
                    return;
                }
                chatType = 3;
                if ($.inArray(userId, aiteToUser) == -1) {
                    aiteToUser.push(userId);
                    var s = $('#messageEditor').val() + '@' + nick + ' ';
                    $('#messageEditor').val(s);
                }
            }

            $(".sharedWrap").hide();
            $(".pressCon").stop().slideUp(500);
        });

    },500);
    //e.preventDefault();
});

$(document).on('touchmove','.msgLeft .msgHead',function(e){
    clearTimeout(timeOutEvent);
    timeOutEvent = 0;
});

$(document).on('touchend','.msgLeft .msgHead',function(e){
    clearTimeout(timeOutEvent);
    // if(timeOutEvent!=0){
    //     alert("你这是点击，不是长按");
    // }
    return false;
});

//添加功能
$('.moreFun').click(function (e) {
    $(this).stop().toggleClass('chatBoxYes');
    e ? e.stopPropagation() : event.cancelBubble = true;
});

//点击其他地方隐藏关闭弹出层
$(document).on('touchend', function (e) {
    var target = $(e.target);
    if(target.parents(".moreFunCon").length == 0 && target.children(".moreFunCon").length == 0)
    {
        $(".moreFun").removeClass('chatBoxYes');
    }
    if(target.parents(".lotTypeCon").length == 0 && target.parents(".hdCenter").length == 0)
    {
        $(".header").removeClass('lotBoxYes');
    }
    //隐藏键盘
    if(target.parents(".formCon").length == 0)
    {
        $('#messageEditor').blur();
    }
});

$('.moreFunCon a').click(function(event) {
    var nub =  $(this).index();
    if($('.moreFunCon a').length>1){
        if(nub==0){
            $(this).addClass('on').siblings().removeClass('on');
        }else{
            $(this).removeClass('on').siblings().removeClass('on');
        }
    }else{
        $(this).removeClass('on').siblings().removeClass('on');
    }

});

//开奖号码切换
$('.resultCon').on('click',function(){
    showLottery();
});

function showLottery(){
    if($('.lottery').hasClass('active')){
        //关闭
        $('.msgBox,.formCon').show();
        $('.lotCon').hide();
        $('.chatroom').addClass('active');
        $('.lottery').removeClass('active');
        Cookie.delCookie('lottery_status');
        MsgAutoScroll();

    }else if($('.chatroom').hasClass('active')){
        //打开
        $('.lotCon').show();
        $('.msgBox,.formCon').hide();
        $('.lottery').addClass('active');
        $('.chatroom').removeClass('active');
        Cookie.setCookie('lottery_status', 'on', 1);
        if(period < 5){
            window.clearInterval(sInt);
            getawardtimes();
        }
    }
    OnResize();
}

//页面默认添加
// $(".form .smile").click(function (e) {
//     if ($(".expression").is(":hidden")) {
//         $(".expression").stop().fadeIn();
//         e ? e.stopPropagation() : event.cancelBubble = true;
//         $("#messageEditor").focus();
//     }
// });

//表情触发，点击其他地方隐藏
// $(".expression").click(function (e) {
//     e ? e.stopPropagation() : event.cancelBubble = true;
// });

// $(".expression").find(".expr-tab").find("img").click(function (c) {
//     c.stopPropagation();
//     var a = $(this).attr("src");
//     $("#messageEditor").focus();
//     document.execCommand("insertImage", null, a);
// });

// $(document).on('click', function () {
//     if ($(".expression").css('display') == 'block') {
//         $(".expression").stop().fadeOut();
//     }
// });

//判断是否只查看关注的人消息
function isToUser(){
    var toUser = Cookie.getCookie('toUser');
    var toUser = toUser ? toUser.split(',') : new Array();
    if($.inArray(room_id,toUser) >= 0){
        return 1;
    }
    return 0;
}

//判断是否关注，是否需要隐藏
function isToUserHide(userId,group){
    if($.inArray(parseInt(userId), followIdArr) == -1 && group < 2 && userId != userInfo.id && userInfo){
        return 1;
    }
    return 0;
}

//设置对应cookie数值
function doToUserCookie(type) {
    //是否存在cookie
    var toUser = Cookie.getCookie('toUser');
    var toUser = toUser ? toUser.split(',') : new Array();
    if(type == 0){
        toUser.splice($.inArray(room_id,toUser),1);
    }else if(type == 1){
        toUser.push(room_id);
    }
    Cookie.setCookie('toUser', toUser.join(','), 7);
}

//只看关注的人
function seeFollowMsg(){
    $(".msgListBox .msgList").each(function(k,v){
        var userId = $(this).find('.msgHead').attr('userid');
        var group  = $(this).find('.msgHead').attr('group');
        if(isToUserHide(userId,group) == 1){
            $(this).hide();
        }else{
            $(this).show();
        }
    })
    MsgAutoScroll();
}

//切换只看关注的人
$('.toUser').on('click',function(){
    if(!userInfo){
        layer.open({
            content: errMsg[10],
            btn: '确定'
        });
        return;
    }
    var type = $(this).attr('type');
    if(type == 'all'){
        //查看全部的人
        $(".msgListBox .msgList").show();
        $(this).text('只看关注').attr('type','follow');
        //删除cookie
        doToUserCookie(0);
        MsgAutoScroll();
    }else if(type == 'follow'){
        seeFollowMsg();
        $(this).text('查看全部').attr('type','all');
        //添加cookie
        doToUserCookie(1);
    }
})

//有人@我
$('.aiTe').on('click', function () {
    $(this).removeClass('animate');
    $(this).addClass('bounceOutRight');
    var msg_id = $(this).attr('msg_id');
    //查看全部的人
    $(".msgListBox .msgList").show();
    $('.toUser').text('只看关注').attr('type','follow');
    //删除cookie
    doToUserCookie(0);

    window.location.href="#"+msg_id;
    window.location.href="#";
});

$('.moreInfor').on('click', function () {
    $(this).removeClass('animate');
    $(this).addClass('bounceOutRight');
    msgNew = 0;
    MsgAutoScroll();

});

$('.msgBox').scroll(function(){
    newMsgAlert = true;
});
//分享
// $(".shareBtn").click(function () {
//     $('body,html').css({'overflow': 'hidden'});
//     $('body,html').bind("touchmove", function (e) {
//         e.stopPropagation();
//     });
//     var a = '';
//     a += '<ul class="clearfix">',
//         a += '<li><a href="javascript:;" code="weixin"><i class="wxpyFx"></i><span>朋友圈</span></a></li>',
//         a += '<li><a href="javascript:;" code="weixin"><i class="wxFx"></i><span>微信好友</span></a></li>',
//         a += '<li><a href="javascript:;" code="qqim"><i class="qqFx"></i><span>QQ好友</span></a></li>',
//         a += '<li><a href="javascript:;" code="qzone"><i class="qqkjFx"></i><span>QQ空间</span></a></li>',
//         a += '<li><a href="javascript:;" code="sinaminiblog"><i class="xlwbFx"></i><span>新浪微博</span></a></li>',
//         a += '</ul>',
//         a += '<a href="javascript:;" class="sharedClose"><span>取消</span></a>',
//         $(".shareCon").empty().append(a),
//         $(".sharedWrap").show(),
//         $(".shareCon").stop().slideDown(500),
//         $(".shareCon .sharedClose").click(function () {
//             $(".sharedWrap").hide();
//             $(".shareCon").stop().slideUp(500);
//         })

//     bShare.addEntry({
//         summary: "",
//         //pic: '',
//         vUid: '',
//         vEmail: '',
//         vTag: 'BSHARE'
//     });
//     $(".shareCon a").each(function (i, item) {
//         item.onclick = function (e) {
//             bShare.share(e, $(item).attr("code"), 0);
//             return false;
//         };
//     });
//     // $('.shareCon a').each(function(i, item){
//     //     $(document).on('click', item, function (e) {
//     //         bShare.share(e, $(item).attr("code"), 0);
//     //         return false;
//     //     });
//     // });
// })

//背景更换
$(".changeBgBtn").click(function () {
    $('body,html').css({"height": "100%", "overflow": "hidden"});
    $('body,html').bind("touchmove", function (e) {
        e.stopPropagation();
    });

    var backimgArr = backimg.split('^');
    var bgHtml = '';
    $.each(backimgArr, function (k, v) {
        bgHtml += '<li><a href="javascript:;"><img src="' + v + '"></a></li>'
    })

    $(".changeBgBox ul").empty().append(bgHtml),
    $(".sharedWrap").show(),

    $('.changeBgBox').addClass('chatBoxYes'),
    $(".changeBgBox .closeBgBtn").click(function () {
        $(".sharedWrap").hide();
        $(".changeBgBox").removeClass('chatBoxYes');
    })

    //改变背景图
    $('.bgList a').on('click', function () {
        var img = $(this).find('img').attr('src');
        //替换大图
        img = img.replace('100x60_', '');
        //记录cookie
        Cookie.setCookie('h5bg_image', img, 30);
        $('body').css({
            'background-image': 'url(' + img + ')',
            'background-repeat': 'no-repeat',
            'background-size': '100% 100%'
        })
    });
});

//上传图片
$('#file_upload').on('change', function () {
    var file_size = this.files[0].size;
    var size = file_size / 1024;
    if (size > 1024) {
        var num02 = size.toFixed(2);
        //提示处理
        var msg = "图片文件大小超过限制。请上传小于1M的文件，当前文件大小为" + num02 + "KB";
        layer.open({
            content: msg,
        });
        return false;
    }

    var filepath = this.files[0].name;
    var extStart = filepath.lastIndexOf(".");
    var ext = filepath.substring(extStart, filepath.length).toUpperCase();
    if (ext != ".BMP" && ext != ".PNG" && ext != ".GIF" && ext != ".JPG" && ext != ".JPEG") {
        //图片限制
        var msg2 = "图片限于bmp,png,gif,jpeg,jpg格式";
        layer.open({
            content: msg2,
        });
        return false;
    }
    $.ajax({
        url: "/generic/upload",
        type: 'POST',
        cache: false,
        data: new FormData($('#uploadForm')[0]),
        processData: false,
        contentType: false,
        dataType: "json",
        success: function (data) {
            if (data.status == 1) {
                $("#messageEditor").append('<img src="' + data.filePath + '"/>');
            } else if (data.status == 0) {
                layer.open({
                    content: data.error,
                });
            }
            $("#file_upload").val("");
        }
    });
})

//点击问题反馈
$('.feedback').click(function () {
    var url = "http://tms.359e.com/feedback/webfeedback";
    if (!feedParams) {
        layer.open({
            content: errMsg[0],
            btn: '确定'
        });
        return;
    }
    var postForm = document.createElement("form");
    postForm.method = "post";
    postForm.action = url;

    $.each(feedParams, function (k, v) {
        var input1 = document.createElement("input");
        input1.setAttribute("type", "hidden");
        input1.setAttribute("name", k);
        input1.setAttribute("value", v);
        postForm.appendChild(input1);
    });

    document.body.appendChild(postForm);
    postForm.submit();
    document.body.removeChild(postForm);
});

var resData = null;

//获取开奖数据
function awardHistory() {
    $.ajax({
        url: historyUrl + room_id + "/history",
        dataType: 'jsonp',
        data: '',
        jsonp: 'callback',
        success: function (result) {
            if (result.error == null) {
                resData = result.Result;
                lotHandle();
            }
        }
    });
}

//开奖数据显示规则
function lotHandle() {
    $("#lotHistory").html('');
    var data = resData.slice(0, 100);
    var lotHistory = '';
    var newNumList = resData[0].NumberList;

    //背景赛车
    if (room_id == 'pk10' || room_id == 'xyft') {
        var clickType = $('.tabSpan').find('.on').index();
        pk10Tab(clickType);
    } else if (room_id == 'cqssc') {
        $.each(data, function (k, v) {
            var ts = v.DrawingTime.split('T').join(' ');
            var ds = new Date(Date.parse(ts.replace(/-/g, "/")));
            var dataStr = timeToDate(ds.getTime());

            var num = '';
            var nList = v.NumberList;

            for (var i = 0; i <= nList.length - 1; i++) {
                var cl = '';
                switch (nList[i]) {
                    case newNumList[0]:
                        cl = '#f02f22';
                        break;
                    case newNumList[1]:
                        cl = '#5234ff';
                        break;
                    case newNumList[2]:
                        cl = '#8a0d00';
                        break;
                    case newNumList[3]:
                        cl = '#2D92C2';
                        break;
                    case newNumList[4]:
                        cl = '#005e15';
                        break;
                    default:
                        cl = '#6F8A97';
                        break;
                }
                num += '<span style="background-color: ' + cl + '">' + nList[i] + '</span> ';
            }
            lotHistory = '<tr bgcolor="#fff"> <td width="20%" class="text-666 fs26">' + v.Period + '</td> <td width="20%" class="text-666 fs26">' + dataStr + '</td> <td width="60%" class="text-fff fs26 numSpan"> '+num+' </td> </tr>';
            $("#lotHistory").append(lotHistory);
        });
    } else if (room_id == 'gdkl10') {
        $.each(data, function (k, v) {
            var ts = v.DrawingTime.split('T').join(' ');
            var ds = new Date(Date.parse(ts.replace(/-/g, "/")));
            var dataStr = timeToDate(ds.getTime());

            var num = '';
            var nList = v.NumberList;

            for (var i = 0; i <= nList.length - 1; i++) {
                var cl = '';
                switch (nList[i]) {
                    case newNumList[0]:
                        cl = '#f02f22';
                        break;
                    case newNumList[1]:
                        cl = '#5234ff';
                        break;
                    case newNumList[2]:
                        cl = '#8a0d00';
                        break;
                    case newNumList[3]:
                        cl = '#2D92C2';
                        break;
                    case newNumList[4]:
                        cl = '#005e15';
                        break;
                    case newNumList[5]:
                        cl = '#d46a00';
                        break;
                    case newNumList[6]:
                        cl = '#A76A2A';
                        break;
                    case newNumList[7]:
                        cl = '#4C208C';
                        break;
                    default:
                        cl = '#6F8A97';
                        break;
                }

                num += '<span style="background-color: ' + cl + '">' + nList[i] + '</span> ';
            }

            lotHistory = '<tr bgcolor="#fff"> <td width="20%" class="text-666 fs26">' + v.Period + '</td> <td width="20%" class="text-666 fs26">' + dataStr + '</td> <td width="60%" class="text-fff fs26 numSpan"> '+num+' </td> </tr>';
            $("#lotHistory").append(lotHistory);
        });
    }
}

//时间对象的格式化;
function timeToDate(inputTime) {
    var date = new Date(inputTime);
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    var h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    var minute = date.getMinutes();
    minute = minute < 10 ? ('0' + minute) : minute;
    return h + ':' + minute;
};

//pk10切换tab
$('.tabSpan span').on('click', function () {
    $(this).addClass('on').siblings().removeClass('on');
    var clickType = $(this).index();
    pk10Tab(clickType);
});

function pk10Tab(clickType) {
    var data = resData.slice(0, 100);
    var lotHistory = '';

    $("#lotHistory").html('');
    $.each(data, function (k, v) {
        //日期
        var ts = v.DrawingTime.split('T').join(' ');
        var ds = new Date(Date.parse(ts.replace(/-/g, "/")));
        var dataStr = timeToDate(ds.getTime());

        var dataType = {};
        var nList = v.NumberList;
        var numSpan = '';

        if (clickType == 1 || clickType == 2) {//大小单双
            for (var i = 0; i <= nList.length - 1; i++) {
                var n = parseInt(nList[i]);
                if (n > 5) {
                    if (n % 2 == 0) {
                        dataType = {1: '大', 2: '双'}
                    } else {
                        dataType = {1: '大', 2: '单'}
                    }
                } else {
                    if (n % 2 == 0) {
                        dataType = {1: '小', 2: '双'}
                    } else {
                        dataType = {1: '小', 2: '单'}
                    }
                }

                var bgColor = dataType[clickType] == '大' || dataType[clickType] == '单' ? 'singleBig' : 'doubleSmall';
                numSpan += '<span class="' + bgColor + '">' + dataType[clickType] + '</span> ';
            }
        } else if (clickType == 3) {//处理对子
            for (var i = 0; i <= nList.length - 1; i++) {
                if (k - 1 >= 0) {
                    if (nList[i] == data[k - 1].NumberList[i]) {
                        numSpan += '<span class="num-' + nList[i] + '" style="color:#ffffff">' + nList[i] + '</span> ';
                        $('#lotHistory tr').eq(k - 1).children('td.numSpan').find('span').eq(i).addClass("num-" + nList[i]);

                        $('#lotHistory tr').eq(k - 1).children('td.numSpan').find('span').eq(i).css('color','#ffffff');
                        continue;
                    }
                }
                numSpan += '<span style="color:#3d3931">' + nList[i] + '</span> ';
            }
        } else {
            for (var i = 0; i <= nList.length - 1; i++) {
                numSpan += '<span class="num-' + nList[i] + '">' + nList[i] + '</span> ';
            }
        }

        lotHistory = '<tr bgcolor="#fff"> <td width="20%" class="text-666 fs26">' + v.Period + '</td> <td width="20%" class="text-666 fs26">' + dataStr + '</td> <td width="60%" class="text-fff fs26 numSpan"> '+numSpan+' </td> </tr>';
        $("#lotHistory").append(lotHistory);

    });
}