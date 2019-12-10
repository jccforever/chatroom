<?php

namespace app\api\controller;

use app\common\ApiBase;
use think\Response;

class Generic extends ApiBase
{
    /**
     * 初始化用户信息
     */
    public function userInit()
    {
        return $this->response($this->saveUser());
    }

    /**
     * 获取聊天记录
     * @return \think\response\Json
     */
    public function chatLog()
    {
        $room_id = $this->request->param('room_id');
        $filter = $this->request->param('filter');
        $page = (int)$this->request->param('page');
        $page_size = $this->request->param('page_size');
        $last_id = (int)$this->request->param('last_id');
        $this->user = $this->getUserInfo();

        if (!isset($room_id) || !isset($page))
            return $this->response(101);

        $chat_log = model('chatlog')->chatlog($room_id, $page, $this->site['say_filter'], $this->user, $filter, $page_size,$last_id);

        return $this->response($chat_log);
    }

    /**
     * 在线会员列表
     * @return string|\think\response\Json
     */
    public function onlineUser()
    {
        $room_id = $this->request->param('room_id');
        $page = (int)$this->request->param('page') <= 1 ? 0 : (int)$this->request->param('page');
        $page_size = (int)$this->request->param('page_size');

        $now_time = date('H:i:s');
        $date = date('N');

        $loginInfo = $this->getUserInfo();
        $redis = redis_handler();

        //获取机器人、管理员
        $chat_id = db('chatroom')->where(['roomnumber' => $room_id])->value('id');

        $where = [
            'room_id' => $chat_id,
            'is_robot' => 1,
            'status' => 'normal',
        ];

        $_robot = model('user')
            ->field('id,nickname,avatar,group_id,logintime,isgag,up_week,down_time,up_time')
            ->where('group_id', '=', 2)
            ->whereOr($where)
            ->order('group_id desc,id desc')
            ->select() ?: [];

        //获取在线用户
        $onlineUser = $redis->sMembers('room_onlineUser');

        $robot = [];
        $tempIds = [];
        foreach ($_robot as $rk => $rv) {
            $up_week = explode(',', $rv['up_week']);
            if ($rv['group_id'] == 2 && in_array($rv['id'], $onlineUser) ||
                ($rv['up_time'] < $now_time && $now_time < $rv['down_time'] && in_array($date, $up_week))
            ) {
                unset($rv['up_week'], $rv['up_time'], $rv['down_time']);
                $robot[] = $rv;
                $tempIds[] = $rv['id'];
            }
        }

        $onlineUser2 = array_filter($onlineUser);
        foreach($onlineUser2 as $uk => $uv){
            if(in_array($uv, $tempIds)){
                unset($onlineUser2[$uk]);
            }
        }

        $map = ['status' => 'normal', 'is_robot' => 0, 'id' => ['in', $onlineUser2]];
        $user = model('user')
            ->field('id,nickname,avatar,group_id,logintime,isgag')
            ->where($map)
            ->order('logintime asc')
            ->limit(1000)
            ->select() ?: [];

        $users = array_merge($robot, $user);

        //获取游客
        $CacheName = $redis->sMembers('room_yourName') ?: [];
        if ($CacheName) {
            foreach ($CacheName as $k => $v) {
                $arr['id'] = $v;
                $arr['nickname'] = '游客' . $v;
                $arr['avatar'] = getUserFace();
                $arr['group_id'] = 0;
                $arr['isgag'] = 0;
                $arr['logintime'] = 0;
                $users[] = $arr;
            }
        }

        $followUser = [];
        if ($loginInfo) {
            //获取我关注的人
            $followUser = db('follow')->where('user_id', $loginInfo['id'])->column('follow_id') ?: [];
        }

        if ($users) {
            $logintime = $group_id = $follow = $isMe = [];
            foreach ($users as $k => $v) {
                $users[$k]['avatar'] = getUserFace($v['avatar']);
                //是否关注
                $is_follow = in_array($v['id'], $followUser) && $v['group_id'] == 1  || $v['group_id'] == 2 ? 1 : 0;
                $users[$k]['is_follow'] = $is_follow;
                $follow[] = $is_follow;
                $logintime[] = $v['logintime'];
                $group_id[] = $v['group_id'];
                if ($loginInfo) {
                    $isMe[] = $v['id'] == $loginInfo['id'] ? 1 : 0;
                } else {
                    $isMe[] = 0;
                }
                unset($users[$k]['logintime']);
            }
            //排序禁言状态>用户组>时间
            array_multisort($group_id, SORT_DESC, $isMe, SORT_DESC, $follow, SORT_DESC, $logintime, SORT_ASC, $users);
        }
        $_users = array_slice($users, $page * $page_size , $page_size);
        return $this->response($_users);
    }

    /**
     * 进入聊天室欢迎语
     */
    public function joinRoom()
    {
        $this->user = $this->getUserInfo();

        //判断是否在其他端登录
        if (!is_object($this->user) && !is_array($this->user) && $this->user == -1)
            exit($this->response(103)->send());

        $redis = redis_handler();
        $data = [];
        if (isset($this->user['id'])) {
            //保存在线状态
            $redis->sAdd('room_onlineUser', $this->user['id']);
            $data = [
                'id'        => $this->user['id'],
                'nickname'  => $this->user['nickname'],
                'isgag'     => $this->user['isgag'],
                'avatar'    => getUserFace($this->user['avatar']),
                'group_id'  => $this->user['group_id'],
                'token'     => $this->user['token'],
                'chat_time' => time(),
                'pf'=> $this->request->param('pf')
            ];
        } else {
            //游客
            if($device_id = $this->request->param("device_id")){
                $visitor_id = $redis->get('visitor:' . $device_id);
                if (!$visitor_id) {
                    $visitor_id = substr(strtoupper(md5(time() . rand(1, 9999))), 0, 8);
                    $redis->setex('visitor:' . $device_id, 24*3600, $visitor_id);
                }

                $redis->sAdd('room_yourName' . date('Y-m-d'), $visitor_id);
                if($redis->sCard('room_yourName' . date('Y-m-d')) < 2){
                    $redis->expire('room_yourName' . date('Y-m-d'), 3600 * 24);
                }

                $data = [
                    'id'        => $visitor_id,
                    'nickname'  => '游客' . $visitor_id,
                    'isgag'     => 0,
                    'avatar'    => getUserFace(),
                    'group_id'  => 0,
                    'chat_time' => time(),
                    'token'     => '',
                    'pf'=> $this->request->param('pf')
                ];
            }
        }

        if(isset($data)){
            //十分钟只推一次sayHello
            $display = 0;
            if(!$redis->get('join_room_sayhello:' . $data['id'])){
                $display = 1;
                $redis->setex('join_room_sayhello:' . $data['id'], 600, time());
            }
            
            $opt = [
                'topic' => 'pyjy/allroom/chat',
                'payload' => [
                    'action' => 'sayHello',
                    'data' => $data,
                    'dataType' => 'text',
                    'status' => '1',
                    'display' => $display,
                ],
                'clientid' => md5(time() . $data['id'])
            ];

            mqttPub($opt);
        }
        return $this->response(['payload' => $data]);
    }

    /**
     * 获取被永久屏蔽用户id
     * @return string|\think\response\Json
     */
    public function forbids(){
        $forbids = model('user')->where('isgag', '=', 1)->column('id') ?: [];
        return $this->response($forbids);
    }

    /**
     * 空操作
     * @param $name
     * @return mixed
     */
    public function _empty($name)
    {
       return Response::create()->code(404);
    }
}
