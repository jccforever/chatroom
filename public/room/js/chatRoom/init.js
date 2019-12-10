/**
 * quancai chatRoom of js
 * @author Chensiren <245017279@qq.com>
 * @since  2017-09-22
 **/
 // 低版本浏览器显示
if(navigator.appName == "Microsoft Internet Explorer" && (
    navigator.appVersion.match(/7./i)=="7." ||
    navigator.appVersion.match(/8./i)=="8." ||
    navigator.appVersion.match(/9./i)=="9."))
{
    var sharedWrap =  '<div class="sharedWrap"></div>'+ '<div class="shareCon">'+ '<h4>浏览器版本过低</h4>'+ '<p class="titleP">温馨提示：您当前的浏览器版本过低，无法正常使用聊天室，请升级到以下浏览器~</p>'+ '<ul class="clearfix">'+ '<li>'+ '<a href="http://rj.baidu.com/soft/detail/14917.html">'+ '<p><img src="/room/images/chatRoom/Ie.png" width="81" height="76"></p>'+ '<span>IE10/IE11</span>'+ '</a>'+ '</li>'+ '<li>'+ '<a href="http://rj.baidu.com/soft/detail/14744.html">'+ '<p><img src="/room/images/chatRoom/Chrome.png" width="81" height="76"></p>'+ '<span>Chrome</span>'+ '</a>'+ '</li>'+ '<li>'+ '<a href="http://rj.baidu.com/soft/detail/11843.html">'+ '<p><img src="/room/images/chatRoom/Huohu.png" width="81" height="76"></p>'+ '<span>火狐</span>'+ '</a>'+ '</li>'+ '<li>'+ '<a href="http://xiazai.sogou.com/detail/34/8/-4337823077699367090.html?e=1970">'+ '<p><img src="/room/images/chatRoom/Safari.png" width="81" height="76"></p>'+ '<span>Safari</span>'+ '</a>'+ '</li>'+ '<li>'+ '<a href="http://rj.baidu.com/soft/detail/14754.html">'+ '<p><img src="/room/images/chatRoom/Sougou.png" width="81" height="76"></p>'+ '<span>搜狗</span>'+ '</a>'+ '</li>'+ '<li>'+ '<a href="http://rj.baidu.com/soft/detail/16490.html">'+ '<p><img src="/room/images/chatRoom/QQllq.png" width="81" height="76"></p>'+ '<span>QQ</span>'+ '</a>'+ '</li>'+ '<li>'+ '<a href="http://se.360.cn/">'+ '<p><img src="/room/images/chatRoom/360.png" width="81" height="76"></p>'+ '<span>360</span>'+ '</a>'+ '</li>'+ '<li>'+ '<a href="http://rj.baidu.com/soft/detail/11339.html">'+ '<p><img src="/room/images/chatRoom/Baidu.png" width="81" height="76"></p>'+ '<span>百度</span>'+ '</a>'+ '</li>'+ '<li>'+ '<a href="http://rj.baidu.com/soft/detail/12759.html">'+ '<p><img src="/room/images/chatRoom/Shijiezhichuan.png" width="81" height="76"></p>'+ '<span>世界之窗</span>'+ '</a>'+ '</li>'+ '<li>'+ '<a href="http://rj.baidu.com/soft/detail/11508.html">'+ '<p><img src="/room/images/chatRoom/Opera.png" width="81" height="76"></p>'+ '<span>Opera</span>'+ '</a>'+ '</li>'+ '</ul>'+ '<a href="https://support.microsoft.com/zh-cn/help/17621/internet-explorer-downloads" class="upgradeBtn"><img src="/room/images/chatRoom/upgradeBtn.png" width="340" height="70"></a>'+ '</div>';
    $('body').append(sharedWrap);
}

