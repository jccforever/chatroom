<?php

namespace app\admin\controller\user;

use app\common\controller\Backend;

use think\Controller;
use think\Request;

/**
 * 机器人列管理
 *
 * @icon fa fa-circle-o
 */
class Robot extends Backend
{
    
    /**
     * Robot模型对象
     */
    protected $model = null;
    protected $relationSearch = true;
    public function _initialize()
    {
        parent::_initialize();
        $this->model = model('User');
        $chatroom = model('chatroom')->where(['status'=>'normal'])->order('id','desc')->column('id,name');
        $this->view->assign('chatroom', $chatroom);
        $user_group = config('room.user_group');
        $this->view->assign('user_group', $user_group);
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
        if ($this->request->isAjax())
        {
            //如果发送的来源是Selectpage，则转发到Selectpage
            if ($this->request->request('pkey_name'))
            {
                return $this->selectpage();
            }
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();

            $total = $this->model
                    ->with("chatroom")
                    ->where($where)
                    ->where('is_robot',1)
                    ->order($sort, $order)
                    ->count();

            $list = $this->model
                    ->where($where)
                    ->where('is_robot',1)
                    ->with("chatroom")
                    ->order($sort, $order)
                    ->limit($offset, $limit)
                    ->select();
            foreach ($list as $k => $v) {
                $list[$k]['avatar'] = getUserFace($v['avatar']);
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
            $params['is_robot'] = 1;
            $params['username'] = $params['nickname'];
            $params['up_week'] = implode(',', $params['up_week']);
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

            $params['is_robot'] = 1;
            $params['username'] = $params['nickname'];
            $params['up_week'] = implode(',', $params['up_week']);
            //禁用用户时也禁言
            if($params['status'] == 'hidden'){
                $params['isgag'] = 1;
            }
            $this->request->post(['row' => $params]);
        }
        return parent::edit($ids);
    }
}
