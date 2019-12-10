<?php
use think\Cache;
use think\Db;
use think\Env;

// 公共助手函数
if (!function_exists('get_user_group')) {

    /**
     * 获取用户组
     * @param  string $name 语言变量名
     * @return array
     */
    function get_user_group($group_id = 0)
    {
        $user_group = config('room.user_group');
        $img = '/room/images/chatRoom/rank-' . $group_id . '.png';
        return ['img' => $img, 'name' => $user_group[$group_id]];
    }

}

//用户头像处理--------------统一使用http
function getUserFace($img = '')
{
    if(stripos($img,'http') !== 0){
        //本地网站头像
        return 'http://' . request()->host() . ($img ? $img : '/room/images/avatar.png');
    }else{
        //非本地网站头像
        return $img;
    }
}

if (!function_exists('getAdList')) {
    /**
     * 根据广告位置获取对应广告数据
     * @param  int $class_id 广告位置id
     * @param  int $roomid 房间id
     * @param  int $limit 读取数量
     * @return array            #
     */
    function getAdList($class_id, $roomid, $limit = 5)
    {
        if (empty($class_id) || empty($roomid))
            return false;

        $where = [
            'class_id' => $class_id,
            'status' => 'normal',
            'online_time' => array("elt", time()),
            'end_time' => array("egt", time()),
            'roomid' => $roomid,
        ];

        $adList = Db::name("advert")->where($where)->field(['id', 'content', 'url', 'img'])->order("sort desc")->limit($limit)->select();

        return empty($adList) ? [] : $adList;
    }
}

function logRecord($word = '', $file = '')
{
    if (empty($file))
        $fp = fopen("log.txt", "a");
    else
        $fp = fopen($file, "a");
    flock($fp, LOCK_EX);
    fwrite($fp, "执行日期：" . strftime("%Y%m%d%H%M%S", time()) . "\n" . $word . "\r\n");
    flock($fp, LOCK_UN);
    fclose($fp);
}

/**
 * 创建保存为桌面代码
 * @param String $filename 保存的文件名
 * @param String $url 访问的连接
 * @param String $icon 图标路径
 */
function createShortCut($filename, $url, $icon = '')
{

    // 创建基本代码
    $shortCut = "[InternetShortcut]\r\nIDList=[{000214A0-0000-0000-C000-000000000046}]\r\nProp3=19,2\r\n";
    $shortCut .= "URL=" . $url . "\r\n";
    if ($icon) {
        $shortCut .= "IconFile=" . $icon . "";
    }

    header("content-type:application/octet-stream");

    // 获取用户浏览器
    $user_agent = $_SERVER['HTTP_USER_AGENT'];
    $encode_filename = rawurlencode($filename);

    // 不同浏览器使用不同编码输出
    if (preg_match("/MSIE/", $user_agent)) {
        header('content-disposition:attachment; filename="' . $encode_filename . '"');
    } else if (preg_match("/Firefox/", $user_agent)) {
        header("content-disposition:attachment; filename*=\"utf8''" . $filename . '"');
    } else {
        header('content-disposition:attachment; filename="' . $filename . '"');
    }

    echo $shortCut;

}

//php  mqtt推送
function mqttPub($opt)
{
    //本地没有 不执行
    if(Env::get('mqtt.isdo') == 0){
        return;
    }
    $options = array_merge(config('room.mqtt'), $opt);
    $client = new Mosquitto\Client(md5(rand(0, 9999) . time()));
    $client->onConnect(function ($code, $message) use ($client, $options) {
        $payload = is_array($options['payload']) ? json_encode($options['payload']) : $options['payload'];
        $client->publish($options['topic'], $payload, $options['qos']);
        $client->disconnect();
    });

    $client->connect($options['host']);

    $client->loopForever();
}

/**
 * 过滤
 * @param $text
 * @param $pattern
 * @param except
 * @return mixed
 */
