define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'chat/schatlog/index',
                    add_url: 'chat/schatlog/add',
                    edit_url: 'chat/schatlog/edit',
                    del_url: 'chat/schatlog/del',
                    multi_url: 'chat/schatlog/multi',
                    table: 'chatlog',
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                searchFormVisible: true,
                sortName: 'id',
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id'), operate: false},
                        {
                            field: 'content',
                            cellStyle: function () {
                                return {css: {"max-width": "250px", "text-align": "left !important","word-wrap":"break-word", "overflow":"hidden"}}
                            },
                            title: __('Content'),
                            operate: false,
                            events: Controller.api.events.chatlog,
                            formatter: Controller.api.formatter.chatlog
                        },
                        {
                            field: 'room_id',
                            title: __('房间号'),
                            searchList: {
                                'pk10': __('北京赛车PK10'),
                                'cqssc': __('重庆时时彩'),
                                'xyft': __('幸运飞艇'),
                                'xync': __('幸运农场'),
                                'fc3d': __('福彩3D'),
                                'gd11x5': __('广东十一选五'),
                                'gdkl10': __('广东快乐十分'),
                                'jsk3': __('江苏快3'),
                                'jx11x5': __('江西十一选五'),
                                'kl8': __('北京快乐8'),
                                'pl3': __('排列3'),
                                'sd11x5': __('山东十一选5'),
                                'sdc': __('圣地彩'),
                                'shssl': __('上海时时乐'),
                                'tjssc': __('天津时时彩'),
                                'xjssc': __('新疆时时彩')
                            },
                            style: 'min-width:100px;'
                        },
                        {field: 'user.username', title: __('用户名'), operate: 'LIKE %...%'},
                        {
                            field: 'chat_time',
                            title: __('发言时间'),
                            operate: false,
                            formatter: Table.api.formatter.datetime
                        },
                        {
                            field: 'user.isgag',
                            title: __('禁言'),
                            formatter: Controller.api.formatter.isgag,
                            searchList: {'1': __('是'), '0': __('否')}
                        },
                        {
                            field: 'user.status',
                            title: __('黑名单'),
                            formatter: Controller.api.formatter.u_status,
                            searchList: {'hidden': __('是'), 'normal': __('否')}
                        },
                        {
                            field: 'status',
                            title: __('消息状态'),
                            formatter: Controller.api.formatter.status,
                            searchList: {'normal': __('正常'), 'hidden': __('已屏蔽')},
                            style: 'min-width:100px;'
                        },

                        {
                            field: 'operate',
                            title: __('Operate'),
                            table: table,
                            events: Table.api.events.operate,
                            formatter: Table.api.formatter.operate
                        }
                    ]
                ]
            });

            // 为表格绑定事件
            Table.api.bindevent(table);

            //禁言项
            $(document).on("click", ".btn-forbid", function () {
                var ids = [];
                var userids = [];
                $.each(table.bootstrapTable("getAllSelections"), function (i, j) {
                    ids.push(j.id);
                    userids.push(j.user_id);
                });

                $.post('chat/schatlog/forbid', {ids: ids.join(','), userids: userids.join(',')}, function (ret) {
                    ret = Fast.events.onAjaxResponse(ret);
                    if (ret.code === 1) {
                        Fast.events.onAjaxSuccess(ret);
                        table.bootstrapTable('refresh');
                    } else {
                        Fast.events.onAjaxError(ret);
                    }
                });
            });

            //屏蔽项
            $(document).on("click", ".btn-hidden", function () {
                var ids = [];
                $.each(table.bootstrapTable("getAllSelections"), function (i, j) {
                    ids.push(j.id);
                });

                $.post('chat/schatlog/hidden', {ids: ids.join(',')}, function (ret) {
                    ret = Fast.events.onAjaxResponse(ret);
                    if (ret.code === 1) {
                        Fast.events.onAjaxSuccess(ret);
                        table.bootstrapTable('refresh');
                    } else {
                        Fast.events.onAjaxError(ret);
                    }
                });
            });

        },
        add: function () {
            Controller.api.bindevent();
        },
        edit: function () {
            Controller.api.bindevent();
        },
        api: {
            bindevent: function () {
                Form.api.bindevent($("form[role=form]"));
            },
            formatter: {
                chatlog: function (value, row, index) {
                    return row.content+'<a href="javascript:;" class="openlog"><span style="color:red">浏览</span></a>';
                },
                isgag: function (value, row, index) {
                    var color = value == 1 ? 'red' : 'success';
                    var s = value == 1 ? '是' : '否';
                    //渲染状态
                    var html = '<span class="text-' + color + '">' + s + '</span>';
                    return html;
                },
                u_status: function (value, row, index) {
                    var color = value == 'hidden' ? 'red' : 'success';
                    var s = value == 'hidden' ? '是' : '否';
                    //渲染状态
                    var html = '<span class="text-' + color + '">' + s + '</span>';
                    return html;
                },
                status: function (value, row, index) {
                    var c = 'black';
                    var s = '正常';
                    if (value == 'hidden') {
                        s = '已屏蔽';
                        c = 'success';
                    }
                    var html = '<span class="text-' + c + '">' + s + '</span>';
                    return html;
                },
            },
            events: {//绑定事件的方法
                chatlog: {
                    'click .openlog': function (e, value, row, index) {
                        e.stopPropagation();
                        layer.open({
                            type: 1,
                            closeBtn: true,
                            scrollbar: true,
                            area: 'auto',
                            maxWidth: '1600',
                            maxHeight: '760',
                            content: row.content
                        });
                    }
                },
            }
        }
    };
    return Controller;
});