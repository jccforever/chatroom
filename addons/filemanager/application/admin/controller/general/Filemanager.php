<?php

namespace app\admin\controller\general;

use app\common\controller\Backend;

/**
 * 文件管理
 *
 * @icon fa fa-list
 * @remark 用于统一管理网站的所有分类,分类可进行无限级分类
 */
class Filemanager extends Backend
{

    protected $model = null;
    protected $layout = '';

    public function _initialize()
    {
        parent::_initialize();
    }

    public function index()
    {
        $addon = get_addon_config('filemanager');
        $addon['capabilities'] = explode(',', $addon['capabilities']);
        $cdnurl = preg_replace("/\/(\w+)\.php$/i", '', $this->request->root());
        $editorExtensions = [];
        if ($addon['editorExtensions'])
        {
            $editorExtensions = str_replace(["\r\n", "\r", "\n"], "", $addon['editorExtensions']);
            $editorExtensions = array_unique(array_filter(explode(',', $editorExtensions)));
        }
        $addon['editorExtensions'] = $editorExtensions;
        
        
        $this->view->replace('__ADDON__', $cdnurl . "/assets/addons/filemanager");
        $this->view->assign("addon", $addon);
        session('addons.filemanager', true);
        return $this->view->fetch();
    }

}