var onlineUserId    = null;
var onlineFaceName  = null;
var chatType        = null;
var isNew           = true;
var followIdArr     = new Array();
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
}
//替换emoji标签标签
$(".msgContent .content").each(function(index, element){
    var content = $(element).html().trim().replace(/\n/g, '<br/>');
    $(element).html(jEmoji.unifiedToHTML(content))
})
$(function () {

    OnResize();
    $(window).on("resize", function () {
        OnResize();
    });

    //滚动条控制
    $(".userUl").mCustomScrollbar({
        theme: "light-3",
        scrollInertia:200,
        mouseWheelPixels:100,
        // 这里可以根据背景颜色来通过theme选择自定义样式，
        //autoDraggerLength: false
    });

    $(".lotList").mCustomScrollbar({
        theme: "light-3",
        scrollInertia:200,
        mouseWheelPixels:100,
        // 这里可以根据背景颜色来通过theme选择自定义样式，
        //autoDraggerLength: false
    });

    $(".msgBox").mCustomScrollbar({
        theme: "light-3",
        scrollInertia:200, //滚动的惯性值
        mouseWheelPixels:200,  //鼠标每次滚动距离
        callbacks: {
            onTotalScroll: function () {
                isNew = false;
                $('#newCon').css('display', 'none');
            }, whileScrolling: function () {
                isNew = true;
            }
        },
        whileScrollingInterval: 0
    });

    //滚动到底部
    scrollToBottom();

    //加载iframe
    var videoParams = '';
    if(room_id == 'pk10'){
        videoParams = '?ver=v3&ui=1';
    }
    var html = '<iframe scrolling="no" src="https://www.1399p.com/'+room_id+'/h5shipin'+videoParams+'" width="450" height="290" frameborder="0" style="display: block;"></iframe>';
    $('.iframeBox').html(html);

    //皇家网站退出登录
    if(Cookie.getCookie('logout')){
        Cookie.delCookie('logout');
        logout();
    }

    //是否异常
    if(userStatus){
        jslogout(userStatus.msg)
    }

    //获取会员列表
    onlineUser();

    if(time_open != "1"){
        $("#chatTxt").html(time_open_notice);
        $('#SendBtn').attr('disabled', true);
        $('.SendBtn').css('background-color', '#9B9D9E');
    }

    $('.textCon').focus(function(){
        if($(this).html() == time_open_notice){
            $(this).html('');
        }
    });

    $('.textCon').keydown(function(){
        if($(this).text() == time_open_notice){
            $(this).html('');
        }
    });

    $('.textCon').blur(function(){
        if($(this).html() == ''){
            $(this).html(time_open_notice);
        }
    });

    $('.textCon').html(time_open_notice);
});

//滚动到底部
function scrollToBottom(){
    $(".msgBox").mCustomScrollbar("scrollTo", "bottom", {
       scrollInertia: 0
    });
    $('.msgListBoxUl img').load(function(){
        $(".msgBox").mCustomScrollbar("scrollTo", "bottom", {
           scrollInertia: 0
        });
    })
}

//皇家网站退出登录
function jslogout(msg){
    logout();
    layer.open({
        title: '提示',
        closeBtn: 0, //不显示关闭按钮
        content: msg,
        yes: function(index, layero){
            window.location.reload();
        }
    });
}

//获取截图上传
document.getElementById('chatTxt').addEventListener('paste', function (e) {
    $('#SendBtn').attr('disabled', true);
    if (e.clipboardData) {
        var items = e.clipboardData.items;
        for (var i = 0; i < items.length; i++) {
            var c = e.clipboardData.items[i];
            if (c.kind === "file" && items[i].type.indexOf('image/') !== -1) {
                var f = c.getAsFile();
                var reader = new FileReader();
                reader.onload = function (e) {
                    if (!userInfo) {
                        layer.msg(errMsg[1], {shift: 6});
                        $("#chatTxt").html('');
                        return;
                    }

                    $.ajax({
                        url: "/generic/uploadImg",
                        type: 'POST',
                        cache: false,
                        data: {'img': e.target.result},
                        dataType: "json",
                        success: function (data) {
                            if (data.code == 1) {
                                // if (navigator.userAgent.indexOf("Firefox") > 0) {
                                //     $('#chatTxt img:last').attr('src', data.filePath);
                                // } else {
                                    $("#chatTxt").append('<img class="uploadImg" src="' + data.filePath + '"/>');
                                //}
                            } else if (data.code == 0) {
                                jslogout(data.msg);
                            } else if (data.code == 2) {
                                layer.msg(data.msg, {shift: 6});
                            }
                            $('#SendBtn').removeAttr('disabled');
                        }
                    });
                }
                reader.readAsDataURL(f);
            } else {
                $('#SendBtn').removeAttr('disabled');
            }
        }
    }
});

//上传图片
$('#file_upload').on('change', function () {
    var file_size = this.files[0].size;
    var size = file_size / 1024;
    if (size > 1024) {
        // var num02 = size.toFixed(2);
        //提示处理
        layer.msg(errMsg[7], {shift: 6});
        return false;
    }

    var filepath = this.files[0].name;
    var extStart = filepath.lastIndexOf(".");
    var ext = filepath.substring(extStart, filepath.length).toUpperCase();
    if (ext != ".BMP" && ext != ".PNG" && ext != ".GIF" && ext != ".JPG" && ext != ".JPEG") {
        //图片限制
        layer.msg(errMsg[8], {shift: 6});
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
            if (data.code == 1) {
                $("#chatTxt").append('<img class="uploadImg" src="' + data.filePath + '"/>');
            } else if (data.code == 0) {
                jslogout(data.msg);
            } else if (data.code == 2) {
                layer.msg(data.msg, {shift: 6});
            }
            $("#file_upload").val("");
        }
    });
})