function filter($text, $pattern, $except = 0)
{

    $remark = 0;
    $res = '';
    $aiteName = '';
    if($except != 2){
        $pattern1 = '/([0-9]{3,4}-)?[0-9]{7,8}/';
        $pattern2 = '/((\+?86)|(\(\+86\)))?(13[012356789][0-9]{8}|15[012356789][0-9]{8}|18[02356789][0-9]{8}|147[0-9]{8}|1349[0-9]{7})/';

        //座机屏蔽
        preg_match_all($pattern1, $text, $matchs1);
        if(strpos($text, ' ') > 1){
            $aiteName = substr($text, 0,strpos($text, ' '));
            $text = str_replace($aiteName ,'__{S}__', $text);
        }

        foreach($matchs1 as $k1 => $v1){
            if($v1){
                for($i1=0;$i1<count($v1);$i1++){
                    $text = str_replace($v1[$i1],'***', $text);
                }
                $remark = 1;
            }
        }

        //手机号屏蔽
        preg_match_all($pattern2, $text, $matchs2);
        foreach($matchs2 as $k2 => $v2){
            if($v2){
                for($i2=0;$i2<count($v2);$i2++){
                    $text = str_replace($v2[$i2],'***', $text);
                }
                $remark = 1;
            }
        }

        $text = str_replace('__{S}__', $aiteName, $text);
        $res = preg_replace_callback($pattern, function ($m) use(&$remark){
            if(isset($m[1])){
                $remark = 1;
                return '***';
            }
            return $m[0];
        }, $text);


    }

    return ['remark' => $remark, 'content' => $res ? $res : $text];
}

/**
 * 删除指定的标签和内容
 * @param array $tags 需要删除的标签数组
 * @param string $str 数据源
 * @param string $content 是否删除标签内的内容 默认为0保留内容    1不保留内容
 * @return string
 */
function strip_html_tags($tags, $str, $content = 0)
{
    if ($content) {
        $html = array();
        foreach ($tags as $tag) {
            $html[] = '/(<' . $tag . '.*?>[\s|\S]*?<\/' . $tag . '>)/';
        }
        $data = preg_replace($html, '', $str);
    } else {
        $html = array();
        foreach ($tags as $tag) {
            $html[] = "/(<(?:\/" . $tag . "|" . $tag . ")[^>]*>)/i";
        }
        $data = preg_replace($html, '', $str);
    }
    return $data;
}

/**
 * 封装base64位图片上传
 * @param  string $base64
 * @param  string $path
 * @return boolean
 */
function base64_upload($base64, $path = '')
{
    $base64_image = str_replace(' ', '+', $base64);
    //post的数据里面，加号会被替换为空格，需要重新替换回来，如果不是post的数据，则注释掉这一行
    if (preg_match('/^(data:\s*image\/(\w+);base64,)/', $base64_image, $result)) {
        //图片后缀，jpeg换成jpg
        $ext = $result[2] == '.jpeg' ? '.jpg' : '.' . $result[2];
        //设置随机名称
        //        $image_name = substr(md5($base64), rand(0, 5), 5) . date('YmdHis') . rand(0, 9999) . $ext;
        $image_name = randStr(15).$ext;
        $path = !empty($path) ? $path : date('Y-m-d');
        $file_path = 'uploads/' . $path;
        if (!is_dir($file_path))
            mkdir($file_path, 0777);

        $image_file = $file_path . '/' . $image_name;
        //服务器文件存储路径
        if (file_put_contents($image_file, base64_decode(str_replace($result[1], '', $base64_image)))) {
            return ['status' => 1, 'src' => '/' . $image_file];
        } else {
            return ['status' => 0, 'src' => ''];
        }
    } else {
        return ['status' => 0, 'src' => ''];
    }
}
/**
 * 随机生成指定长度字符串函数
 *
 * @param int $length	#长度
 * @param int $type		#生成类型，1为文本，2为密码
 *
 * @return string
 */
