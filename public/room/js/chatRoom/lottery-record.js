$(function () {
    var resData = null;

    //获取历史开奖数据
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
        var data = resData.slice(0, 10);
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
                    num += '<span style="background-color: ' + cl + '">' + nList[i] + '</span>';
                }

                lotHistory = '<tr> <td width="70">' + v.Period + '</td> <td width="90">' + dataStr + '</td> <td class="numSpan">' + num + '</td> </tr>';
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

                lotHistory = '<tr> <td width="70">' + v.Period + '</td> <td width="90">' + dataStr + '</td> <td class="numSpan">' + num + '</td> </tr>';
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
        return m + '-' + d + ' ' + h + ':' + minute;
    };

    //pk10切换tab
    $('.tabSpan span').on('click', function () {
        $(this).addClass('on').siblings().removeClass('on');
        var clickType = $(this).index();
        pk10Tab(clickType);
    });

    function pk10Tab(clickType) {
        var data = resData.slice(0, 10);
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
                            bgColor = 'singleBig';
                        }
                    } else {
                        if (n % 2 == 0) {
                            dataType = {1: '小', 2: '双'}
                        } else {
                            dataType = {1: '小', 2: '单'}
                        }
                    }
                    var bgColor = dataType[clickType] == '大' || dataType[clickType] == '单' ? 'singleBig' : 'doubleSmall';
                    numSpan += '<span class="' + bgColor + '">' + dataType[clickType] + '</span>';
                }
            } else if (clickType == 3) {//处理对子
                for (var i = 0; i <= nList.length - 1; i++) {
                    if (k - 1 >= 0) {
                        if (nList[i] == data[k - 1].NumberList[i]) {
                            numSpan += '<span class="num-' + nList[i] + '">' + nList[i] + '</span>';
                            $('#lotHistory tr').eq(k - 1).children('td.numSpan').find('span').eq(i).addClass("num-" + nList[i]);
                            continue;
                        }
                    }
                    numSpan += '<span>' + nList[i] + '</span>';
                }
            } else {
                for (var i = 0; i <= nList.length - 1; i++) {
                    numSpan += '<span class="num-' + nList[i] + '">' + nList[i] + '</span>';
                }
            }

            lotHistory = '<tr> <td width="70">' + v.Period + '</td> <td width="90">' + dataStr + '</td> <td class="numSpan">' + numSpan + '</td> </tr>';
            $("#lotHistory").append(lotHistory);

        });
    }

    /**
     * 广告
     */
    function adsList() {
        $.ajax({
            type: "get",
            async: false,
            dataType: 'jsonp',
            url: "https://a.591dyd.com/service/adjs?codes=cr_pc_bananer&format=json&website=78&jsoncallback=AddList",
            jsonp: "callback",
            jsonpCallback: "AddList",
            success: function (json) {
                if (json[0]['data'] != undefined) {
                    var adsHtml = '';
                    var activeHtml = '';
                    var indicators = '';
                    $.each(json[0]['data'], function (i, e) {
                        console.log(i);
                        var active = i == 0 ? 'active' : '';
                        adsHtml += '<div class="item ' + active + '"> <a href="' + e.url + '" target="_blank"><img src="' + e.image + '" width="456" height="155" alt=""></a></div>';
                        activeHtml += '<li data-target="#myCarousel" data-slide-to="' + i + '" class="' + active + '"></li>';

                    });

                    $(".carousel-indicators").prepend(activeHtml);
                    $(".carousel-inner").prepend(adsHtml);

                    // $('.carousel-inner .item').click(function (e) {
                    //     // window.location.href = $(this).find("a").attr('href');
                    //     var tmp = window.open();
                    //     tmp.moveTo(0, 0);
                    //     tmp.resizeTo(screen.width + 20, screen.height);
                    //     tmp.focus();
                    //     tmp.location = $(this).find("a").attr('href');
                    // })

                    $('#myCarousel').carousel({
                        interval: 6000
                    })
                }
            },
            error: function () {
                console.log('fail');
            }
        });
    }

    adsList();
    awardHistory();
    setInterval(awardHistory, 10000);
});
