<?php

namespace app\index\controller;

use app\common\controller\Frontend;

use think\Cookie;
use think\Session;
use think\Validate;
use think\captcha\Captcha;
use think\Db;
use fast\Random;

/**
 * 会员中心
 */
class User extends Frontend
{

    public function _initialize()
    {
        parent::_initialize();
    }

    public function index()
    {
        if (!$this->user) {
            exit("<script>window.parent.location.reload();</script>");
        }
        return $this->view->fetch();
    }

    //检查密码
    public function checkPass()
    {
        $oldpass = $this->request->get('oldpass');
        $strlen = strlen($oldpass);
        //6到15位字符
        if ($strlen < 6 || $strlen > 20) {
            $this->error("密码为6-20位字符！");
        }
        //判断密码
        $password = model('user')->getEncryptPassword($oldpass, $this->user['salt']);

        if ($this->user['password'] == $password) {
            $this->success(1);
        } else {
            $this->error("原始密码错误！");
        }
    }

    //修改资料
    public function update()
    {
        if (!$this->user) {
            exit("<script>window.location.href='/user/index';top.layer.msg('请先登录！',{shift: 6});</script>");
        }
        $nickname = $this->request->post('nickname');
        $qq = $this->request->post('qq');
        $mobile = $this->request->post('mobile');
        $token = $this->request->post('__token__');

        $strlen = strlen($nickname);
        //2到15位字符
        if ($strlen < 2 || $strlen > 15) {
            exit("<script>window.location.href='/user/index';top.layer.msg('昵称为2-15字符！',{shift: 6});</script>");
        }
        //不允许特殊字符
        if (preg_match("/[\'.,:;*?~`!@#$%^&+=)(<>{}]|\]|\[|\/|\\\|\"|\|/", $nickname)) {
            exit("<script>window.location.href='/user/index';top.layer.msg('昵称不允许特殊字符！',{shift: 6});</script>");
        }
        $user_filter = $this->site['user_filter'];
        //关键词屏蔽
        if (preg_match("/" . $user_filter . "/", $nickname)) {
            exit("<script>window.location.href='/user/index';top.layer.msg('昵称含关键字，不能使用！',{shift: 6});</script>");
        }
        //是否被占用
        $isHas = db('user')->where(['nickname' => $nickname, 'id' => ['neq', $this->user['id']]])->find();
        if ($isHas) {
            exit("<script>window.location.href='/user/index';top.layer.msg('昵称被占用！',{shift: 6});</script>");
        }

        $rule = [
            'nickname' => 'require',
            '__token__' => 'require|token',
        ];

        $msg = [
            'nickname.require' => '昵称不能为空！',
            '__token__.require' => '参数错误！',
        ];
        $data = [
            'nickname' => $nickname,
            '__token__' => $token,
        ];
        $validate = new Validate($rule, $msg);
        $result = $validate->check($data);

        if (!$result) {
            exit("<script>window.location.href='/user/index';top.layer.msg('" . $validate->getError() . "',{shift: 6});</script>");
        }
        $saveArr['nickname'] = $nickname;
        if (!empty($qq)) $saveArr['qq'] = $qq;
        if (!empty($mobile)) $saveArr['mobile'] = $mobile;
        $update = Db::name('user')->where(['id' => $this->user['id']])->update($saveArr);
        if ($update !== false) {
            exit("<script>window.parent.location.reload();top.layer.msg('保存成功！',{shift: 6});</script>");
        } else {
            exit("<script>window.location.href='/user/index';top.layer.msg('保存失败！',{shift: 6});</script>");
        }
    }

    //修改密码
    public function repass()
    {
        if (!$this->user) {
            exit("<script>window.location.href='/user/index';top.layer.msg('请先登录！',{shift: 6});</script>");
        }
        $oldpass = $this->request->post('oldpass');
        $password = $this->request->post('password');
        $repass = $this->request->post('repass');
        $token = $this->request->post('__token__');

        $rule = [
            'oldpass' => 'require',
            'password' => 'require',
            'repass' => 'require',
            '__token__' => 'require|token',
        ];

        $msg = [
            'oldpass.require' => '请输入原始密码！',
            'password.require' => '请输入新密码！',
            'repass.require' => '请输入确认密码！',
            '__token__.require' => '参数错误！',
        ];
        $data = [
            'oldpass' => $oldpass,
            'password' => $password,
            'repass' => $repass,
            '__token__' => $token,
        ];
        $validate = new Validate($rule, $msg);
        $result = $validate->check($data);
        if (!$result) {
            exit("<script>window.location.href='/user/index?a=0';top.layer.msg('" . $validate->getError() . "',{shift: 6});</script>");
        }
        //判断密码
        $y_pass = model('user')->getEncryptPassword($oldpass, $this->user['salt']);
        if ($y_pass != $this->user['password']) {
            exit("<script>window.location.href='/user/index?a=0';top.layer.msg('原始密码错误！',{shift: 6});</script>");
        }
        //判断两次密码
        if ($password != $repass) {
            exit("<script>window.location.href='/user/index?a=0';top.layer.msg('两次密码输入不一致！',{shift: 6});</script>");
        }
        //盐值
        $salt = Random::alnum();
        $newPass = model('user')->getEncryptPassword($repass, $salt);

        //执行修改
        $update = Db::name('user')->where(['id' => $this->user['id']])->update(['password' => $newPass, 'salt' => $salt]);

        if ($update !== false) {
            model('user')->logout();
            exit("<script>window.parent.location.reload();top.layer.msg('密码修改成功，请重新登录！',{shift: 6});</script>");
        } else {
            exit("<script>window.location.href='/user/index?a=0';top.layer.msg('修改失败，请稍后再试！',{shift: 6});</script>");
        }
    }