function randStr($length=10, $type=1)
{
    if ($type==1){
        //文本
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    } else {
        //密码
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_ []{}<>~`+=,.;:/?|';
    }
    $str = '';
    for ( $i = 0; $i < ($length/2); $i++ )
    {
        // 这里提供两种字符获取方式
        // 第一种是使用substr 截取$chars中的任意一位字符；
        // 第二种是取字符数组$chars 的任意元素
        // $str .= substr($chars, mt_rand(0, strlen($chars) - 1), 1);
        $str .= $chars[ mt_rand(0, strlen($chars) - 1) ].rand(0,9);
    }
    return $str;
}
/**
 * POST 请求
 * @param string $url
 * @param array $param
 * @param boolean $post_file 是否文件上传
 * @return string content
 * @return int $return
 */
function http_post($url, $param, $post_file = false, $return = 1)
{
    $oCurl = curl_init();
    if (stripos($url, "https://") !== FALSE) {
        curl_setopt($oCurl, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($oCurl, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($oCurl, CURLOPT_SSLVERSION, 1); //CURL_SSLVERSION_TLSv1
    }

    if (is_string($param) || $post_file) {
        $strPOST = $param;
    } else {
        $aPOST = array();
        foreach ($param as $key => $val) {
            $aPOST[] = $key . "=" . urlencode($val);
        }
        $strPOST = join("&", $aPOST);
    }
    curl_setopt($oCurl, CURLOPT_URL, $url);
    curl_setopt($oCurl, CURLOPT_RETURNTRANSFER, $return);
    curl_setopt($oCurl, CURLOPT_POST, true);
    curl_setopt($oCurl, CURLOPT_POSTFIELDS, $strPOST);
    $sContent = curl_exec($oCurl);
    $aStatus = curl_getinfo($oCurl);

    $log_str = "\r\n" . 'request：' . $url . "\r\n";
    $log_str .= 'param：' . json_encode($param) . "\r\n";
    $log_str .= 'curl_exec：' . json_encode($sContent) . "\r\n";
    $log_str .= 'curl_getinfo：' . json_encode($aStatus) . "\r\n";
    file_put_contents('curl_post.log',$log_str, FILE_APPEND);

    curl_close($oCurl);
    if (intval($aStatus["http_code"]) == 200) {
        return $sContent;
    } else {
        return $sContent;
    }
}

/**
 * @param string $plaintext
 * @param int $type
 * @param string $conifgKey
 * @return array|string
 * 获取皇家会员接口参数
 */
function getSSOparams($plaintext = '', $type = 1, $des_key = '')
{
    try {
        error_reporting(E_ERROR | E_PARSE);
        $config = config('room.vip_sso');
        $des_key = $des_key == '' ? $config['deskey'] : $des_key;
        $des = new \room\Phpdes($des_key, $des_key);
        if ($type == 1) {
            $platform_params = $des->encrypt($plaintext);
            $regurl = request()->url(true);
            $sign_code = md5("platform={$config['platform']}&platform_params={$platform_params}" . $config['signkey']);
            return ['platform' => $config['platform'], 'platform_params' => $platform_params,'regurl'=>$regurl, 'sign_code' => $sign_code];
        } elseif ($type == 2) {
            $deStr = $des->decrypt($plaintext);
            $arr = explode('|$|', $deStr);
            $params = [];
            foreach ($arr as $k => $v) {
                $keyValue = explode('=', $v);
                $params[$keyValue[0]] = $keyValue[1];
            }
            return $params;
        }

    } catch (Exception $e) {
        return '';
    }
}

/**
 * 判断是否是手机端
 * @return bool
 */
function isMobile()
{
    $useragent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
    $useragent_commentsblock = preg_match('|\(.*?\)|', $useragent, $matches) > 0 ? $matches[0] : '';

    $mobile_os_list = ['Google Wireless Transcoder', 'Windows CE', 'WindowsCE', 'Symbian', 'Android', 'armv6l', 'armv5',
        'Mobile', 'CentOS', 'mowser', 'AvantGo', 'Opera Mobi', 'J2ME/MIDP', 'Smartphone', 'Go.Web', 'Palm', 'iPAQ'];
    $mobile_token_list = ['Profile/MIDP', 'Configuration/CLDC-', '160×160', '176×220', '240×240', '240×320', '320×240',
        'UP.Browser', 'UP.Link', 'SymbianOS', 'PalmOS', 'PocketPC', 'SonyEricsson', 'Nokia', 'BlackBerry', 'Vodafone',
        'BenQ', 'Novarra-Vision', 'Iris', 'NetFront', 'HTC_', 'Xda_', 'SAMSUNG-SGH', 'Wapaka', 'DoCoMo', 'iPhone', 'iPod', 'ipad'];

    $found_mobile = CheckSubstrs($mobile_os_list, $useragent_commentsblock) ||
        CheckSubstrs($mobile_token_list, $useragent);

    if ($found_mobile) {
        return true;
    }

    if (isset ($_SERVER['HTTP_USER_AGENT']))
    {
        $clientkeywords = array ('nokia',
            'sony',
            'ericsson',
            'mot',
            'samsung',
            'htc',
            'sgh',
            'lg',
            'sharp',
            'sie-',
            'philips',
            'panasonic',
            'alcatel',
            'lenovo',
            'iphone',
            'ipod',
            'blackberry',
            'meizu',
            'android',
            'netfront',
            'symbian',
            'ucweb',
            'windowsce',
            'palm',
            'operamini',
            'operamobi',
            'openwave',
            'nexusone',
            'cldc',
            'midp',
            'wap',
            'mobile'
        );
        // 从HTTP_USER_AGENT中查找手机浏览器的关键字
        if (preg_match("/(" . implode('|', $clientkeywords) . ")/i", strtolower($_SERVER['HTTP_USER_AGENT'])))
        {
            return true;
        }
    }
    return false;
}

function CheckSubstrs($substrs, $text)
{
    foreach ($substrs as $substr)
        if (false !== strpos($text, $substr)) {
            return true;
        }
    return false;
}

/**
 * 数字转换成ip
 * @param $n
 * @return string
 */
function intToIp($n)
{
    $iphex = dechex($n);//将10进制数字转换成16进制
    $len = strlen($iphex);//得到16进制字符串的长度
    if (strlen($iphex) < 8) {
        $iphex = '0' . $iphex;//如果长度小于8，在最前面加0
        $len = strlen($iphex); //重新得到16进制字符串的长度
    }
    //这是因为ipton函数得到的16进制字符串，如果第一位为0，在转换成数字后，是不会显示的
    //所以，如果长度小于8，肯定要把第一位的0加上去
    //为什么一定是第一位的0呢，因为在ipton函数中，后面各段加的'0'都在中间，转换成数字后，不会消失
    for ($i = 0, $j = 0; $j < $len; $i = $i + 1, $j = $j + 2) {//循环截取16进制字符串，每次截取2个长度
        $ippart = substr($iphex, $j, 2);//得到每段IP所对应的16进制数
        $fipart = substr($ippart, 0, 1);//截取16进制数的第一位
        if ($fipart == '0') {//如果第一位为0，说明原数只有1位
            $ippart = substr($ippart, 1, 1);//将0截取掉
        }
        $ip[] = hexdec($ippart);//将每段16进制数转换成对应的10进制数，即IP各段的值
    }
    $ip = array_reverse($ip);

    return implode('.', $ip);//连接各段，返回原IP值
}

/**
 * 根据session判断是否登录
 * @return string
 */
function isLogin()
{
    return session('user_auth') ? : false;
}

function filterEmoji($str)
{
    $str = preg_replace_callback(
        '/./u',
        function (array $match) {
            return strlen($match[0]) >= 4 ? '' : $match[0];
        },
        $str);
    return $str;
}