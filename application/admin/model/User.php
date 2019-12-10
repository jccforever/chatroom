<?php

namespace app\admin\model;

use think\Model;

class User extends Model
{
    // 表名
    protected $name = 'user';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';
    // 定义时间戳字段名
    protected $createTime = 'jointime';
    protected $updateTime = '';
    protected $insert = ['joinip'];  

    protected function setJoinipAttr()
    {
        return request()->ip(0, true);
    }

    public function category()
    {
        return $this->belongsTo('app\common\model\Category', 'group_id')->setEagerlyType(0);
    }

    public function chatroom()
    {
        return $this->belongsTo('chatroom', 'room_id')->setEagerlyType(0);
    }
}
