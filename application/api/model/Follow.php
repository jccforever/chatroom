<?php

namespace app\api\model;

use think\Model;
use think\Request;
use think\Db;
use think\Cookie;

class Follow extends Model
{
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

}
