<?php

namespace addons\filemanager;

use app\common\library\Menu;
use think\Addons;

/**
 * 文件管理
 */
class Filemanager extends Addons
{

    /**
     * 插件安装方法
     * @return bool
     */
    public function install()
    {
        $menu = [
            [
                'name'    => 'general/filemanager',
                'title'   => '文件管理',
                'icon'    => 'fa fa-file',
                'sublist' => [
                    ['name' => 'general/filemanager/index', 'title' => '查看'],
                ]
            ]
        ];
        Menu::create($menu, 'general');
        return true;
    }

    /**
     * 插件卸载方法
     * @return bool
     */
    public function uninstall()
    {
        Menu::delete('general/filemanager');
        return true;
    }

}
