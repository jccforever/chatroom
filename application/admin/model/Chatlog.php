<?php

namespace app\admin\model;

use think\Model;

class Chatlog extends Model
{
    // 表名
    protected $name = 'chatlog';
    
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = false;

    // 定义时间戳字段名
    protected $createTime = false;
    protected $updateTime = false;
    
    // 追加属性
    protected $append = [
        'chat_time_text'
    ];

    public function getChatTimeTextAttr($value, $data)
    {
        $value = $value ? $value : $data['chat_time'];
        return is_numeric($value) ? date("Y-m-d H:i:s", $value) : $value;
    }

    protected function setChatTimeAttr($value)
    {
        return $value && !is_numeric($value) ? strtotime($value) : $value;
    }

    public function user()
    {
        return $this->belongsTo('user', 'user_id')->setEagerlyType(0);
    }

}
