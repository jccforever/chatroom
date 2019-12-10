<?php

namespace app\common;

use think\Config;
use think\Controller;
use think\Request;
use think\Response;

class ApiBase extends Controller
{
    protected $site;
    protected $user;

    public function _initialize()
    {
        $site = Config::get("site");
        $this->site = $site;
    }

    /**
     * json返回
     * @param $input //当为数字时，返回错误码对应的信息
     * @param string $msg
     * @param string $debug
     * @param string $type
     * @param array $header
     * @return string|\think\response\Json
     */
    protected function response($input, $msg = '', $debug = '', $type = 'json', $header = [])
    {
        $retData['code'] = 200;
        if (is_numeric($input) && $msg = config('err_code.' . $input)) {
            $retData['code'] = $input;
        } elseif (is_array($input)) {
            $retData['data'] = $input;
        }
        $retData['msg'] = $msg;
        $retData['debug'] = json_encode($this->request->param());
        return $type == 'json' ? json($retData) : '';
    }

    /**
     * 更新用户信息
     * @return array|int
     */
    protected function saveUser()
    {
        $signkey = "0fcb4bcd0901a423f8d9afe3d1a84afb";
        $platform = $this->request->param('platform');
        $device_id = $this->request->param('device_id');
        $token = $this->request->param('token') ?: '';

        if (!$platform || !$device_id)
            exit($this->response(101)->send());

        $redis = redis_handler();

        //token为空则为游客
        if (!$token) {
            $visitor_id = $redis->get('visitor:' . $device_id);
            if (!$visitor_id) {
                $visitor_id = 'Yk'.substr(strtoupper(md5(time() . rand(1, 9999))), 0, 6);
                $redis->setex('visitor:' . $device_id, 24 * 3600, $visitor_id);
            }

            $retInfo = [
                'id' => $visitor_id,
                'nickname' => '游客' . $visitor_id,
                'isgag' => 0,
                'avatar' => getUserFace($img = ''),
                'group_id' => 0,
                'token' => '',
            ];
            return $retInfo;
        }

        //根据token获取用户信息
        $req_params = ['format' => 'json', 'platform' => $platform, 'token' => $token];
        ksort($req_params);
        $fields = [];

        foreach ($req_params as $key => $value) {
            $fields[] = $key . '=' . $value;
        }

        $paramsStr = implode('&', $fields);
        $req_params['sign_code'] = md5($paramsStr . $signkey);//参数签名
        $rInfo = json_decode(http_post(config('room.sso_pre') . "/sso/api/token", $req_params), true);

        if (isset($rInfo['error']) || !$rInfo)
            return 1000;

        $rInfo['avatar'] = $rInfo['avatar'] ?: '/room/images/avatar.png';

        $userModel = model('User');
        $userInfo = $userModel->get(['username' => $rInfo['name']]);

        $save_token = md5($token . time());
        $saveData = [
            'username' => $rInfo['name'],
            'nickname' => $rInfo['name'],
            'logintime' => time(),
            'mobile' => $rInfo['mobilePhone'],
            'app_token' => $save_token,//因为皇家会员中心的token并不是每次都变，所以要自定义token
            'joinip' => intToIp($rInfo['registerIp']),
            'loginip' => $this->request->ip(0, true),
            'avatar' => $rInfo['avatar'],
        ];
        $retInfo = $saveData;

        if ($userInfo) {
            if ($userInfo['status'] != 'normal' && $userInfo['status'] != '')
                return 1002;

            $saveData['loginnum'] = ['exp', 'loginnum+1'];
            $userModel->save($saveData, ['id' => $userInfo->id]);
            $retInfo['id'] = $userInfo->id;
            $retInfo['group_id'] = $userInfo->group_id;
            $retInfo['isgag'] = intval($userInfo['isgag']);
            $retInfo['status'] = $userInfo['status'];

            //设置旧token过期
            if(isset($userInfo['app_token'])){
                $redis->setex('app_old_logintoken_:' . $userInfo['app_token'], 7*24*3600, -1);
            }

        } else {
            if (isset($rInfo['registerTime'])) {
                preg_match('/\d{10}/', $rInfo['registerTime'], $matches);
                $saveData['jointime'] = $matches[0];
            } else {
                $saveData['jointime'] = time();
            }

            $saveData['group_id'] = 1;
            $saveData['status'] = 'normal';
            $userModel->data($saveData);
            $userModel->save();

            $retInfo['id'] = $userModel->id;
            $retInfo['group_id'] = $userModel->group_id;
            $retInfo['isgag'] = 0;
            $retInfo['status'] = $saveData['status'];

            //新注册用户60分钟才能发文字
            if (time() - $saveData['jointime'] < 1800) {
                $redis->setex('new_user_open_chat:' . $retInfo['id'], 1800, time());
            }
        }
        $retInfo['avatar'] = getUserFace($retInfo['avatar']);
        $retInfo['token'] = isset($retInfo['app_token']) ? $retInfo['app_token'] : '';
        unset($retInfo['app_token']);
        return $retInfo;
    }

    /**
     * 获取用户登录信息
     */
    public function getUserInfo()
    {
        $token = request()->param('token');
        if (!$token)
            return null;

        //判断是否在其他端登录
        $redis = redis_handler();
        if($redis->get('app_old_logintoken_:' . $token) == -1)
            return -1;

       $res =  model('user')
           ->field('id,nickname,avatar,group_id,logintime,isgag,app_token as token,status')
           ->where('app_token', '=', $token)
           ->find();
       return $res;
    }

}
