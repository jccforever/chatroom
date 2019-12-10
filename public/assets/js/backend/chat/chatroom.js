define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'chat/chatroom/index',
                    add_url: 'chat/chatroom/add',
                    edit_url: 'chat/chatroom/edit',
                    del_url: 'chat/chatroom/del',
                    multi_url: 'chat/chatroom/multi',
                    table: 'chatroom',
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
                        {field: 'id', title: __('Id')},
                        {field: 'name', title: __('Name'), operate: 'LIKE %...%'},
                        {field: 'roomnumber', title: __('房间号码'), operate: 'LIKE %...%'},
                        {field: 'img', title: __('Img'), operate: false, formatter: Table.api.formatter.image},
                        {field: 'weigh', title: __('权重'), operate: false},
                        {
                            field: 'status', title: __("Status"),
                            formatter: Table.api.formatter.status,
                            searchList: {'normal': __('正常'), 'hidden': __('禁用')},
                            style: 'min-width:80px;'
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
            }
        }
    };
    return Controller;
});