    /**
     * 会员登录
     */
    public function login()
    {
        //忘记密码客服
        $qq = Db::name('kf')->find();
        $this->assign('qq', $qq);

        if ($this->request->isPost()) {
            $username = $this->request->post('username');
            $password = $this->request->post('password');
            $token = $this->request->post('__token__');
            $remember = $this->request->post('remember');
            $rule = [
                'username' => 'require',
                'password' => 'require',
                '__token__' => 'require|token',
            ];

            $msg = [
                'username.require' => '请输入帐号！',
                'password.require' => '请输入密码！',
                '__token__.require' => '参数错误！',
            ];
            $data = [
                'username' => $username,
                'password' => $password,
                '__token__' => $token,
            ];
            $validate = new Validate($rule, $msg);
            $result = $validate->check($data);
            if (!$result) {
                exit("<script>window.location.href='/user/login';top.layer.msg('" . $validate->getError() . "',{shift: 6});</script>");
            }
            $login = model('user')->login($username, $password, $remember);
            if ($login['code'] == 1) {
                exit("<script>window.parent.location.reload();</script>");
            } else {
                exit("<script>window.location.href='/user/login';top.layer.msg('" . $login['msg'] . "',{shift: 6});</script>");
            }
        }
        return $this->view->fetch();
    }

    //生成验证码
    public function captcha()
    {
        $config = [
            'codeSet' => '0123456789',
            // 验证码字体大小
            'fontSize' => 50,
            // 验证码位数
            'length' => 4,
            // 关闭验证码杂点
            'useNoise' => true,
            'useCurve' => true,
        ];
        $captcha = new Captcha($config);
        return $captcha->entry();
    }

    //注册用户
    public function register()
    {
        $username = $this->request->post('user');
        $password = $this->request->post('pass');
        $qq = $this->request->post('qq');
        $mobile = $this->request->post('phone');
        $captcha = $this->request->post('captcha');
        $token = $this->request->post('__token__');
        $rule = [
            'username' => 'require',
            'password' => 'require',
            'captcha|验证码' => 'require|captcha',
            '__token__' => 'require|token',
        ];

        $msg = [
            'username.require' => '请输入帐号！',
            'password.require' => '请输入密码！',
            'captcha.require' => '请输入验证码！',
            '__token__.require' => '参数错误！',
        ];
        $data = [
            'username' => $username,
            'password' => $password,
            'captcha' => $captcha,
            '__token__' => $token,
        ];
        $validate = new Validate($rule, $msg);
        $result = $validate->check($data);
        if (!$result) {
            exit("<script>window.location.href='/user/login?a=0';top.layer.msg('" . $validate->getError() . "',{shift: 6});</script>");
        }
        $userData = [
            'username' => $username,
            'password' => $password,
            'token' => $token,
        ];
        //qq与手机号非必填
        if ($qq != '') $userData['qq'] = $qq;
        if ($mobile != '') $userData['mobile'] = $mobile;

        $register = model('user')->register($userData);
        if ($register['code'] == 1) {
            exit("<script>window.parent.location.reload();</script>");
        } else {
            exit("<script>window.location.href='/user/login?a=0';top.layer.msg('" . $register['msg'] . "',{shift: 6});</script>");
        }
    }

    //检查帐号
    public function regcheck()
    {
        $username = $this->request->get('username');
        $strlen = strlen($username);
        //3到15位字符
        if ($strlen < 3 || $strlen > 15) {
            $this->error("×帐号为3-15字符！");
        }
        //不允许特殊字符
        if (preg_match("/[\'.,:;*?~`!@#$%^&+=)(<>{}]|\]|\[|\/|\\\|\"|\|/", $username)) {
            $this->error("×帐号不允许特殊字符！");
        }
        $user_filter = $this->site['user_filter'];
        //关键词屏蔽
        if (preg_match("/" . $user_filter . "/", $username)) {
            $this->error("×帐号含关键字，不能使用！");
        }
        //是否被占用
        $isHas = model('user')->get(['username' => $username]);
        if ($isHas) {
            $this->error("×帐号被占用！");
        } else {
            $this->success(1);
        }
    }

    //退出登录
    public function logout()
    {
        model('user')->logout();
        $this->success();
        //$this->redirect('/');
    }

    //修改头像
    public function avatar()
    {
        if ($this->request->isAjax()) {
            if (!$this->user) {
                return json(['status' => 0, 'data' => '请先登录！']);
            }
            $img = $this->request->post('img');

            $result = base64_upload($img);
            if ($result['status'] == 1) {
                //保存头像路劲
                db('user')->where(['id' => $this->user['id']])->update(['avatar' => $result['src']]);
                return json(['status' => 1, 'data' => '上传成功！', 'src' => $result['src']]);
            } else {
                return json(['status' => 0, 'data' => '上传失败！']);
            }
        }
        return $this->view->fetch();
    }

    /**
     * 查看用户资料
     * @return \think\response\Json
     */
    public function getDetails()
    {
        if (!$this->user) {
            return json(['code' => 0, 'data' => '没有用户资料查看权限！']);
        }
        $user_id = $this->request->param('user_id');
        if (!$user_id) {
            return json(['code' => 0, 'data' => '参数错误！']);
        }
        if ($this->user['group_id'] < 2) {
            return json(['code' => 0, 'data' => '没有用户资料查看权限！']);
        }

        $users = Db::name('user')
            ->field('nickname,group_id,avatar,qq,mobile,loginnum,jointime')
            ->where('id', $user_id)
            ->find();

        $users['avatar'] = getUserFace($users['avatar']);
        $users['userGroup'] = get_user_group($users['group_id']);
        return json(['code' => 1, 'data' => $users]);
    }

}
