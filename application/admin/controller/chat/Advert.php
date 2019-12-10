<?php

namespace app\admin\controller\chat;

use app\common\controller\Backend;

use think\Controller;
use think\Request;

/**
 * 广告列管理
 *
 * @icon fa fa-circle-o
 */
class Advert extends Backend
{
    
    /**
     * Advert模型对象
     */
    protected $model = null;
    protected $relationSearch = true;
    public function _initialize()
    {
        parent::_initialize();
        $this->model = model('Advert');
        $chatroom = model('chatroom')
            ->where(['status'=>'normal'])
            ->order('id','desc')
            ->column('id,name');
        $this->view->assign('chatroom', $chatroom);

        $category = model('category')
            ->where(['status'=>'normal'])
            ->order('weigh','desc')
            ->column('id,name');
        $this->view->assign('category', $category);
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
                    ->with("chatroom,category")
                    ->where($where)
                    ->order($sort, $order)
                    ->count();

            $list = $this->model
                    ->where($where)
                    ->with("chatroom,category")
                    ->order($sort, $order)
                    ->limit($offset, $limit)
                    ->select();

            $result = array("total" => $total, "rows" => $list);

            return json($result);
        }
        return $this->view->fetch();
    }

}
