define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {
    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'chat/chatlog/index',
                    add_url: 'chat/chatlog/add',
                    edit_url: 'chat/chatlog/edit',
                    del_url: 'chat/chatlog/del',
                    multi_url: 'chat/chatlog/multi',
                    table: 'chatlog',
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                searchFormVisible: true,
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id'), operate: false},
                        {
                            field: 'user.nickname',
                            title: __('用户昵称'),
                            operate: 'LIKE %...%',
                            events: Controller.api.events.nickname,
                            formatter: Controller.api.formatter.nickname
                        },
                        {
                            field: 'user.username',
                            title: __('用户名'),
                            operate: 'LIKE %...%',
                        },
                        {field: 'room_id', title: __('房间'), operate: 'LIKE %...%'},
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
                            field: 'chat_time',
                            title: __('发言时间'),
                            formatter: Table.api.formatter.datetime,
                            operate: 'BETWEEN',
                            type: 'datetime',
                            addclass: 'datetimepicker',
                            data: 'data-date-format="YYYY-MM-DD"'
                        },
                        {
                            field: 'user.isgag',
                            title: __('禁言'),
                            formatter: Controller.api.formatter.isgag,
                            searchList: {'1': __('是'), '0': __('否')},
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
                        },
                        //     {
                        //     field: 'operate', title: __('Operate'), table: table, buttons: [
                        //         {
                        //             name: 'detail',
                        //             text: '详情',
                        //             title: '详情',
                        //             icon: 'fa fa-list',
                        //             classname: 'btn btn-xs btn-primary btn-dialog',
                        //             url: 'page/detail'
                        //         }
                        //     ], events: Table.api.events.operate, formatter: Table.api.formatter.operate
                        // }
                    ]
                ]
            });

            // 为表格绑定事件
            Table.api.bindevent(table);

            //初始查询条件
            $(document).ready(function () {
                if(username){
                    $("input[ name='user.username' ] ").val(username);
                    table.bootstrapTable('refresh', {});
                }

            });
            //禁言项
            $(document).on("click", ".btn-forbid", function () {
                var ids = [];
                var userids = [];
                $.each(table.bootstrapTable("getAllSelections"), function (i, j) {
                    ids.push(j.id);
                    userids.push(j.user_id);
                });

                $.post('chat/chatlog/forbid', {ids: ids.join(','), userids: userids.join(',')}, function (ret) {
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

                $.post('chat/chatlog/hidden', {ids: ids.join(',')}, function (ret) {
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
                nickname: function (value, row, index) {
                    //.substring(0, 50)
                    return '<a href="javascript:;" class="userInfo">' + row.user.nickname +'</a>';
                },
                isgag: function (value, row, index) {
                    var color = value == 1 ? 'red' : 'success';
                    var s = value == 1 ? '是' : '否';
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
                            title:'内容浏览',
                            closeBtn: true,
                            scrollbar: true,
                            shadeClose: true,
                            shade: 0.3,
                            area: 'auto',
                            maxWidth: '1600',
                            maxHeight: '760',
                            content: row.content
                        });
                    }
                },
                nickname: {
                    'click .userInfo': function (e, value, row, index) {
                        e.stopPropagation();
                        layer.open({
                            type: 2,
                            title:'用户管理',
                            shadeClose: true,
                            closeBtn: true,
                            shade: 0.3,
                            scrollbar: true,
                            area: ['800px', '600px'],
                            content: ['/admin/user/user/edit/ids/'+row['user_id']],
                        });
                    }
                },
            }
        }
    };
    return Controller;
});