<?php

// +----------------------------------------------------------------------
// | ThinkPHP [ WE CAN DO IT JUST THINK ]
// +----------------------------------------------------------------------
// | Copyright (c) 2006-2016 http://thinkphp.cn All rights reserved.
// +----------------------------------------------------------------------
// | Licensed ( http://www.apache.org/licenses/LICENSE-2.0 )
// +----------------------------------------------------------------------
// | Author: liu21st <liu21st@gmail.com>
// +----------------------------------------------------------------------
// [ 应用入口文件 ]
// 定义应用目录
define('APP_PATH', __DIR__ . '/../application/');

// 判断是否安装FastAdmin
if (!is_file(APP_PATH . 'admin/command/Install/install.lock'))
{
    header("location:./install.php");
    exit;
}
$host = explode('.', $_SERVER['HTTP_HOST']);
$domain = $host[count($host) - 2] . '.' . $host[count($host) - 1];
define('DOMAIN',$domain);
//session二级域名共享
ini_set('session.cookie_domain', DOMAIN);

// 加载框架引导文件
require __DIR__ . '/../thinkphp/start.php';
