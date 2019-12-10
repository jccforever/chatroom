<?php

namespace app\index\controller;

use app\common\controller\Frontend;
use room\Emoji;
use think\Config;
use think\Db;
use think\Exception;
use fast\Random;

class Index extends Frontend
{
    protected $logPage = '';    //消息每页数量
    protected $chat_time = '';  //前一天00:00:00到现在的发言
    protected $close_start = '2:00';
    protected $close_end = '8:30';

    protected $opend_d_start = '2018-02-15';
    protected $opend_d_end = '2018-02-21';

    protected $opend_d_start_t = '14:00';
    protected $opend_d_end_t = '18:00';

    public function _initialize()
    {
        //不需要执行前置的方法
        if (!in_array($this->request->action(), ['mqttFilter'])) {
            parent::_initialize();
        }
    }

    /**
     * 首页
     * @return string
     */
    public function index()
    {
        //获取房间信息
        $room = Model('Chatroom')->roomInfo($this->site);
        //获取签到
        //$sign = Model('User')->sign($this->user, $this->site);
        //获取聊天记录
        $is_mobile = isMobile() || strpos($this->request->url(true), 'mchat.1391p.com');
        $chat_log = model('Chatlog')->chatlog($room['room_id'], 1, $this->site['say_filter'], $this->user, $is_mobile);

        //皇家会员中心参数
        $alnum = Random::alnum(10);
        $host = strpos($this->request->host(), '1391') !== false ? 'https://' . $this->request->host() : $this->request->domain();
        $plaintext = "callback_url={$host}/generic/ssoCallback/room_id/{$room['curRoom']['code']}|$|sc=chatroom" . $alnum;

        $sso_params = getSSOparams($plaintext);

        //问题反馈接口参数
        $guid = getSSOparams(randStr(8), 1, 'HKHJCHAT')['platform_params'];
        $feedback = ['code' => 'ChatRoom', 'guId' => $guid];
        if ($this->user) {
            $strInfo = getSSOparams(json_encode(['UserName' => $this->user['username']]), 1, 'HKHJCHAT')['platform_params'];
            $feedback['strUserInfo'] = $strInfo;
        }

        //新用户60秒才能发文字
        $openChat = 0;
        if (isset($this->user['id'])) {
            $openChat = intval($this->redis->get('new_user_open_chat:' . $this->user['id']));
        }

        //聊天室开放时间
        $time_open = 1;

        if (strtotime($this->close_start) < time() && time() < strtotime($this->close_end) && $this->user['group_id'] != 2) {
            $time_open = 0;
            $time_open_notice = '聊天室开放时间为' . $this->close_end . '-凌晨' . $this->close_start . '，休息是为了走更长的路！';
        }

        //春节期间
        if (time() > strtotime($this->opend_d_start) && time() < strtotime($this->opend_d_end) && $this->user['group_id'] != 2) {
            $time_open = 0;
            if (isset($room['curRoom']['code']) && $room['curRoom']['code'] == 'xyft') {
                $time_open = 1;
                if (time() < strtotime($this->opend_d_start_t) || strtotime($this->opend_d_end_t) < time()) {
                    $time_open = 0;
                    $time_open_notice = "聊天室开放时间为{$this->opend_d_start_t}-{$this->opend_d_end_t}，休息是为了走更长的路！";;
                }
            } else {
                $time_open_notice = "{$this->opend_d_start}至{$this->opend_d_end}该聊天室暂时关闭聊天功能，休息是为了走更长的路！";
            }
        }

        $this->assign('room', $room['room']);
        $this->assign('time_open', $time_open);
        $this->assign('time_open_notice', $time_open_notice);
        $this->assign('seo', $room['seo']);
        $this->assign('curRoom', $room['curRoom']);
        $this->assign('funblock', $room['funblock']);
        $this->assign('qq', $room['qq']);
        $this->assign('gonggao', $room['notice']);
        $this->assign('bg_default', $room['bg_default']);
        $this->assign('backimg', implode('^', $room['backimg']));
        $this->assign('new_user_openchat', $openChat);
        $this->assign('chat_log', $chat_log);

        $this->assign('mqtt', config('room.mqtt'));
        $this->assign('sso_params', $sso_params);
        $this->assign('feedParams', $feedback);
        $this->assign('sso_pre', config('room.sso_pre'));
        $this->assign('url_pre', 'http://' . $this->request->host());
        $this->assign('htt_surl', 'https://' . $this->request->host() . $this->request->url());

        $fetch = '';
        if ($is_mobile) {
            $s = $this->request->param('selected');
            $fetch = $s == 2 ? 'mobile/kaij' : 'mobile/index';
        }

        if ($this->request->param('mode') == 'test') {
            $fetch = 'index/test';
        }

        return $this->view->fetch($fetch);
    }

