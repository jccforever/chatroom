<?php

// +----------------------------------------------------------------------
// | ThinkPHP [ WE CAN DO IT JUST THINK ]
// +----------------------------------------------------------------------
// | Copyright (c) 2006~2016 http://thinkphp.cn All rights reserved.
// +----------------------------------------------------------------------
// | Licensed ( http://www.apache.org/licenses/LICENSE-2.0 )
// +----------------------------------------------------------------------
// | Author: liu21st <liu21st@gmail.com>
// +----------------------------------------------------------------------
use think\Route;

//如果有定义绑定后台模块则禁用路由规则 
if (Route::getBind('module') == 'admin')
    return [];

return [
    '__pattern__' => [
        'name' => '\w+',
    ],
    '[hello]' => [
        ':id' => ['index/hello', ['method' => 'get'], ['id' => '\d+']],
        ':name' => ['index/hello', ['method' => 'post']],
    ],

    //用户控制器
    'user/:action' => 'index/User/:action',
    'chat/:action' => 'index/Index/:action',
    'generic/:action' => 'index/Generic/:action',
    'mchat/:action' => 'index/Mobile/:action',
//    'room/:action' => 'index/Index/index',
//    'mroom/:action' => 'index/Mobile/index',

    //房间号码
    'room/:room_id' => 'index/Index/index',
    'mroom/:room_id' => 'index/Mobile/index',

    //域名绑定到模块
//    '__domain__'  => [
//       'm' => [
//           'room/:room_id' => 'index/Mobile/index',
//           'chat/:action'  => 'index/Mobile/:action',
//           '/'=>'index/Mobile/index',
//           ],
//    ],

];
