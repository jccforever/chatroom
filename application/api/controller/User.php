<?php

namespace app\api\controller;

use app\common\ApiFrontend;
use think\Response;

class User extends ApiFrontend
{
    /**
     * 我的关注列表
     * @return string|\think\response\Json
     */
    public function myFollow(){
        $page = (int)$this->request->param('page');
        $page_size = $this->request->param('page_size');

        if($page_size == ''){
            $followIds = model('follow')
                ->where('user_id', $this->user['id'])
                ->column('follow_id');

            $followUser = model('user')
                ->field('id,nickname,avatar,group_id,isgag')
                ->where(['status' => 'normal'])
                ->where(['group_id' => 2])
                ->whereOr(['id' => ['in', $followIds]])
                ->order('group_id desc, id desc')
                ->select();
        }else{
            $followIds = model('follow')
                ->where('user_id', $this->user['id'])
                ->column('follow_id');

            $followUser = model('user')
                ->field('id,nickname,avatar,group_id,isgag')
                ->where(['status' => 'normal'])
                ->where(['group_id' => 2])
                ->whereOr(['id' => ['in', $followIds]])
                ->order('group_id desc, id desc')
                ->page($page, $page_size)
                ->select();
        }

        foreach($followUser as $k=>$v){
            $followUser[$k]['avatar'] = getUserFace($v['avatar']);
        }

        return $this->response($followUser);
    }


    /**
     * 关注功能
     * @return \think\response\Json
     */
    public function follow()
    {
        $follow_id = $this->request->param('follow_id');
        $type    = $this->request->param('type');

        if (!isset($follow_id) || !isset($type))
            return $this->response(101);

        $userModel = model('follow');
        $followd = $userModel
            ->where(['user_id' => $this->user['id'], 'follow_id' => $follow_id])
            ->find();

        if($type == 1 && !$followd){
            if($this->user['id'] == $follow_id)
                return $this->response(1005);

            $data = [
                'user_id'=>$this->user['id'],
                'follow_id'=>$follow_id,
                'create_time'=>time()
            ];
            //添加关注
            $userModel->data($data);
            $rs = $userModel->allowField(true)->save();
        }else if($type != 1){
            //取消关注
            $rs = $userModel->where('id', '=', $followd['id'])->delete();
        }

            return $this->response(['result' => 1]);

        return $this->response(1004);
    }

    /**
     * 空操作
     * @param $name
     * @return mixed
     */
    public function _empty($name)
    {
        return Response::create()->code(404);
    }

}
