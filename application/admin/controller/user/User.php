<?php

namespace app\admin\controller\user;

use app\common\controller\Backend;
use think\Session;

/**
 * 会员管理
 *
 * @icon fa fa-user-o
 */
class User extends Backend
{

    protected $noNeedRight = ['selectpage'];

    /**
     * User模型对象
     */
    protected $model = null;
    protected $relationSearch = true;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = model('User');
        $user_group = config('room.user_group');
        $this->view->assign('user_group', $user_group);
    }

    /**
     * 查看
     */
    public function index()
    {
        //设置过滤方法
        $this->request->filter(['strip_tags']);
        if ($this->request->isAjax())
        {
            //如果发送的来源是Selectpage，则转发到Selectpage
            if ($this->request->request('pkey_name'))
            {
                return $this->selectpage();
            }
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();
            $_filter = json_decode($this->request->request('filter'),true);
            $_order = 'logintime desc, id desc, gag_time desc, pan_time desc ';

            if(isset($_filter['isgag']) && !isset($_filter['status'])){
                $_order = 'gag_time desc,logintime desc, id desc';
            }elseif(isset($_filter['status']) && !isset($_filter['isgag'])){
                $_order = 'pan_time desc,logintime desc, id desc';
            }elseif(isset($_filter['status']) && isset($_filter['isgag'])){
                $_order = 'gag_time desc, pan_time desc,logintime desc, id desc';
            }

            $total = $this->model
                    ->where($where)
                    ->where('is_robot',0)
                    ->order($_order)
                    ->count();

            $list = $this->model
                    ->where($where)
                    ->where('is_robot',0)
                    ->field(['password', 'salt', 'token'], true)
                    ->order($_order)
                    ->limit($offset, $limit)
                    ->select();

            foreach ($list as $k => $v) {
                $list[$k]['avatar'] = getUserFace($v['avatar']);
                $list[$k]['ipstatus'] = model('ShieldIp')->where(['ip' => $v['loginip']])->find()['ip'];
                $list[$k]['gag_time'] =$v['gag_time'] ? date('Y-m-d H:i:s', $v['gag_time']) : '';
                $list[$k]['pan_time'] =$v['pan_time'] ? date('Y-m-d H:i:s', $v['pan_time']) : '';
                $list[$k]['gag_num'] =$v['gag_num'] ? $v['gag_num'] : '0';
            }
            $result = array("total" => $total, "rows" => $list);

            return json($result);
        }
        return $this->view->fetch();
    }

    /**
     * 添加
     */
    public function add()
    {
        if ($this->request->isPost())
        {
            $params = $this->request->post("row/a");
            if ($params['password'])
            {
                $password = $params['password'];
                $salt = \fast\Random::alnum();
                $params = array_merge($params, ['password' => \addons\user\library\Auth::instance()->getEncryptPassword($password, $salt), 'salt' => $salt]);
            }
            else
            {
                unset($params['password']);
            }
            $this->request->post(['row' => $params]);
        }
        return parent::add();
    }

    /**
     * 修改
     */
    public function edit($ids = NULL)
    {
        if ($this->request->isPost())
        {
            $params = $this->request->post("row/a");
            if ($params['password'])
            {
                $password = $params['password'];
                $salt = \fast\Random::alnum();
                $params = array_merge($params, ['password' => \addons\user\library\Auth::instance()->getEncryptPassword($password, $salt), 'salt' => $salt]);
            }
            else
            {
                unset($params['password']);
            }
            //身份变更推送
            if($params['old_group'] != $params['group_id']){
                $notice_str = "您的身份已更变为".get_user_group($params['group_id'])['name'];
                $opt1 = [
                    'topic' => 'pyjy/allroom/chat',
                    'payload' => [
                        'action'    => 'groupUpdate',
                        'data'      => [
                            'user_list'   => $ids,
                            'notice_str'  => $notice_str,
                            'group_id'    => $params['group_id'],
                        ],
                        'dataType'  => 'text',
                        'status'    => '1',
                    ],
                    'clientid' => 'h_'.md5(time())
                ];
                mqttPub($opt1);
            }
            //禁用用户推送
            if($params['status'] == 'hidden'){
                $opt2 = [
                    'topic' => 'pyjy/allroom/chat',
                    'payload' => [
                        'action'    => 'hiddenUser',
                        'data'      => [
                            'user_list'   => $ids,
                            'notice_str'  => '您的帐号已被禁用！',
                        ],
                        'dataType'  => 'text',
                        'status'    => '1',
                    ],
                    'clientid' => 'h_'.md5(time())
                ];
                mqttPub($opt2);

                $u = $this->model->where(['mobile' => $params['mobile']])->find();
                $up = [
                    'pan_time' => time(),
                    'pan_operator' => Session::get('admin')['nickname'],
                ];
                db('user')->where('id', $u['id'])->update($up);

                model('chatlog')->where('user_id', $u['id'])->update(['status' => 'hidden']);
            }

            if($params['isgag'] == '1'){
                $u = $this->model->where(['mobile' => $params['mobile']])->find();
                $up = [
                    'isgag' => 1,
                    'gag_time' => time(),
                    'gag_num' => $u['gag_num'] + 1,
                    'gag_operator' => Session::get('admin')['nickname'],
                ];
                db('user')->where('id', $u['id'])->update($up);
            }

            $this->request->post(['row' => $params]);
        }
        return parent::edit($ids);
    }

    /**
     * 批量更新
     */
    public function multi($ids = "")
    {
        $ids = $ids ? $ids : $this->request->param("ids");
        if ($ids)
        {
            if ($this->request->has('params'))
            {
                parse_str($this->request->post("params"), $values);
                $values = array_intersect_key($values, array_flip(is_array($this->multiFields) ? $this->multiFields : explode(',', $this->multiFields)));
                if ($values)
                {
                    $adminIds = $this->getDataLimitAdminIds();
                    if (is_array($adminIds))
                    {
                        $this->model->where($this->dataLimitField, 'in', $adminIds);
                    }

                    $count = $this->model->where($this->model->getPk(), 'in', $ids)->update($values);
                    if ($count)
                    {
                        //禁用用户推送
                        if($values['status'] == 'hidden'){
                            $opt = [
                                'topic' => 'pyjy/allroom/chat',
                                'payload' => [
                                    'action'    => 'hiddenUser',
                                    'data'      => [
                                        'user_list'   => $ids,
                                        'notice_str'  => '您的帐号已被禁用！',
                                    ],
                                    'dataType'  => 'text',
                                    'status'    => '1',
                                ],
                                'clientid' => 'h_'.md5(time())
                            ];
                            mqttPub($opt);

                            $up = [
                                'pan_time' => time(),
                                'pan_operator' => Session::get('admin')['nickname'],
                            ];
                            db('user')->where('id', 'in', $ids)->update($up);

                            model('chatlog')->where('user_id', 'in', $ids)->update(['status' => 'hidden']);
                        }
                        $this->success();
                    }
                    else
                    {
                        $this->error(__('No rows were updated'));
                    }
                }
                else
                {
                    $this->error(__('You have no permission'));
                }
            }
        }
        $this->error(__('Parameter %s can not be empty', 'ids'));
    }

    /**
     * 快捷搜索
     * @internal
     */
    public function selectpage()
    {
        $origin = parent::selectpage();
        $result = $origin->getData();
        $list = [];
        foreach ($result['list'] as $k => $v)
        {
            $list[] = ['id' => $v->id, 'nickname' => $v->nickname, 'username' => $v->username];
        }
        $result['list'] = $list;
        return json($result);
    }

    /**
     * 禁言
     */
    public function gag()
    {
        $userid = $this->request->param('user_id');
        $isgag = $this->request->param('gag');
        if ($this->request->isPost()) {

            $up['isgag'] = $isgag;

            if($isgag ==  1){
                $u = model('user')->where(['id' => $userid])->find();
                $up['gag_time'] = time();
                $up['gag_num'] = $u['gag_num'] + 1;
                $up['gag_operator'] = Session::get('admin')['nickname'];
            }

            db('user')->where('id', $userid)->update($up);

            $this->success();
        }
        $this->error(__('Parameter %s can not be empty', ''));
    }

    /**
     * 拉黑
     */
    public function pan()
    {
        $userid = $this->request->param('user_id');
        $status = $this->request->param('status');
        if ($this->request->isPost()) {
            model('chatlog')->where('user_id', $userid)->update(['status' => 'hidden']);
            $up['status'] = $status;

            if($status ==  'hidden'){
                $up['pan_time'] = time();
                $up['pan_operator'] = Session::get('admin')['nickname'];
            }

            db('user')->where('id', $userid)->update($up);

            $opt2 = [
                'topic' => 'pyjy/allroom/chat',
                'payload' => [
                    'action'    => 'hiddenUser',
                    'data'      => [
                        'user_list'   => $userid,
                        'notice_str'  => '您的帐号已被禁用！',
                    ],
                    'dataType'  => 'text',
                    'status'    => '1',
                ],
                'clientid' => 'h_'.md5(time())
            ];
            mqttPub($opt2);

            $this->success();
        }
        $this->error(__('Parameter %s can not be empty', ''));
    }

}
