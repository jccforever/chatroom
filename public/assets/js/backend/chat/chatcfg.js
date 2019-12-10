define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'chat/chatcfg/index',
                    add_url: 'chat/chatcfg/add',
                    edit_url: 'chat/chatcfg/edit',
                    del_url: 'chat/chatcfg/del',
                    multi_url: 'chat/chatcfg/multi',
                    table: 'chatcfg',
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
                        {field: 'name', title: __('Name')},
                        {field: 'group', title: __('Group')},
                        {field: 'title', title: __('Title')},
                        {field: 'tip', title: __('Tip')},
                        {field: 'type', title: __('Type')},
                        {field: 'rule', title: __('Rule')},
                        {field: 'extend', title: __('Extend')},
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