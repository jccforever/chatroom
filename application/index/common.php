<?php
use think\Db;

function tencent_qq($qq){
    return 'tencent://message/?uin='.$qq.'&Site=qq&menu=yes';
}

function redis_handler(){
	return (new \think\cache\driver\Redis(config('cache')))->handler();
}