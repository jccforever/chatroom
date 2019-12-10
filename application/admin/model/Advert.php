<?php

namespace app\admin\model;

use think\Model;

class Advert extends Model
{
    // 表名
    protected $name = 'advert';
    
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = false;
    
    // 追加属性
    protected $append = [
        'online_time_text',
        'end_time_text'
    ];
    
    public function chatroom()
    {
        return $this->belongsTo('chatroom', 'roomid')->setEagerlyType(0);
    }
    
    public function category()
    {
        return $this->belongsTo('app\common\model\Category', 'class_id')->setEagerlyType(0);
    }

    public function getOnlineTimeTextAttr($value, $data)
    {
        $value = $value ? $value : $data['online_time'];
        return is_numeric($value) ? date("Y-m-d H:i:s", $value) : $value;
    }


    public function getEndTimeTextAttr($value, $data)
    {
        $value = $value ? $value : $data['end_time'];
        return is_numeric($value) ? date("Y-m-d H:i:s", $value) : $value;
    }

    protected function setOnlineTimeAttr($value)
    {
        return $value && !is_numeric($value) ? strtotime($value) : $value;
    }

    protected function setEndTimeAttr($value)
    {
        return $value && !is_numeric($value) ? strtotime($value) : $value;
    }


}