//输入校验
$('#chatTxt').bind('input propertychange',function(){
    $('#chatTxt img').each(function(){
        if($(this).is(".uploadImg,.emoji_icon")){
            if($(this).is(".uploadImg") && userInfo.group_id != 2){
                $(this).remove();
            }
        }else{
            $(this).remove();
        }
    })
    $('#chatTxt input').remove();
});

//聊天预览大图
layer.photos({
    shadeClose: true,
    closeBtn: true,
    photos: '.layim_chatsay2',
    anim: 5, //0-6的选择，指定弹出图片动画类型，默认随机（请注意，3.0之前的版本用shift参数）
    shade: 0.3
});

//彩种切换
$('.czList a').click(function(e) {
    var htmlText = $(this).html();
    $('.cpName em').html(htmlText);
    $(this).addClass('cur').siblings().removeClass('cur');
});

//管理员切换
$('.tabList a').on('click', function () {
    var userUlNum = $(this).index();
    $(this).addClass('on').siblings().removeClass('on');
    $('.onlineUser .userUl').eq(userUlNum).show().siblings().hide();
});

//清屏
$('.clearMsgBtn').on('click', function () {
    $(".msgListBox ul").empty();
});

//签到
$('.signBtn').click(function (e) {
    if ($(this).hasClass('on')) {
        //已签到
        $('.signDate').addClass('animate');
        $('.signBtn').addClass('on');
    } else {
        if (!userInfo) {
            layer.msg(errMsg[1], {shift: 6});
            return;
        }
        $.ajax({
            type: 'post',
            url: '/generic/doSign',
            dataType: 'json',
            success: function (msg) {
                if (msg.code == 1) {
                    $('.bagmoney').text('已签到');
                    $('.sign_num').text(msg.data.sign_num);
                    $('.integral em').text(msg.data.score);
                    $('.signDate').addClass('animate');
                    $('.signBtn').addClass('on');
                } else {
                    layer.msg(msg.msg, {shift: 6});
                }
            }
        })
    }
});

//签到移开鼠标
$('.signBtn').mouseleave(function (e) {
    $('.signDate').removeClass('animate');
});

//阻止浏览器默认右键点击事件
$(document).on('contextmenu',".userList,.msgHead,.lookList", function(){
    return false;
});

//按下鼠标右键
$(document).on("mousedown",".userList,.msgHead", function(e){
    //查看信息跟屏蔽
    var key = e.which; //获取鼠标键位(1:代表左键； 2:代表中键； 3:代表右键)
    if(key == 3){
        var group  = $(this).attr('group');
        //游客无操作
        if (group == 0) return false;
        var UserId = $(this).find('.userId').text();
        //自己无操作
        if (UserId == userInfo.id) return false;

        onlineUserId = UserId;
        onlineFaceName = $(this).find('.faceName').text();
        if(onlineFaceName == '') onlineFaceName = $(this).parent().find('.faceName').text();

        var isgag  = $(this).attr('isgag');
        var follow = $(this).attr('follow');

        var html = '<li><span id="sayTo">@ TA</span></li>';
        //只有会员有才可关注
        if(group == 1 && onlineUserId != userInfo.id){
            var followMsg = follow == 1 ? '取消关注' : '关注TA';
            html += '<li><span class="follow" follow="'+follow+'"> '+followMsg+'</span></li>';
        }
        if(userInfo){
            //管理员有屏蔽操作
            if(userInfo.group_id >= 2 && group == 1){
                var gagMsg = isgag == 1 ? '取消禁言' : '禁言用户';
                html += '<li><span class="shield" isgag="'+isgag+'"> '+gagMsg+'</span></li>';
            }
        }
        $('.lookList ul').html(html);
        //获取右键点击坐标
        var x = e.clientX;
        var y = e.clientY;

        $(".lookList").css({left: x, top: y}).show();;
        return false;
    }
})

