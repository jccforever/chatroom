define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'chat/funblock/index',
                    add_url: 'chat/funblock/add',
                    edit_url: 'chat/funblock/edit',
                    del_url: 'chat/funblock/del',
                    multi_url: 'chat/funblock/multi',
                    table: 'funblock',
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'weigh',
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('id')},
                        {field: 'room_name', title: __('房间名')},
                        {field: 'mode', title: __('模块标识')},
                        {field: 'name', title: __('模块名')},
                        {field: 'url', title: __('地址')},
                        {field: 'create_time', title: __('创建时间'), formatter: Table.api.formatter.datetime},
                        {field: 'weigh', title: __('排序')},
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