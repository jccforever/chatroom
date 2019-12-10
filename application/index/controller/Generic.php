<?php

namespace app\index\controller;

use app\common\controller\Frontend;
use think\Cookie;
use think\Session;
use think\Db;
use think\Request;
class Generic extends Frontend
{
    public function _initialize()
    {
        //不需要执行前置的方法
        if(!in_array($this->request->action(), ['ssoCallback','onSay','redisFlushDb'])){
            parent::_initialize();
        }   
    }

    /**
     * 签到
     * @return \think\response\Json
     */
    public function doSign()
    {
        $res = Model('User')->doSign($this->user, $this->site);
        return json($res);
    }

    /**
     * 皇家会员回调地址
     */
    public function ssoCallback()
    {
        $platform_params = $this->request->param('platform_params');
        logRecord($platform_params,'ssoCallback.log');
        if(!$platform_params)
            exit('platform_params error');

        $params = getSSOparams($platform_params, $type = 2);//解密
        $room_id = $this->request->param('room_id');

        if ($params['action'] != 'logout') {//处理登录
            $token = $params['token'];
            $userToken = Request::instance()->token('__token__', 'md5');

            $config = config('room.vip_sso');

            $req_params = ['format' => 'json', 'platform' => $config['platform'], 'token' => $token];
            ksort($req_params);
            $fields = [];

            foreach ($req_params as $key => $value) {
                $fields[] = $key . '=' . $value;
            }

            $paramsStr = implode('&', $fields);
            $req_params['sign_code'] = md5($paramsStr . $config['signkey']);//参数签名

            //获取会员信息
            $rInfo = json_decode(http_post(config("room.sso_pre") . "/sso/api/token", $req_params), true);

            if ($rInfo && !isset($rInfo['error'])) {
                $rInfo['avatar'] = $rInfo['avatar'] ?: '/room/images/avatar.png';
                $userModel = model('User');
                $userInfo = $userModel->get(['username' => $rInfo['name']]);
                $tokenType = Request::isMobile() ? 'm_token' : 'token';

                $saveData = [
                    'username'  => $rInfo['name'],
                    'nickname'  => $rInfo['name'],
                    'prevtime'  => $userInfo->logintime ?: time(),
                    'logintime' => time(),
                    'mobile'    => $rInfo['mobilePhone'],
                    $tokenType  => $userToken,
                    'joinip'    => intToIp($rInfo['registerIp']),
                    'loginip'   => $this->request->ip(0, true),
                    'avatar'    => $rInfo['avatar'],
                ];

                if ($userInfo) {
                    //更新
                    $saveData['loginnum'] = ['exp', 'loginnum+1'];
                    $userModel->save($saveData, ['id' => $userInfo->id]);
                    $uid = $userInfo->id;// 获取用户ID
                } 
                else 
                {
                    if(isset($rInfo['registerTime'])){
                        preg_match('/\d{10}/',$rInfo['registerTime'], $matches);
                        $saveData['jointime'] = $matches[0];
                    }else{
                        $saveData['jointime'] = time();
                    }

                    //新建
                    $saveData['group_id'] = 1;
                    $saveData['status']   = 'normal';
                    $userModel->data($saveData);
                    $userModel->save();
                    $uid = $userModel->id; // 获取自增ID

                    //新注册用户60分钟才能发文字
                    if(time() - $saveData['jointime'] < 1800){
                        $redis = redis_handler();
                        $redis->setex('new_user_open_chat:' . $uid, 1800, time());
                    }
                }

                $userInfo = [
                    'id'        => $uid,
                    'username'  => $rInfo['mobilePhone'],
                    'nickname'  => $rInfo['name'],
                    'avatar'    => $rInfo['avatar'],
                    'token'     => $userToken
                ];
                Session::set('user_auth', $userInfo);
            }else{
                exit('登录失败！请关闭重试');
            }

        } elseif ($params['action'] == 'logout') {
            Session::delete("user_auth");
        }

        //清除token
//        if ($params['token']) {
//            $req_params['sign_code'] = md5('token=' . $params['token'] . $config['signkey']);
//            http_post(config("room.sso_pre") . "/sso/ssorefresh", $req_params);
//        }

        //刷新页面
        if($params['action'] == 'clientlogin'){
            exit("<script>window.parent.location.reload();</script>");
        }
        else if($params['action'] == 'register' || $params['action'] == 'login')
        {
            $url = $room_id ? url('/room/'.$room_id) : url('/');
            $this->redirect($url);
        }
    }

