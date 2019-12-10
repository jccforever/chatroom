define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'chat/kf/index',
                    add_url: 'chat/kf/add',
                    edit_url: 'chat/kf/edit',
                    del_url: 'chat/kf/del',
                    multi_url: 'chat/kf/multi',
                    table: 'kf',
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
                        {field: 'id', title: __('Id'),operate:false},
                        {field: 'chatroom.name', title: __('所属房间'),operate:'LIKE %...%'},
                        {field: 'name', title: __('Name'),operate:'LIKE %...%'},
                        {field: 'qq', title: __('Qq'),operate:'LIKE %...%'},
                        {field: 'createtime', title: __('Createtime'),operate:false, formatter: Table.api.formatter.datetime},
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