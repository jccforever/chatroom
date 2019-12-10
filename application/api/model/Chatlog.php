<?php

namespace app\api\model;

use think\Model;

class Chatlog extends Model
{
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    /**
     * 获取聊天记录
     * @param $room_id
     * @param int $page
     * @param $say_filter
     * @param $loginInfo
     * @param int $filter
     * @return array
     */
    public function chatlog($room_id, $page = 1, $say_filter, $loginInfo, $filter = 0,$page_size=100,$last_id=0)
    {
        $chat_time = config('room.room_chatTime');

        if($last_id){
            $w['c.id'] = ['lt', $last_id];
        }else{
            $w['c.chat_time'] = ['gt', $chat_time];
        }

        //获取聊天记录
        $w = [
            'c.room_id' => $room_id,
            'c.status' => 'normal'
        ];

        //获取我关注的人
        if ($loginInfo && $filter == 1) {
            $followUser = db('follow')->where('user_id', $loginInfo['id'])->column('follow_id');
            $_followUser = $followUser;
            $_followUser[] = $loginInfo['id'];
            $adminUser = db('user')->where('group_id', 2)->column('id');
            $w['c.user_id'] = ['IN', array_unique(array_merge($adminUser, $_followUser))];
        }

        $list = model('chatlog')
            ->alias('c')
            ->join('__USER__ u', 'u.id = c.user_id', 'LEFT')
            ->where($w)
            ->field('c.*,u.avatar,u.nickname,u.group_id,u.isgag')
            ->order('c.id desc')
            ->page($page, $page_size)
            ->select();

        if ($list) {
            foreach ($list as $k => $v) {
                $content = urldecode($v['content']);
                if ($v['group_id'] != 2) {
                    $res = filter($content, '/(' . $say_filter . ')/', $v['group_id']);
                    $list[$k]['content'] = htmlspecialchars_decode($res['content']);
                } else {
                    $list[$k]['content'] = htmlspecialchars_decode($content);
                }

                if ($v['user_type'] == 0) {
                    $list[$k]['nickname'] = '游客' . $v['user_id'];
                }

                $list[$k]['avatar'] = getUserFace($v['avatar']);
                $list[$k]['isgag'] = intval($v['avatar']);
                $list[$k]['group_id'] = intval($v['group_id']);
            }
        }
        return $list;
    }
}