    /**
     * 聊天记录
     * @return \think\response\Json
     */
    public function chatLog()
    {
        $room_id = $this->request->param('room_id');
        $page = $this->request->param('p');
        $msg_id = $this->request->param('msg_id');

        if (!isset($room_id) || !isset($page))
            return json(['code' => 0, 'list' => '参数错误！']);

        $is_mobile = isMobile();
        $chat_log = model('Chatlog')->chatlog($room_id, $page, $this->site['say_filter'],$this->user, $is_mobile, $msg_id);

        if (!$chat_log)
            return json(['code' => 0, 'list' => '没有更多了！']);

        return json(['code' => 1, 'list' => $chat_log['chat_log'] ?: [], 'msg_id' => $chat_log['msg_id']]);
    }

    /**
     * 关注功能
     * @return \think\response\Json
     */
    public function follow()
    {
        //判断是否登录
        if (!$this->user) {
            return json(['code' => 0, 'msg' => '请先登录！']);
        }

        $follow_id = $this->request->param('follow_id');
        $follow    = $this->request->param('follow');

        if (!isset($follow_id) || !isset($follow))
            return json(['code' => 0, 'list' => '参数错误！']);

        if($follow == 0){
            //添加关注
            $rs = db('follow')->insert(['user_id'=>$this->user['id'],'follow_id'=>$follow_id,'create_time'=>time()]);
        }else{
            //取消关注
            $rs = db('follow')->where(['user_id'=>$this->user['id'],'follow_id'=>$follow_id])->delete();
        }

        if ($rs)
            return json(['code' => 1, 'type' => $follow]);

        return json(['code' => 0,'msg'=>'操作失败！']);
    }

    /**
     * 图片上传
     * @return \think\response\Json
     */
    public function upload()
    {
        //判断是否登录
        if (!$this->user)
            return json(['code' => 2,'msg' => '亲，需要登录才有发言权限哦']);

        if(!in_array($this->user['group_id'], config('site.upload-allow-list'))){
            return json(['code' => 2, 'msg' => '您没有权限发表图片']);
        }

        // 获取表单上传文件
        $file = $this->request->file('file_upload');
        // 移动到框架应用根目录/public/uploads/ 目录下
        if ($file) {
            $path = '/uploads/'.date('Y-m-d');
            $info = $file->move(ROOT_PATH . 'public' . $path,randStr(15));
            if ($info) {
                return json(['code' => 1, 'filePath' => 'http://'.$this->request->host() . $path. '/' . str_replace('\\', '/', $info->getSaveName())]);
            } else {
                // 上传失败获取错误信息
                return json(['code' => 2, 'msg' => $file->getError()]);
            }
        }
    }

    /**
     * 上传
     * @return \think\response\Json
     */
    public function uploadImg()
    {
        //判断是否登录
        if (!$this->user) {
            return json(['code' => 2, 'msg' => '亲，需要登录才有发言权限哦']);
        }

        if(!in_array($this->user['group_id'], config('site.upload-allow-list'))){
            return json(['code' => 2, 'msg' => '您没有权限发表图片']);
        }

        // 获取表单上传文件
        $file = $this->request->post('img');

        // 移动到框架应用根目录/public/uploads/ 目录下
        if ($file != '') {
            $result = base64_upload($file);
            if ($result['status'] == 1) {
                return json(['code' => 1, 'filePath' => 'http://'.$this->request->host() . $result['src']]);
            } else {
                return json(['code' => 2, 'msg' => '上传失败']);
            }
        }
    }