//点击任意部位隐藏
$(document).on("click", function(e){
    var target = $(e.target);
    if(target.parents(".userList").length == 0 && target.parents(".msgHead").length == 0)
    {
        $(".lookList").hide();
        //$(".layerInfor").removeClass('animate');
    }
})

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
    $(".msgListBoxUl .msgList").each(function(k,v){
        var userId = $(this).find('.msgHead').attr('userid');
        var group  = $(this).find('.msgHead').attr('group');
        if(isToUserHide(userId,group) == 1){
            $(this).hide();
        }else{
            $(this).show();
        }
    })
    $(".msgBox").mCustomScrollbar("scrollTo", "bottom", {
        scrollInertia: 0
    });
}

//切换只看关注的人
$('.toUser').on('click',function(){
    if(!userInfo){
        layer.msg(errMsg[10], {shift: 6}); return;
    }
    var type = $(this).attr('type');
    if(type == 'all'){
        //查看全部的人
        $(".msgListBoxUl .msgList").show();
        $(this).text('只看关注的人').attr('type','follow');
        //删除cookie
        doToUserCookie(0);
        $(".msgBox").mCustomScrollbar("scrollTo", "bottom", {
            scrollInertia: 0
        });
    }else if(type == 'follow'){
        seeFollowMsg();
        $(this).text('查看全部的人').attr('type','all');
        //添加cookie
        doToUserCookie(1);
    }
})

//查看会员信息
$(".lookList .look").click(function (e) {
    getDetails(onlineUserId);
    e ? e.stopPropagation() : event.cancelBubble = true;
});

//点击登录
$('.logBtn').click(function () {
    var url = ssoPre + "/sso/chatroom";
    var params = ssoParams;
    if (!params) {
        layer.msg(errMsg[1], {shift: 6});
        return;
    }

    var index = layer.open({
        type: 2,
        title: false,
        shadeClose: true,
        closeBtn: true,
        scrollbar: false,
        area: ['314px', '268px'],
        content: [url,'no'],
        success: function(layero, index){
        }
    });

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

    postForm.target = 'layui-layer-iframe'+ index;
    document.body.appendChild(postForm);
    postForm.submit();
    document.body.removeChild(postForm);
});

//点击注册
$('.regBtn').click(function () {
    var url = ssoPre + "/sso/register";
    postForm(url);

});

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

