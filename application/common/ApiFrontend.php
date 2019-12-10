<?php

namespace app\common;

class ApiFrontend extends ApiBase
{
    protected $redis;
    protected $user;

    /**
     * 初始化
     */
    public function _initialize()
    {
        //ip屏蔽
        $shield_ip = model('shield_ip')->where('ip', '=', request()->ip())->find();
        if ($shield_ip)
            exit($this->response(102)->send());

        //判断是否登录
        if (!$this->user = $this->getUserInfo())
            exit($this->response(1000)->send());

        //判断是否在其他端登录
        if (!is_object($this->user) && !is_array($this->user) && $this->user == -1)
            exit($this->response(103)->send());

        //账号是否可用
        if($this->user['status'] == 'hidden')
            exit($this->response(1002)->send());

        $this->user['avatar'] = getUserFace($this->user['avatar']);
        $this->user['group_name'] = get_user_group($this->user['group_id'])['name'];

        $this->redis = redis_handler();
    }

}
