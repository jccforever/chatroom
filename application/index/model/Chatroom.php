<?php

namespace app\index\model;

use think\Model;
use think\Request;

class Chatroom extends Model
{
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    public function roomInfo($site)
    {
        //房间列表
        $list = Chatroom::all(function ($query) {
            $query->where(['status' => 'normal'])->order('weigh desc');
        });

        if ($list) {
            $list = collection($list)->toArray();
        }

        //获取房间room_id
        $room_id = Request::instance()->param('room_id');
        if (!$room_id)
            $room_id = $list[0]['roomnumber'];

        //获取房间id
        $curRoom = ['icon' => '/images/avatar.png'];
        foreach ($list as $k => $room) {
            if ($room['roomnumber'] == $room_id) {
                $chat_id = $room['id'];
                $curRoom['name'] = $room['name'];
                $curRoom['icon'] = $room['img'];
                $curRoom['code']  = $room['roomnumber'];
            }
        }

        //获取公告
        $notic = getAdList(19, $chat_id);

        //客服
        $qq = Kf::all(['roomid' => $chat_id]);
        if ($qq) {
            $qq = collection($qq)->toArray();
        }

       foreach($qq as $qqk => $qqv){
            $qq[$qqk]['link'] = $qqv['qq_key'] ? 'http://wpa.b.qq.com/cgi/wpa.php?ln=1&key='.$qqv['qq_key'] :'tencent://message/?uin='.$qqv['qq'].'&Site=qq&menu=yes';
       }

        //背景图
        $h5skin = isset($site['h5skin']) ? $site['h5skin'] : '';
        $pcskin = isset($site['pcskin']) ? $site['pcskin'] : '';
        $backimg = isMobile() ? $h5skin : $pcskin;
        $bg_default = isset($backimg[0]) ? $backimg[0] : '';

        if($backimg){
            foreach ($backimg as $k => $v) {
               $imgInfo = pathinfo($v);
               if(isset($imgInfo['dirname'])){
                   $backimg[$k] = $imgInfo['dirname'] . '/100x60_' . $imgInfo['basename'];
               }
            }
        }

        //预测模块
        $funblock = Funblock::all(['room_id' => $room_id]);
        if ($funblock) {
            $funblock = collection($funblock)->toArray();
        }

        //seo
        $seo = config('room.'.$room_id);

        return [
            'notice' => $notic,
            'qq' => $qq,
            'bg_default' => $bg_default,
            'backimg' => $backimg,
            'room_id' => $room_id,
            'room' => $list,
            'curRoom' => $curRoom,
            'funblock' => $funblock,
            'seo'   => $seo
        ];
    }
}
