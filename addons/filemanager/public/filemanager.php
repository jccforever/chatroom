<?php

/**
 * Entry point for PHP connector, put your customizations here.
 *
 * @license     MIT License
 * @author      Pavel Solomienko <https://github.com/servocoder/>
 * @copyright   Authors
 */
// only for debug
// error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
// ini_set('display_errors', '1');
// 定义目录分隔符
define('DS', DIRECTORY_SEPARATOR);

// 定义根目录
define('ROOT_PATH', __DIR__ . DS . '..' . DS);

// 定义应用目录
define('APP_PATH', ROOT_PATH . 'application' . DS);

// 定义filemanager插件所在目录
define('FM_PATH', ROOT_PATH . 'addons' . DS . 'filemanager' . DS);

require FM_PATH . 'api/vendor/autoload.php';

$addonConfigFile = FM_PATH . 'config.php';

if (!is_file($addonConfigFile))
{
    exit('addon not installed');
}
$config = [];
$configList = include $addonConfigFile;
foreach ($configList as $key => $value)
{
    $config[$value['name']] = $value['value'];
}
unset($configList);

$fileRoot = ROOT_PATH;

if ($config['directory'])
{
    $fileRoot = $config['directory'];
}

$restrictions = [];
if ($config['extensions'])
{
    $restrictions = str_replace(["\r\n", "\r", "\n"], "", $config['extensions']);
    $restrictions = array_unique(array_filter(explode(',', $restrictions)));
}

session_start();

// fix display non-latin chars correctly
// https://github.com/servocoder/RichFilemanager/issues/7
setlocale(LC_CTYPE, 'en_US.UTF-8');

// fix for undefined timezone in php.ini
// https://github.com/servocoder/RichFilemanager/issues/43
if (!ini_get('date.timezone'))
{
    date_default_timezone_set("Asia/Shanghai");
}

// This function is called for every server connection. It must return true.
//
// Implement this function to authenticate the user, for example to check a
// password login, or restrict client IP address.
//
// This function only authorizes the user to connect and/or load the initial page.
// Authorization for individual files or dirs is provided by the two functions below.
//
// NOTE: If using session variables, the session must be started first (session_start()).
function fm_authenticate()
{
    $admin = isset($_SESSION['think']['admin']) ? $_SESSION['think']['admin'] : null;
    if ($admin)
    {
        $filemanager = isset($_SESSION['think']['addons']['filemanager']) ? $_SESSION['think']['addons']['filemanager'] : false;
        if ($filemanager)
        {
            // Customize this code as desired.
            return true;
        }
    }

    // If this function returns false, the user will just see an error.
    // If this function returns an array with "redirect" key, the user will be redirected to the specified URL:
    // return ['redirect' => 'http://domain.my/login'];
}

// This function is called before any filesystem read operation, where
// $filepath is the file or directory being read. It must return true,
// otherwise the read operation will be denied.
//
// Implement this function to do custom individual-file permission checks, such as
// user/group authorization from a database, or session variables, or any other custom logic.
//
// Note that this is not the only permissions check that must pass. The read operation
// must also pass:
//   * Filesystem permissions (if any), e.g. POSIX `rwx` permissions on Linux
//   * The $filepath must be allowed according to config['patterns'] and config['extensions']
//
function fm_has_read_permission($filepath)
{
    // Customize this code as desired.
    return true;
}

// This function is called before any filesystem write operation, where
// $filepath is the file or directory being written to. It must return true,
// otherwise the write operation will be denied.
//
// Implement this function to do custom individual-file permission checks, such as
// user/group authorization from a database, or session variables, or any other custom logic.
//
// Note that this is not the only permissions check that must pass. The write operation
// must also pass:
//   * Filesystem permissions (if any), e.g. POSIX `rwx` permissions on Linux
//   * The $filepath must be allowed according to config['patterns'] and config['extensions']
//   * config['read_only'] must be set to false, otherwise all writes are disabled
//
function fm_has_write_permission($filepath)
{
    // Customize this code as desired.
    return true;
}

$config = [
    'options'  => [
        'serverRoot' => false,
        'fileRoot'   => $fileRoot
    ],
    'security' => [
        'readOnly'   => (boolean) $config['readOnly'],
        'extensions' => [
            'policy'       => 'ALLOW_LIST',
            'restrictions' => $restrictions,
        ],
    ],
];

$app = new \RFM\Application();

$local = new \RFM\Repository\Local\Storage($config);

// example to setup files root folder
//$local->setRoot('userfiles', true);

$app->setStorage($local);

// set application API
$app->api = new RFM\Api\LocalApi();

$app->run();
