<?php

namespace app\common\controller;

use think\Config;
use think\Controller;
use think\Hook;
use think\Lang;
use think\Cookie;
use think\Session;
use think\Db;
use think\Cache;

class Frontend extends Controller
{

    /**
     * 布局模板
     * @var string
     */
    protected $layout = '';
    protected $user = '';
    protected $site = '';
    protected $redis = '';

    public function _initialize()
    {
        //ip屏蔽
        $shield_ip = Db::name('shield_ip')->column('ip');
        if (in_array(request()->ip(0, true), $shield_ip)) {
            model('user')->logout();
            $this->error('账号异常！');
        }

        $this->redis = redis_handler();

        //登录信息
        $user = isLogin();

        $assignUser = '';
        $_token = '';
        if (isset($user['id'])) { //已登录
            $fl = 'id,nickname,mobile,avatar,loginnum,jointime,group_id,isgag,status,token,m_token';
            $userInfo = Db::name('user')->field($fl)->where('id', $user['id'])->find();
            //判断pc或m站token
            $tokenType = $this->request->isMobile() ? 'm_token' : 'token';
            if ($userInfo['status'] == 'hidden' || !$userInfo) {
                model('user')->logout();
                if($this->request->isAjax()){
                    $this->error('您的帐号已被禁用！');
                }
                $this->assign('userStatus', ['status'=>0,'msg'=>'您的帐号已被禁用！']);
            }else if($user['token'] != $userInfo[$tokenType]){
                //只能在一端登录
                model('user')->logout();
                if($this->request->isAjax()){
                    $this->error('您已在其他端登录！');
                }
                $this->assign('userStatus', ['status'=>0,'msg'=>'您已在其他端登录！']);
            }else{
                $userInfo['avatar'] = getUserFace($userInfo['avatar']);
                $userInfo['group_name'] = get_user_group($userInfo['group_id'])['name'];
                $this->user = $userInfo;
                $assignUser = $userInfo;
                unset($assignUser['status']);
            }
        }
        else
        {
            $nameStr = Cookie::get('your_name');
            if (!$nameStr) {
                $nameStr = 'Yk'.substr(strtoupper(md5(time() . rand(1, 9999))), 0, 6);
                Cookie::set('your_name', $nameStr);
            }
            $this->assign('visitor', $nameStr);
        }

        $this->assign('user', $assignUser);
        
        //移除HTML标签
        $this->request->filter('strip_tags');
        $modulename = $this->request->module();
        $controllername = strtolower($this->request->controller());
        $actionname = strtolower($this->request->action());

        // 如果有使用模板布局
        if ($this->layout)
        {
            $this->view->engine->layout('layout/' . $this->layout);
        }

        // 语言检测
        $lang = strip_tags(Lang::detect());

        $site = Config::get("site");
		$this->site = $site;

        $upload = \app\common\model\Config::upload();

        // 上传信息配置后
        Hook::listen("upload_config_init", $upload);
        
        // 配置信息
        $config = [
            'site'           => array_intersect_key($site, array_flip(['name', 'cdnurl', 'version', 'timezone', 'languages'])),
            'upload'         => $upload,
            'modulename'     => $modulename,
            'controllername' => $controllername,
            'actionname'     => $actionname,
            'jsname'         => 'frontend/' . str_replace('.', '/', $controllername),
            'moduleurl'      => rtrim(url("/{$modulename}", '', false), '/'),
            'language'       => $lang
        ];
        
        Config::set('upload', array_merge(Config::get('upload'), $upload));
        
        // 配置信息后
        Hook::listen("config_init", $config);
        $this->loadlang($controllername);
        $this->assign('site', $site);
        $this->assign('config', $config);
        $this->assign('clientIp', request()->ip(0, true));
    }

    /**
     * 加载语言文件
     * @param string $name
     */
    protected function loadlang($name)
    {
        Lang::load(APP_PATH . $this->request->module() . '/lang/' . Lang::detect() . '/' . str_replace('.', '/', $name) . '.php');
    }
    
    /**
     * 渲染配置信息
     * @param mixed $name 键名或数组
     * @param mixed $value 值 
     */
    protected function assignconfig($name, $value = '')
    {
        $this->view->config = array_merge($this->view->config ? $this->view->config : [], is_array($name) ? $name : [$name => $value]);
    }

}