//退出登录
function logout(){
    var params = ssoParams;
    if (!params) {
        layer.msg(errMsg[1], {shift: 6});
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

    $('#qrcode-iframe').append(postForm);
    postForm.submit();
}

//点击问题反馈
$('.feedback').click(function () {
    var url = "http://tms.aabb111.com/feedback/webfeedback";
    if (!feedParams) {
        layer.msg(errMsg[0], {shift: 6});
        return;
    }
    // var index = layer.open({
    //     type: 2,
    //     title: false,
    //     shadeClose: true,
    //     closeBtn: true,
    //     scrollbar: true,
    //     area: ['980px', '720px'],
    //     content: [url],
    //     success: function(layero, index){
    //
    //     }
    // });
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

    // postForm.target = 'layui-layer-iframe'+ index;
    postForm.target =  "_blank";
    document.body.appendChild(postForm);
    postForm.submit();
    document.body.removeChild(postForm);
});

//表单对象、post提交
function postForm(url,p) {
    var params = !p ? ssoParams : p;
    if (!params) {
        layer.msg(errMsg[0], {shift: 6});
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

    document.body.appendChild(postForm);
    postForm.submit();
    document.body.removeChild(postForm);
}

//点击帮助中心
$('.helpLink').click(function (e) {
    layer.open({
        type: 2,
        title: false,
        shadeClose: true,
        closeBtn: true,
        scrollbar: false,
        area: ['1000px', '600px'],
        content: '/generic/help.html'
    });
});

//点击个人资料
$('.myInfor').click(function (e) {
    layer.open({
        type: 2,
        title: false,
        shadeClose: true,
        closeBtn: true,
        scrollbar: false,
        area: ['370px', '388px'],
        content: ['/user/index.html', 'no']
    });
});

//点击皮肤
$('.skinLink').on('click', function () {
    //获取背景图
    var backimgArr = backimg.split('^');
    var imgHtml = '';
    $.each(backimgArr, function (k, v) {
        imgHtml += '<a href="javascript:;"><img src="' + v + '" width="100" height="60"></a>';
    })
    layer.open({
        type: 1,
        id: 'backimg',
        title: '背景图片切换',
        shade: false,
        scrollbar: false,
        area: '524px',
        content: '<div class="skinCon clearfix">' + imgHtml + '</div>'
    });

    //改变背景图
    $('.skinCon a').on('click', function () {
        var img = $(this).find('img').attr('src');
        //替换大图
        img = img.replace('100x60_', '');
        //记录cookie
        Cookie.setCookie('bg_image', img, 30);
        $('body').css({
            'background-image': 'url(' + img + ')',
            'background-repeat': 'no-repeat',
            'background-size': '100% 100%'
        })
    });
});

//计算盒子宽高
function OnResize() {
    var cw = $(window).outerWidth(true);
    var headH =  $('.chatHead').outerHeight(true);
    var chatLeftW = $('.chatLeft').outerWidth(true);
    var chatBoxRW = $('.chatBoxR').outerWidth(true);
    var cH = $(window).outerHeight(true);
    var chatCenterW = $('.chatCenter').outerWidth(true);

    $('.chatRight').width(cw - chatLeftW);
    $('.chatCenter').width(cw - chatLeftW - chatBoxRW);
    $('#notice-scrollbox').width($('.chatCenter').width() - 290);

    var logoBoxH = $('.logoBox').outerHeight(true);
    var tabListH = $('.tabList').outerHeight(true);
    var chatBoxRH = $('.chatBoxR').outerHeight(true);
    var cpBannerH = $('.cpBanner').outerHeight(true);
    var lotTypeH = $('.lotType').outerHeight(true);
    var lotTitleH = $('.lotType').outerHeight(true);
    var toolBarH = $('.toolBar').outerHeight(true);

    $('.roomMain').height(cH);
    $('.userUl').height(cH - logoBoxH - tabListH - 80);
    $('.chatBoxR').css("height", cH - headH);
    var chatBoxRH = $('.chatBoxR').outerHeight(true);
    var lotListH = chatBoxRH - cpBannerH - lotTypeH - lotTitleH - 290 - 10;

    $('.lotList').height(lotListH);


    // if( lotListH < 140 ){
    //     $('.lotList').height(140);
    // };

    // 中间内容
    $('.msgBox').height(chatBoxRH - toolBarH - 40 - 20 - 90);

    //console.log(toolBarH);
}

$("#chatTxt").emoji({
        showTab: true,
        animation: 'fade',
        icons: [
            {
                name: "表情",
                path: "/room/dist/img/tieba2/",
                maxNum: 50,
                file: ".png",
                placeholder: "{alias}",
                alias: {
                    1: "1f60a",
                    2: "1f60b",
                    3: "1f60c",
                    4: "1f60d",
                    5: "1f60e",
                    6: "1f60f",
                    7: "1f61a",
                    8: "1f61b",
                    9: "1f61c",
                    10:"1f61d",
                    11:"1f61e",
                    12:"1f61f",
                    13:"1f62a",
                    14:"1f62b",
                    15:"1f62c",
                    16:"1f62d",
                    17:"1f62e",
                    18:"1f62f",
                    19:"1f600",
                    20:"1f601",
                    21:"1f602",
                    22:"1f603",
                    23:"1f604",
                    24:"1f605",
                    25:"1f606",
                    26:"1f607",
                    27:"1f608",
                    28:"1f609",
                    29:"1f610",
                    30:"1f611",
                    31:"1f612",
                    32:"1f613",
                    33:"1f614",
                    34:"1f615",
                    35:"1f616",
                    36:"1f617",
                    37:"1f618",
                    38:"1f619",
                    39:"1f620",
                    40:"1f621",
                    41:"1f622",
                    42:"1f623",
                    43:"1f624",
                    44:"1f625",
                    45:"1f626",
                    46:"1f627",
                    47:"1f628",
                    48:"1f629",
                    49:"1f630",
                    50:"1f631"
                },
                title: {
                    1: "",
                    2: "",
                    3: "",
                    4: "",
                    5: "",
                    6: "",
                    7: "",
                    8: "",
                    9: "",
                    10: "",
                    11: "",
                    12: "",
                    13: "",
                    14: "",
                    15: "",
                    16: "",
                    17: "",
                    18: "",
                    19: "",
                    20: "",
                    21: "",
                    22: "",
                    23: "",
                    24: "",
                    25: "",
                    26: "",
                    27: "",
                    28: "",
                    29: "",
                    30: "",
                    31: "",
                    32: "",
                    33: "",
                    34: "",
                    35: "",
                    36: "",
                    37: "",
                    38: "",
                    39: "",
                    40: "",
                    41: "",
                    42: "",
                    43: "",
                    44: "",
                    45: "",
                    46: "",
                    47: "",
                    48: "",
                    49: "",
                    50: ""
                }
        }]
    });

