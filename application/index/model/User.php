<?php

namespace app\index\model;

use think\Model;
use fast\Random;
use think\Cookie;
use think\Session;
use think\Db;
use think\Request;
use think\Cache;
class User extends Model
{
    // 表名
    protected $name = 'user';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';
    // 定义时间戳字段名
    protected $createTime = 'jointime';
    protected $updateTime = '';
    protected $insert = ['joinip'];  

//    protected function setJoinipAttr()
//    {
////        return request()->ip(0, true);
//    }

    /**
     * 用户登录
     *
     * @param string    $account    账号,帐号、邮箱、手机号
     * @param string    $password   密码
     * @param int       $keeptime   有效时长,默认为浏览器关闭
     * @return array
     */
    public function login($username, $password, $keeptime = 0)
    {
        $user = $this->get(['username' => $username]);
        if ($user)
        {
            if ($user->password != $this->getEncryptPassword($password, $user->salt))
            {
                return ['code'=>0,'msg'=>'帐号或密码错误！'];
            }
            if ($user->status != 'normal')
            {
                return ['code'=>0,'msg'=>'帐号被禁用！'];
            }

            $this->writeStatus($user,$keeptime);
            return ['code'=>1,'msg'=>'登录成功！'];
        }
        else
        {
            return ['code'=>0,'msg'=>'帐号或密码错误！'];
        }
    }

    /**
     * 注册用户
     *
     * @param string $userData    参数
     * @return boolean
     */
    public function register($userData)
    {
        if ($this->get( ['username' => $userData['username']]) )
        {
            return ['code'=>0,'msg'=>'帐号被占用！'];
        }

        $ip = request()->ip(0, true);
        $time = time();
        $userData['joinip']    = $ip;
        $userData['jointime']  = $time;
        $userData['nickname']  = $userData['username'];
        $userData['loginip']   = $ip;
        $userData['logintime'] = $time;
        $userData['group_id']  = 1;
        $userData['logintime'] = $time;
        $userData['prevtime']  = $time;
        $userData['status']    = 'normal';

        $salt = Random::alnum();
        $userData['password'] = $this->getEncryptPassword($userData['password'], $salt);
        $userData['salt'] = $salt;

        //账号注册时需要开启事务,避免出现垃圾数据
        Db::startTrans();
        try
        {
            $ret = $this->save($userData);
            Db::commit();
            //写入session
            $user = $this->get($this->id);
            $this->writeStatus($user);
            return ['code'=>1,'msg'=>'注册成功！'];
        }
        catch (Exception $e)
        {
            Db::rollback();
            return ['code'=>0,'msg'=>'注册失败！'];
        }
    }

    /**
     * 写入登录状态和Cookie
     *
     * @param obj $user
     * @param string $keeptime
     */
    protected function writeStatus($user,$keeptime=0)
    {
        $token = Random::uuid();
        //增加登录次数和设置最后登录时间
        $this->save([
            'prevtime'  => $user->logintime,
            'logintime' => time(),
            'loginnum'  => ['exp','loginnum+1'],
            'token'     => $token,
            'loginip'   => request()->ip(0, true),
        ],['id' => $user->id]);

        $avatar = $user->avatar ? : '/room/images/avatar.png';
        $userInfo = ['id'=>$user->id,'username'=>$user->username,'nickname'=>$user->nickname,'avatar'=>$avatar];
        Session::set('user_auth',$userInfo);
        
        if ($keeptime)
        {
            //刷新保持登录的Cookie
            Cookie::set('cpkeeplogin', base64_encode($user->id.'|'.$token),86400*15);
            return true;
        }

        return $userInfo;
    }



    /**
     * 获取密码加密方式
     * @param string $password
     * @param string $salt
     * @return string
     */
    public function getEncryptPassword($password, $salt = '')
    {
        return md5(md5($password) . $salt);
    }

    /**
     * 注销登录
     */
    public function logout()
    {
        $admin = Session::has('user_auth');
        if (!$admin)
        {
            return true;
        }
        //改为退出状态
        Session::delete("user_auth");
        Cookie::delete("cpkeeplogin");

        return true;
    }

    /**
     * 自动登录
     * @return boolean
     */
    public function autologin()
    {
        $keeplogin = Cookie::get('cpkeeplogin');

        if (!$keeplogin)
        {
            return false;
        }

        $keeplogin = base64_decode($keeplogin);

        list($id, $token) = explode('|', $keeplogin);
        if ($id && $token)
        {
            $user = $this->get($id);
            if (!$user || !$user->token || ($token != $user->token))
            {
                Cookie::delete("cpkeeplogin");
                return false;
            }

            return $this->writeStatus($user);
        }
        else
        {
            return false;
        }
    }

    /**
     * 获取签到
     * @param $user
     * @param $site
     * @return array
     */
    public function sign($user,$site){
        $is_sign = 0;
        $todayScore = 0;
        if(($user)){
            if($user['sign_time'] == date('Ymd')){
                //今天已签到
                $is_sign = 1;
                //今日签到可获得的积分
                if($user['sign_num'] <= 7){
                    $todayScore = $site['user_score'][$user['sign_num']];
                }else{
                    //大于7天取最后一个
                    $todayScore = end($site['user_score']);
                }
            }else{
                //未签到,判断昨天是否已签到
                $Yesterday = date('Ymd',strtotime('-1 day'));
                if($user['sign_time'] != $Yesterday){
                    //昨天也没签到，重置签到天数为0
                    if($user['sign_num'] != 0){
                        User::where('id', $user['id'])->update(['sign_num' => 0]);
                    }
                }
            }
        }

        return ['todayScore' =>$todayScore, 'is_sign' => $is_sign];
    }

    /**
     * 签到
     * @param $user
     * @param $site
     * @return array
     */
    public function doSign($user,$site){
        if (!$user)
           return ['code' => 0, 'msg' => '请先登录！'];

        if ($user['sign_time'] == date('Ymd'))
            return ['code' => 0, 'msg' => '今天已签到！'];

        //今日签到可获得的积分
        if ($user['sign_num'] < 7) {
            $todayScore = $site['user_score'][$user['sign_num'] + 1];
        } else {
            //大于6天取最后一个
            $todayScore = end($site['user_score']);
        }
        $array = [
            'score' => ['exp', 'score+' . $todayScore],
            'sign_num' => ['exp', 'sign_num+1'],
            'sign_time' => date('Ymd'),
        ];

        //执行签到保存
        $rs =  User::where('id', $user['id'])->update($array);
        if ($rs) {
            //添加积分记录
            db('scoreLog')->insert([
                'user_id' => $user['id'],
                'log_time' => time(),
                'log_type' => 1,
                'change_num' => $todayScore,
                'total_point' => $user['score'] + $todayScore
            ]);
            $returnArr = [
                'sign_num' => $user['sign_num'] + 1,
                'score' => $todayScore
            ];
            return['code' => 1, 'data' => $returnArr];
        }

        return ['code' => 0, 'msg' => '签到失败！'];
    }
}
