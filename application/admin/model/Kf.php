<?php

namespace app\admin\model;

use think\Model;

class Kf extends Model
{
    // 表名
    protected $name = 'kf';
    
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = false;
    
    // 追加属性
    protected $append = [

    ];
    

    public function chatroom()
    {
        return $this->belongsTo('chatroom', 'roomid')->setEagerlyType(0);
    }







}