    /**
     * 在线会员列表
     * @return \think\response\Json
     */
    public function onlineUser()
    {
        action('generic/mqttPubUser');

        $room_id = $this->request->param('room_id');
        $now_time = date('H:i:s');
        $date = date('N');

        $loginInfo = $this->user;
        $redis = $this->redis;

        //获取机器人
        $chat_id = db('chatroom')->where(['roomnumber' => $room_id])->value('id');

        $where = [
            'room_id' => $chat_id,
            'is_robot' => 1,
            'status' => 'normal',
//            'up_time'   => ['lt', $now_time],
//            'down_time' => ['gt', $now_time],
//            'up_week'   => ['like', '%' . $date . '%'],
        ];

        $_robot = db('user')->field('id,nickname,avatar,group_id,logintime,isgag,up_week,down_time,up_time')
            ->where($where)
            ->order('group_id desc,id desc')
            ->select() ?: [];

        $robot = [];
        foreach ($_robot as $rk => $rv) {
            $up_week = explode(',', $rv['up_week']);
            if ($rv['up_time'] < $now_time && $now_time < $rv['down_time'] && in_array($date, $up_week)) {
                unset($rv['up_week'], $rv['up_time'], $rv['down_time']);
                $robot[] = $rv;
            }
        }

        //获取在线用户
        $onlineUser = $redis->sMembers('room_onlineUser');
        $map = ['status' => 'normal', 'is_robot' => 0, 'id' => ['in', $onlineUser]];
        $user = db('user')
            ->field('id,nickname,avatar,group_id,logintime,isgag')
            ->where($map)
            ->order('logintime asc')
            ->limit(500)
            ->select() ?: [];

        $users = array_merge($robot, $user);

        //获取游客
        $CacheName = $redis->sMembers('room_yourName' . date('Y-m-d')) ?: [];
        if ($CacheName) {
            foreach ($CacheName as $k => $v) {
                $arr['id'] = $v;
                $arr['nickname'] = '游客' . substr($v, 0, 8);
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
                $is_follow = in_array($v['id'], $followUser) && $v['group_id'] == 1 ? 1 : 0;
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

        //关注的人列表单独获取
        $fUser = db('user')
            ->field('id,nickname,avatar,group_id,isgag')
            ->where(['group_id' => 2])
            ->whereOr(['id' => ['in', $followUser]])
            ->order('group_id desc,logintime asc')
            ->select() ?: [];
        foreach ($fUser as $k => $v) {
            $fUser[$k]['avatar'] = getUserFace($v['avatar']);
            //是否关注
            $is_follow = in_array($v['id'], $followUser) && $v['group_id'] == 1 ? 1 : 0;
            $fUser[$k]['is_follow'] = $is_follow;
        }

        return json(['code' => 1, 'list' => ['u' => $users, 'fu' => $fUser, 'f' => $followUser]]);
    }

    /**
     * mqtt 消息过滤
     * @return \think\response\Json
     */
    public function mqttFilter()
    {
        header("Access-Control-Allow-Origin: *");
        try {
            $res = file_get_contents('php://input');

            $input = json_decode($res, true);
            if (!is_array($input))
                throw new Exception($res, 0);

            $data = $input['data'];

            if ($input['action'] == 'forbid' && $input['dataType'] == 'text') {
                //前台管理员禁言：判断状态与判断是否管理员
                if(isset($data['admin_id'])){
                    $admin = db('user')->where('id', $data['admin_id'])->find();
                    $users = db('user')->where('id', $data['user_id'])->find();
                    if ($admin['group_id'] < 2 || $admin['status'] == 'hidden') {
                        $input['data']['isgag'] = 9;
                        $input['data']['notice_str'] = '无权限操作';
                        $input['data']['type'] = '-1';
                        throw new \Exception(json_encode($input), 1005);
                    }

                    if (isset($data['token'])) {
                        if (!in_array($data['token'], [$admin['token'], $admin['m_token'], $admin['app_token']])) {
                            $input['action'] = 'forbid';
                            $input['data']['notice_str'] = '账号登录异常，请重新登录';
                            $input['data']['type'] = '3';
                            throw new \Exception(json_encode($input), 1005);
                        }
                    }

                    if ($input['data']['isgag'] == 1) {
                        $isgag = 0;
                        $input['data']['notice_str'] = '解除禁言';
                        $input['data']['type'] = '0';
                    } else {
                        $isgag = 1;
                        $input['data']['notice_str'] = '您的账号因违反规定被禁言，如再次违反，将进行封号处理';
//                        $input['data']['notice_str'] = '您已被管理员禁言，请联系在线客服';
                        $input['data']['type'] = '1';
                    }
                    $up = [
                        'isgag' => $isgag,
                        'gag_time' => time(),
                        'gag_num' => $users['gag_num'] + 1,
                        'gag_operator' => $admin['nickname'],
                    ];
                    db('user')->where('id', $data['user_id'])->update($up);
                }

            } elseif (in_array($input['action'], ['say', 'sayLike', 'sayTo'])) {
                $time = time();
                $input['data']['chat_time'] = $time;
                $user_id = $input['data']['user_id'];
                //用户信息
                $users = db('user')->where('id', $user_id)->find();
                $group_id = $users['group_id'];

                if ($input['action'] == 'say' || $input['action'] == 'sayTo') {

                    if (strtotime($this->close_start) < time() && time() < strtotime($this->close_end) && $group_id != 2) {
                        $input['action'] = 'forbid';
                        $input['data']['notice_str'] = '聊天室开放时间为' . $this->close_end . '-凌晨' . $this->close_start . '，休息是为了走更长的路！';
                        $input['data']['type'] = '7';
                        throw new \Exception(json_encode($input), 1006);
                    }

                    //春节期间
                    if (time() > strtotime($this->opend_d_start) && time() < strtotime($this->opend_d_end) && $group_id != 2) {
                        if (isset($input['data']['room_id']) && $input['data']['room_id'] == 'xyft') {
                            if (time() < strtotime($this->opend_d_start_t) || strtotime($this->opend_d_end_t) < time()) {
                                $input['action'] = 'forbid';
                                $input['data']['notice_str'] = "聊天室开放时间为{$this->opend_d_start_t}-{$this->opend_d_end_t}，休息是为了走更长的路！";
                                $input['data']['type'] = '8';
                                throw new \Exception(json_encode($input), 1006);
                            }
                        } else {
                            $input['action'] = 'forbid';
                            $input['data']['notice_str'] = "{$this->opend_d_start}至{$this->opend_d_end}该聊天室暂时关闭聊天功能，休息是为了走更长的路！";
                            $input['data']['type'] = '8';
                            throw new \Exception(json_encode($input), 1006);
                        }

                    }

                    if ($users['status'] == 'hidden') {
                        $input['action'] = 'forbid';
                        $input['data']['notice_str'] = '账号异常，请重新登录';
                        $input['data']['type'] = '-1';
                        throw new \Exception(json_encode($input), 1005);
                    }

                    if (!isset($users['token']) || !isset($data['token'])) {
                        $input['action'] = 'forbid';
                        $input['data']['notice_str'] = '请先登录';
                        $input['data']['type'] = '4';
                        throw new \Exception(json_encode($input), 1005);
                    }

                    if (!in_array($data['token'], [$users['token'], $users['m_token'], $users['app_token']])) {
                        $input['action'] = 'forbid';
                        $input['data']['notice_str'] = '账号登录异常，请重新登录';
                        $input['data']['type'] = '3';
                        throw new \Exception(json_encode($input), 1005);
                    }

                    $loginip =  Db::name('shield_ip')->where(['ip' => $users['loginip']])->find();
                    if($loginip){
                        $input['action'] = 'forbid';
                        $input['data']['notice_str'] = '账号异常';
                        $input['data']['type'] = '9';
                        throw new \Exception(json_encode($input), 1005);
                    }
                }

                //判断账号禁用状态
                if ($group_id != 0) {
                    if ($users['isgag'] == 1) {
                        $input['action'] = 'forbid';
                        $input['data']['saygag'] = 1;
                        $input['data']['type'] = '1';
                        $input['data']['notice_str'] = '您的账号因违反规定被禁言，如再次违反，将进行封号处理';
                        throw new \Exception(json_encode($input), 1002);
                    }

                    if ($users['status'] == 'hidden') {
                        $input['data']['notice_str'] = '账号异常，请重新登录';
                        $input['data']['type'] = '-1';
                        throw new \Exception(json_encode($input), 1005);
                    }
                }

                //封杀词库
                //1、包含该词库中词组的整条发言将不会显示在前台
                //2、将发送该消息的用户，自动加入黑名单列表
                //3、被加入黑名单的用户，前台自动删除其所有发言
                $pan_word = trim(Config::get("site.ban_world"), '|');
                if($pan_word){
                    $pa = '/\!|\~|\@|\#|\$|\%|\^|\*|\(|\)|\_|\+|\-|\=|\.|！|￥|（|）|。|，|,|‘|“|”|’|；|\;|【|】|\[|\]|\//';
                    $filter_pan = preg_replace_callback($pa, function ($m) {
                        if(isset($m[0])){
                            return '\\'.$m[0];
                        }
                        return $m[0];
                    }, $pan_word);

                    if(preg_match("/" .$filter_pan."/", $input['data']['content'])){
                        $up = [
                            'pan_time' => time(),
                            'pan_operator' => '系统',
                            'status' => 'hidden'
                        ];
                        db('user')->where('id', $user_id)->update($up);
                        model('chatlog')->where('user_id', $user_id)->update(['status' => 'hidden']);

                        $chatlog = [
                            'user_id'   => $input['data']['user_id'],
                            'chat_time' => time(),
                            'content'   => urlencode(htmlspecialchars($input['data']['content'])),
                            'room_id'   => isset($input['data']['room_id']) ? $input['data']['room_id'] :'',
                            'msg_id'    => $input['data']['msg_id'],
                            'remark'    => 2,
                            'status'    => 'hidden'
                        ];

                        $chatlog['user_type'] = isset($info['group_id']) ? intval($info['group_id']) : 1;

                        db('chatlog', [], true)->insert($chatlog);

                        $input['action'] = 'pan';
                        $input['data']['notice_str'] = '系统检测到您的发言违反本聊天室规定，将被列入黑名单';
                        $input['data']['type'] = '4';
                        $opt2 = [
                            'topic' => 'pyjy/allroom/chat',
                            'payload' => [
                                'action'    => 'hiddenUser',
                                'data'      => [
                                    'user_list'   => $user_id,
                                    'notice_str'  => '账号异常',
                                ],
                                'dataType'  => 'text',
                                'status'    => '1',
                            ],
                            'clientid' => 'h_'.md5(time())
                        ];
                        mqttPub($opt2);
                        throw new \Exception(json_encode($input), 1005);
                    }
                }

                //新注册用户（普通会员）60分钟后才可以发言
                $redis = redis_handler();
                if ($group_id == 1) {
                    $open_chat = $redis->get('new_user_open_chat:' . $user_id);
                    if ($open_chat && $input['action'] == 'say') {
                        $input['action'] = 'forbid';
                        $input['data']['type'] = '5';
                        $input['data']['notice_str'] = '新注册用户30分钟后才可以发言哦';
                        throw new \Exception(json_encode($input), 1001);
                    }
                }

                //发言频率限制
                $sIsMember = $redis->get('pyjy_chat_forbid_users:' . $user_id);
                if ($sIsMember) {
                    $input['action'] = 'forbid';
                    $input['data']['type'] = '6';
                    $input['data']['notice_str'] = '您发消息太频繁了，休息一下吧~~~';
                    throw new \Exception(json_encode($input), 1003);
                }

                //N秒内只能发M条消息
                $limitSec = 3;
                $limitNum = 1;
                $chat_num = Db::table('fa_chatlog')
                    ->where(['user_id' => ['=', $user_id], 'chat_time' => ['BETWEEN', [$time - $limitSec, $time]]])
                    ->order('chat_time desc')
                    ->count();

                if ($chat_num >= $limitNum) {
                    $input['action'] = 'forbid';
                    $input['data']['type'] = '6';
                    $input['data']['notice_str'] = '您发消息太频繁了，休息一下吧~~~';
                    $redis->setex('pyjy_chat_forbid_users:' . $user_id, $limitSec, $time);
                    throw new \Exception(json_encode($input), 1003);
                }

                //$nn分钟内不能发连续$mm条一样内容发言
                $limitMin = 300;
                $limitCou = 1;
                $map['user_id'] = ['=', $user_id];
                $map['chat_time'] = ['>=', $time - $limitMin];
                $chat_log = Db::table('fa_chatlog')->where($map)->order('chat_time desc')->limit(3)->select();

                if (count($chat_log) >= $limitCou) {
                    $cc = 0;
                    for ($i = 0; $i < count($chat_log); $i++) {
                        $pa = '/\!|\~|\@|\#|\$|\%|\^|\*|\(|\)|\_|\+|\-|\=|\.|！|￥|（|）|。|，|,|‘|“|”|’|；|\;|【|】|\[|\]|\//';
                        $input_con = htmlspecialchars($input['data']['content']);
                        $chatlog_con = urldecode($chat_log[$i]['content']);
                        preg_match_all($pa, $input_con, $matchs1);
                        foreach ($matchs1 as $k1 => $v1) {
                            if ($v1) {
                                for ($i1 = 0; $i1 < count($v1); $i1++) {
                                    $input_con = str_replace($v1[$i1], '', $input_con);
                                }
                            }
                        }
                        preg_match_all($pa, $chatlog_con, $matchs2);

                        foreach ($matchs2 as $k2 => $v2) {
                            if ($v2) {
                                for ($i2 = 0; $i2 < count($v2); $i2++) {
                                    $chatlog_con = str_replace($v2[$i2], '', $chatlog_con);
                                }
                            }
                        }

                        if ($chatlog_con == $input_con) $cc++;
                    }

                    if ($cc >= $limitCou) {
                        $input['action'] = 'forbid';
                        $input['data']['type'] = '6';
                        $input['data']['notice_str'] = '亲，发言太频繁了，请休息下';
//                        $input['data']['notice_str'] = '请勿刷屏';
                        throw new \Exception(json_encode($input), 1004);
                    }
                }

                //消息过滤
                if ($input['action'] == 'say' || $input['action'] == 'sayTo') {
                    $say_filter = Config::get("site.say_filter");
                    $tempcontent = strip_html_tags(['a', 'script'], $input['data']['content']);
                    $filter_res = filter($tempcontent, '/(' . $say_filter . ')/', $group_id);
                    $input['data']['content'] = $filter_res['content'];
                    if ($filter_res['remark'] == 1) {
                        $input['data']['scontent'] = $tempcontent;
                    }
                }
            }
        } catch (\Exception $e) {
            echo pack('a*', $e->getMessage());
            exit;
        }
        echo pack('a*', json_encode($input));
    }

    public function delCache()
    {
        $keys = $this->redis->keys("*new_user_open_chat*");
        foreach ($keys as $k => $v) {
            $res = $this->redis->del($v);
            var_dump($res);
        }
    }

    //清空redis方法
    public function clearCache(){
        echo $this->redis->flushdb();
    }

    public function test()
    {
        $pan_word = trim(Config::get("site.ban_world"), '|');

        if($pan_word) {
            $_pan_word = filterEmoji($pan_word);
            $pa = '/\!|\~|\@|\#|\$|\%|\^|\*|\(|\)|\_|\+|\-|\=|\.|\,|\;|\[|\]\//';
            $filter_pan = preg_replace_callback($pa, function ($m) {
                if (isset($m[0])) {
                    return '\\' . $m[0];
                }
                return $m[0];
            }, $_pan_word);

            var_dump(preg_match("/" . $filter_pan . "/", 'aaabbb.accc.c+454'));
            exit;
        }
    }

}
