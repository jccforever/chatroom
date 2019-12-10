define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'chat/advert/index',
                    add_url: 'chat/advert/add',
                    edit_url: 'chat/advert/edit',
                    del_url: 'chat/advert/del',
                    multi_url: 'chat/advert/multi',
                    table: 'advert',
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
                        {field: 'img', title: __('Img'), formatter: Table.api.formatter.image},
                        {field: 'chatroom.name', title: __('Roomid')},
                        {field: 'category.name', title: __('广告分类')},
                        {field: 'content', title: __('Content'), formatter: Controller.api.formatter.strreplace},
                        {field: 'url', title: __('Url')},
                        {field: 'createtime', title: __('Createtime'), formatter: Table.api.formatter.datetime},
                        {field: 'online_time', title: __('Online_time'), formatter: Table.api.formatter.datetime},
                        {field: 'end_time', title: __('End_time'), formatter: Table.api.formatter.datetime},
                        {field: 'asstatus', title: __('上架状态'), formatter: Controller.api.formatter.asstatus},
                        {field: 'status', title: __("Status"), 
                            formatter: Table.api.formatter.status, 
                            searchList: {'normal': __('正常'), 'hidden': __('禁用')}, 
                            style: 'min-width:80px;'
                        },
                        {field: 'sort', title: __('Sort')},
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
                strreplace: function(value, row, index){
                    if(value != null) 
                        var str =  value.length > 30 ? '...' : '';
                        return value.substring(0,30) + str;
                },
                asstatus:function (value, row, index){
                    var time = Math.round(new Date().getTime()/1000);
                    var asstatus = '';
                    if(row.online_time > time){
                        asstatus = '<span class="text-blue"><i class="fa fa-circle"></i> 未开始</span>';
                    }else if(row.end_time < time){
                        asstatus = '<span class="text-grey"><i class="fa fa-circle"></i> 已结束</span>';
                    }else{
                        asstatus = '<span class="text-success"><i class="fa fa-circle"></i> 进行中</span>';
                    }
                    return asstatus;
                },
            }
        }
    };
    return Controller;
});