    /**
     * 会员登录或游客登录推送
     */
    public function mqttPubUser()
    {
        if ($this->user) {
            //保存在线状态
            $this->redis->sAdd('room_onlineUser', $this->user['id']);
            $data = [
                'id'        => $this->user['id'],
                'nickname'  => $this->user['nickname'],
                'isgag'     => $this->user['isgag'],
                'avatar'    => getUserFace($this->user['avatar']),
                'group_id'  => $this->user['group_id'],
                'token'     => $this->user['token']
            ];
        } else {
            //游客
            $nameStr = Cookie::get('your_name');

            if (!$nameStr) {
                $nameStr = substr(strtoupper(md5(time() . rand(1, 9999))), 0, 8);
                Cookie::set('your_name', $nameStr);
            }

            $this->redis->sAdd('room_yourName' . date('Y-m-d'), $nameStr);
            if($this->redis->sCard('room_yourName' . date('Y-m-d')) < 2){
                $this->redis->expire('room_yourName' . date('Y-m-d'), 3600 * 24);
            }

            $data = [
                'id'        => $nameStr,
                'nickname'  => '游客' . $nameStr,
                'isgag'     => 0,
                'avatar'    => getUserFace(),
                'group_id'  => 0,
                'token'     => '',
                'chat_time' => time()
            ];
        }

        $display = 0;
        if(!$this->redis->get('join_room_sayhello:' . $data['id'])){
            $display = 1;
            $this->redis->setex('join_room_sayhello:' . $data['id'], 600, time());
        }

        $opt = [
            'topic' => 'pyjy/allroom/chat',
            'payload' => [
                'action'    => 'sayHello',
                'data'      => $data,
                'dataType'  => 'text',
                'status'    => '1',
                'chat_time' => time(),
                'display' => $display
            ],
            'clientid' => md5(time().$data['id'])
        ];

        mqttPub($opt);
    }

    /**
     * 创建保存为桌面代码
     */
    public function dourl()
    {
        $filename = '聊天室.url';
        $url = $_SERVER['HTTP_REFERER'];
        $icon = '';
        createShortCut($filename, $url, $icon);
    }

    /**
     * 监听聊天守护进程 cli 运行
     */
    public function onSay()
    {
        error_reporting(0);
        set_time_limit(0);
        $redis = redis_handler();

        $client = new \Mosquitto\Client(md5(time() . rand(0, 99999)));
        $client->onConnect(function ($code, $message) use ($client) {
            $client->subscribe('pyjy/+/chat/#', 1);
        });

        $client->onMessage(function ($message) use ($redis) {
            echo $message->topic, "\n", $message->payload, "\n\n";

            $topic      = $message->topic;
            $payload    = $message->payload;
            $data       = json_decode($payload, true);

            if ($data) {
                if (strpos($topic, 'chat') !== false && (in_array($data['action'], ['say', 'sayTo', 'sayLike']))) {
                    $topics = explode('/', $topic);

                    //保存数据库
                    $info = $data['data'];
                    if ($info['content']) {
                        $c = $info['content'];
                        $remark = 0;
                        if(isset($info['scontent'])){
                            $c = $info['scontent'];
                            $remark = 1;
                        }

                        $chatlog = [
                            'user_id'   => $info['user_id'],
                            'chat_time' => time(),
                            'content'   => urlencode(htmlspecialchars($c)),
                            'room_id'   => $topics[1],
                            'msg_id'    => $info['msg_id'],
                            'remark'    => $remark,
                            'status'    => 'normal'
                        ];

                        $chatlog['user_type'] = isset($info['group_id']) ? intval($info['group_id']) : 1;

                        db('chatlog', [], true)->insert($chatlog);
                    }

                } elseif (strpos($topic, 'chat') !== false && $data['action'] == 'logout' && $data['dataType'] == 'text') {
                    $info = $data['data'];
                    $type = isset($info['type']) ? $info['type'] : 1;
                    if ($type == 1) {
                        //会员
                        $redis->sRem('room_onlineUser', $info['id']);
                    } elseif ($type == 2) {
                        //游客
                        $redis->sRem('room_yourName' . date('Y-m-d'), $info['id']);
                    }
                } elseif (strpos($topic, 'chat') !== false && $data['action'] == 'hiddenMsg' && $data['dataType'] == 'text') {
                    Db::table('fa_chatlog')->where('msg_id', $data['data']['msg_id'])->update(['status' => 'hidden']);
                }
            }
        });

        $options = config('room.mqtt');
        $client->connect($options['host'], $options['port']);
        $client->loopForever();
    }

    /**
     * 帮助中心
     * @return string
     */
    public function help()
    {
        //获取分类id
        $page_id = Db::name('category')
            ->where(['type' => 'page', 'status' => 'normal'])
            ->value('id');

        //获取文章
        $news = Db::name('page')
            ->where(['category_id' => $page_id])
            ->order('weigh desc')
            ->select();

        $this->assign('news', $news);

        return $this->view->fetch();
    }

    //清空所有reids
    public function redisFlushDb(){
        $redis = redis_handler();
        $redis->flushdb();
    }
}
