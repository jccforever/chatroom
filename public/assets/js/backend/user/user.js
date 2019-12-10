define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'user/user/index',
                    add_url: 'user/user/add',
                    edit_url: 'user/user/edit',
                    del_url: 'user/user/del',
                    multi_url: 'user/user/multi',
                    table: 'user',
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                searchFormVisible: true,
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id')},
                        {field: 'avatar', title: __('Avatar'), operate: false, formatter: Table.api.formatter.image},
                        // {field: 'username', title: __('Username'),operate: 'LIKE %...%'},
                        {field: 'nickname', title: __('Nickname'),operate: 'LIKE %...%'},
                        {field: 'mobile', title: __('Mobile'),operate: 'LIKE %...%'},
                        {field: 'group_id', title: __('用户组'),
                            formatter: Controller.api.formatter.group_name,
                            searchList: {'0': '游客', '1': '会员','2': '管理员'},
                            style: 'min-width:80px;'
                        },

                        // {field: 'coin', title: __('帐号余额'), operate: false},
                        // {field: 'score', title: __('Score'), operate: false},
                        {field: 'loginip', title: __('Loginip'), operate: false},
                        // {field: 'joinip', title: __('Joinip'), operate: false, formatter: Table.api.formatter.search},
                        {field: 'logintime', title: __('Logintime'), operate: false, formatter: Table.api.formatter.datetime},
                        {field: 'jointime', title: __('Jointime'), operate: false, formatter: Table.api.formatter.datetime},
                        {field: 'isgag', title: __("禁言"),
                            // formatter: Controller.api.formatter.isgag,
                            searchList: {'0': __('否'), '1': __('是')},
                            visible:false
                        },

                        {field: 'status', title: __("Status"),
                            // formatter: Table.api.formatter.status,
                            searchList: {'normal': __('正常'), 'hidden': __('黑名单')},
                            visible:false

                        },
                        {field: 'gag_num', title: __("禁言次数"),
                            operate: false,
                        },
                        {field: 'gag_time', title: __("禁言操作"),
                            formatter: Controller.api.formatter.gag_time,
                            operate: false,
                        },
                        {field: 'pan_time', title: __("拉黑操作"),
                            formatter: Controller.api.formatter.pan_time,
                            operate: false,
                        },
                        {
                            field: 'ipstatus',
                            title: __('其他操作'),
                            formatter: Controller.api.formatter.ipstatus,
                            searchList: {'normal': __('正常'), 'hidden': __('已屏蔽')},
                            style: 'min-width:100px;',
                            operate: false,
                        },
                        {field: 'operate', title: __('编辑'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ]
            });

            // 为表格绑定事件
            Table.api.bindevent(table);

            //屏蔽项
            $(document).on("click", ".btn-ajax-ip", function () {
                $.post($(this).attr('data-url'), {}, function (ret) {
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
            formatter:{
                gag_time: function (value, row, index) {
                    var html = '';
                    if(row.isgag == 1){
                        html +='<a href="javascript:()" data-url="/admin/user/user/gag/user_id/'+row.id+'/gag/0" class="btn btn-xs btn-danger   btn-ajax-ip" title="解除禁言" >解除禁言</a> &nbsp;&nbsp;<br/><span> 已禁言，操作员:<b>'+row.gag_operator+ '</b> ('+ value +')';
                    }else{
                        html +='<a href="javascript:()" data-url="/admin/user/user/gag/user_id/'+row.id+'/gag/1" class="btn  btn-xs btn-success btn-ajax-ip" title="立即禁言" >立即禁言</a> &nbsp;&nbsp;<br/>';
                        if(value){
                            html += '<span>  上次操作员:<b>'+row.gag_operator+ '</b> ('+ value +')';
                        }
                    }
                    return html;
                },

                pan_time: function (value, row, index) {
                    var html = '';
                    if(row.status == 'hidden'){
                        html +='<a href="javascript:()" data-url="/admin/user/user/pan/user_id/'+row.id+'/status/normal" class="btn btn-xs btn-primary   btn-ajax-ip" title="解除黑名单" >解除黑名单</a> &nbsp;&nbsp;<br/><span> 已拉黑，操作员:<b>'+row.pan_operator+ '</b> ('+ value +')';
                    }else{
                        html +='<a href="javascript:()" data-url="/admin/user/user/pan/user_id/'+row.id+'/status/hidden" class="btn  btn-xs btn-success btn-ajax-ip" title="加入黑名单" >加入黑名单</a> &nbsp;&nbsp;<br/>';
                        if(value){
                            html += '<span> 上次操作员:<b>'+row.pan_operator+ '</b> ('+ value +')';
                        }
                    }

                    return html;
                },

                isgag: function (value, row, index) {
                    var color = value == 1 ? 'red' : 'success';
                    var isgag = value == 1 ? '是' : '否';
                    //渲染状态
                    var html = '<span class="text-' + color + '">'+isgag+'</span>';
                    return html;
                },
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

                ipstatus: function (value, row, index) {
                    var html = '';

                    if(value){
                        html +='<a href="javascript:()" data-url="/admin/chat/chatlog/panip/user_id/'+row.id+'/type/2" class="btn btn-xs btn-danger  btn-ajax-ip" title="IP恢复" >IP恢复</a>&nbsp;&nbsp;';
                    }else{
                        html +='<a href="javascript:()" data-url="/admin/chat/chatlog/panip/user_id/'+row.id+'/type/1" class="btn  btn-xs btn-success btn-ajax-ip" title="IP拉黑" >IP拉黑</a>&nbsp;&nbsp;';
                    }

                    html += ' <a href="/admin/chat/chatlog?ref=addtabs&ids='+row.id+'"  class="btn btn-xs btn-info btn-addtabs" title="查看聊天记录" >查看聊天记录</a>';
                    return html;
                }
            },
        }
    };
    return Controller;
});