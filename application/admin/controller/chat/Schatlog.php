<?php

namespace app\admin\controller\chat;

use app\common\controller\Backend;

use think\Controller;
use think\Request;
use think\Session;

/**
 * 会员管理
 *
 * @icon fa fa-circle-o
 */
class Schatlog extends Backend
{

    /**
     * Chatlog模型对象
     */
    protected $model = null;
    protected $relationSearch = true;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = model('Chatlog');

    }

    /**
     * 默认生成的控制器所继承的父类中有index/add/edit/del/multi五个方法
     * 因此在当前控制器中可不用编写增删改查的代码,如果需要自己控制这部分逻辑
     * 需要将application/admin/library/traits/Backend.php中对应的方法复制到当前控制器,然后进行修改
     */

    /**
     * 查看
     */
    public function index()
    {
        //设置过滤方法
        $this->request->filter(['strip_tags']);
        if ($this->request->isAjax()) {
            //如果发送的来源是Selectpage，则转发到Selectpage
            if ($this->request->request('pkey_name')) {
                return $this->selectpage();
            }

            list($where, $sort, $order, $offset, $limit) = $this->buildparams();

            $total = $this->model
                ->with("user")
                ->where($where)
                ->where('remark', 'neq', 0)
                ->order($sort, $order)
                ->count();

            $list = $this->model
                ->with("user")
                ->where($where)
                ->where('remark', 'neq', 0)
                ->order($sort, $order)
                ->limit($offset, $limit)
                ->select();
            foreach ($list as $k => $v) {
                $list[$k]['content'] = htmlspecialchars_decode(urldecode($v['content']),ENT_QUOTES);
            }
            $result = array("total" => $total, "rows" => $list);
            return json($result);
        }
        return $this->view->fetch();
    }

    /**
     * 编辑
     */
    public function edit($ids = NULL)
    {
        $ids = $this->request->param('ids');
        $row = $this->model->get($ids);
        if (!$row)
            $this->error(__('No Results were found'));

        $adminIds = $this->getDataLimitAdminIds();
        if (is_array($adminIds))
        {
            if (!in_array($row[$this->dataLimitField], $adminIds))
            {
                $this->error(__('You have no permission'));
            }
        }
        if ($this->request->isPost())
        {
            $params = $this->request->post("row/a");
            if ($params)
            {
                try
                {
                    //是否采用模型验证
                    if ($this->modelValidate)
                    {
                        $name = basename(str_replace('\\', '/', get_class($this->model)));
                        $validate = is_bool($this->modelValidate) ? ($this->modelSceneValidate ? $name . '.edit' : true) : $this->modelValidate;
                        $row->validate($validate);
                    }
                    $params['content'] = urlencode($params['content']);
                    $result = $row->allowField(true)->save($params);
                    if ($result !== false)
                    {
                        model('user')->save(['isgag' => $params['isgag']],['id' => $params['user_id']]);
                        //mqtt推送
                        if($params['status'] == 'hidden'){
                            $msg_list = $this->model->where('id', 'in', $ids)->column('msg_id');
                            $msgids = implode(',', $msg_list);
                            $data = [
                                'msg_id'     => $msgids,
                                'notice_str'  => '屏蔽消息',
                            ];
                            $opt = [
                                'topic' => 'pyjy/allroom/chat',
                                'payload' => [
                                    'action'    => 'hiddenMsg',
                                    'data'      => $data,
                                    'dataType'  => 'text',
                                    'status'    => '1',
                                ],
                                'clientid' => 'h_'.md5(time())
                            ];
                            mqttPub($opt);
//                            $u = model('user')->where(['id' => $params['user_id']])->find();
//                            $up = [
//                                'pan_time' => time(),
//                                'pan_operator' => Session::get('admin')['nickname'],
//                            ];
//                            db('user')->where('id', $u['id'])->update($up);
                        }

                        if($params['isgag'] == '1'){
                            $u = model('user')->where(['id' => $params['user_id']])->find();
                            $up = [
                                'isgag' => 1,
                                'gag_time' => time(),
                                'gag_num' => $u['gag_num'] + 1,
                                'gag_operator' => Session::get('admin')['nickname'],
                            ];
                            db('user')->where('id', $u['id'])->update($up);
                        }

                        $this->success();
                    }
                    else
                    {
                        $this->error($row->getError());
                    }
                }
                catch (\think\exception\PDOException $e)
                {
                    $this->error($e->getMessage());
                }
            }
            $this->error(__('Parameter %s can not be empty', ''));
        }

        $user = model('user')->get($row['user_id']);
        $row->isgag = $user->isgag;
        $row->username = $user->username;
        $row->nickname = $user->nickname;
        $row->content = htmlspecialchars_decode(urldecode($row->content),ENT_QUOTES);
        $this->view->assign("row", $row);
        return $this->view->fetch();
    }

    /**
     * 批量化禁言
     */
    public function forbid()
    {
        $userids = $this->request->param('userids');
        if ($this->request->isPost()) {
            //禁言用户
//            $result = model('user')->where('id', 'in', $userids)->update(['isgag' => 1]);
//            if ($result == 0) {
//                $this->error('用户状态更新失败');
//            }

            $uidArr = explode(',', $userids);

            if($uidArr){
                foreach($uidArr as $k=> $v){
                    $u = model('user')->get($v);
                    $up = [
                        'isgag' => 1,
                        'gag_time' => time(),
                        'gag_num' => $u['gag_num'] + 1,
                        'gag_operator' => Session::get('admin')['nickname'],
                    ];

                    db('user')->where('id', $u['id'])->update($up);
                }
            }

            $this->success();
        }
        $this->error(__('Parameter %s can not be empty', ''));
    }

    /**
     * 批量化禁言
     */
    public function hidden()
    {
        $ids = $this->request->param('ids');
        if ($this->request->isPost()) {
            //将消息更新为已禁言处理
            $result1 = $this->model->where('id', 'in', $ids)->update(['status' => 'hidden']);
            if ($result1 !== 0) {
                //mqtt推送
                $msg_list = $this->model->where('id', 'in', $ids)->column('msg_id');;
                $msgids = implode(',', $msg_list);
                $data = [
                    'msg_id'     => $msgids,
                    'notice_str'  => '屏蔽消息',
                ];
                $opt = [
                    'topic' => 'pyjy/allroom/chat',
                    'payload' => [
                        'action'    => 'hiddenMsg',
                        'data'      => $data,
                        'dataType'  => 'text',
                        'status'    => '1',
                    ],
                    'clientid' => 'h_'.md5(time())
                ];
                mqttPub($opt);
                $this->success();
            } else {
                $this->error('消息状态更新失败');
            }
        }
        $this->error(__('Parameter %s can not be empty', ''));
    }
}
