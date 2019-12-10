<?php

namespace app\index\model;

use think\Model;
use think\Request;
use think\Db;
use think\Cookie;
class Chatlog extends Model
{
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    /**
     * 获取聊天记录
     * @param $room_id
     * @param $chat_time
     * @param $log_page
     * @param $page
     * @param $say_filter
     * @return array|false|static[]
     */
    public function chatlog($room_id, $page = 1, $say_filter, $loginInfo, $ismobile = false,$msg_id='')
    {
        $chat_time = config('room.room_chatTime');
        $log_page = config('room.room_logPage');

        $w = [
            'c.room_id' => $room_id,
            'c.status' => 'normal',

        ];

        if($msg_id){
            $msg = db('chatlog')->where(['msg_id' => $msg_id])->find();
            $w['c.id'] = ['lt', $msg['id']];
            $list = db('chatlog')->where($w)->alias('c')
                ->join('__USER__ u', 'u.id = c.user_id', 'LEFT')
                ->field('c.*,u.avatar,u.nickname,u.group_id,u.isgag')
                ->order('c.id desc')
                ->limit($log_page)
                ->select();
        }else{
            $w['c.chat_time'] = ['gt', $chat_time];
            $list = db('chatlog')->where($w)->alias('c')
                ->join('__USER__ u', 'u.id = c.user_id', 'LEFT')
                ->field('c.*,u.avatar,u.nickname,u.group_id,u.isgag')
                ->order('c.id desc')
                ->page($page, $log_page)
                ->select();
        }

        $followUser = [];
        $isToUser = false;
        if ($loginInfo) {
            //获取我关注的人
            $followUser = db('follow')->where('user_id', $loginInfo['id'])->column('follow_id');
            $toUser = cookie('toUser') ? : '';
            if(in_array($room_id, explode(',', $toUser))){
                $isToUser = true;
            }
        }
        $chat_log = [];
        $last_msg_id = '';
        if($list){
            $chat_log = array_reverse($list);

            $last_msg_id = $msg_id ? $chat_log[0]['msg_id'] : '';
            //过滤敏感词
            foreach ($chat_log as $k => $v) {
                $content = urldecode($v['content']);
                if ($v['group_id'] != 2){
                    $res = filter($content, '/(' . $say_filter . ')/', $v['group_id']);
                    $chat_log[$k]['content'] = htmlspecialchars_decode($res['content']);
                }else{
                    $chat_log[$k]['content'] = htmlspecialchars_decode($content);
                }

                if($v['user_type'] == 0){
                    $chat_log[$k]['nickname'] = '游客'.$v['user_id'];
                }

                $chat_log[$k]['avatar'] = getUserFace($v['avatar']);
                //是否关注
                $is_follow = in_array($v['user_id'], $followUser) ? 1 : 0;
                $chat_log[$k]['is_follow'] = $is_follow;
                //是否只看关注的人
                $chat_log[$k]['is_hidden'] = ($isToUser && $is_follow == 0 && $v['group_id'] < 2 && $loginInfo['id'] != $v['user_id']) ? 1 : 0;
                $chat_log[$k]['img_layer_class'] = strpos($chat_log[$k]['content'], 'uploadImg') !== false ?'layim_chatsay2':'';
                $chat_log[$k]['group_id'] = intval($v['group_id']);
                $chat_log[$k]['isgag'] = intval($v['isgag']);
            }
        }

        return ['chat_log' => $chat_log , 'followUser' => $followUser, 'msg_id' => $last_msg_id];
    }
}
