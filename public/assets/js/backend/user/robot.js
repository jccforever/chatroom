define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'user/robot/index',
                    add_url: 'user/robot/add',
                    edit_url: 'user/robot/edit',
                    del_url: 'user/robot/del',
                    multi_url: 'user/robot/multi',
                    table: 'robot',
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id'),operate: false},
                        {field: 'avatar', title: __('Avatar'),operate: false,formatter: Table.api.formatter.image},
                        {field: 'nickname', title: __('Nickname'),operate: 'LIKE %...%'},
                        {field: 'chatroom.name', title: __('Roomid'),operate: 'LIKE %...%'},
                        {field: 'group_id', title: __('用户组'),
                            formatter: Controller.api.formatter.group_name,
                            searchList: {'0': '游客', '1': '会员','2': '管理员'},
                            style: 'min-width:80px;'
                        },
                        {field: 'up_week', title: __('Up_week'),operate: false},
                        {field: 'up_time', title: __('Up_time'),operate: false},
                        {field: 'down_time', title: __('Down_time'),operate: false},
                        {field: 'status', title: __("Status"),
                            formatter: Controller.api.formatter.status,
                            searchList: {'normal': __('正常'), 'hidden': '黑名单'},
                            style: 'min-width:80px;',
                        },
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ]
            });

            // 为表格绑定事件
            Table.api.bindevent(table);
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
            formatter:{
                group_name: function (value, row, index) {
                    switch(parseInt(value)){
                        case 0: var group_name = '游客';break;
                        case 1: var group_name = '会员';break;
                        case 2: var group_name = '管理员';break;
                    }
                    //渲染状态
                    var html = '<span>'+group_name+'</span>';
                    return html;
                },
                status:function (value, row, index) {
                    var color = value == 'hidden' ? 'red' : 'success';
                    var isgag = value == 'hidden' ? '黑名单' : '正常';
                    //渲染状态
                    var html = '<span class="text-' + color + '">'+isgag+'</span>';
                    return html;
                }
            }
        }
    };
    return Controller;
});