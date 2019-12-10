<?php

namespace addons\qiniu\controller;

use addons\qiniu\library\Auth;
use app\common\model\Attachment;
use think\addons\Controller;

/**
 * 七牛管理
 *
 */
class Index extends Controller
{

    public function index()
    {
        $this->error("当前插件暂无前台页面");
    }

    public function notify()
    {
        $config = get_addon_config('qiniu');
        $auth = new Auth($config['app_key'], $config['secret_key']);
        $contentType = 'application/x-www-form-urlencoded';
        $authorization = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        if (!$authorization)
        {
            $headers = apache_request_headers();
            $authorization = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        }

        $url = $config['notifyurl'];
        $body = file_get_contents('php://input');
        $ret = $auth->verifyCallback($contentType, $authorization, $url, $body);
        if ($ret)
        {
            parse_str($body, $arr);
            $imageInfo = json_decode($arr['imageInfo'], TRUE);
            $params = array(
                'filesize'    => $arr['filesize'],
                'imagewidth'  => isset($imageInfo['width']) ? $imageInfo['width'] : 0,
                'imageheight' => isset($imageInfo['height']) ? $imageInfo['height'] : 0,
                'imagetype'   => isset($imageInfo['format']) ? $imageInfo['format'] : '',
                'imageframes' => 1,
                'mimetype'    => "image/" . (isset($imageInfo['format']) ? $imageInfo['format'] : ''),
                'extparam'    => '',
                'url'         => '/' . $arr['key'],
                'uploadtime'  => time(),
                'storage'     => 'qiniu'
            );
            Attachment::create($params);
            return json(['ret' => 'success', 'code' => 1, 'data' => ['url' => $params['url']]]);
        }
        return json(['ret' => 'failed']);
    }

}
